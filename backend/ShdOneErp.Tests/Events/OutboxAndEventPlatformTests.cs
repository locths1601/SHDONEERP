using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using ShdOneErp.Application.Common.Events;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Domain.Enums;
using ShdOneErp.Infrastructure.Events;
using ShdOneErp.Infrastructure.Persistence;
using Xunit;

namespace ShdOneErp.Tests.Events;

public class TestSampleDomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
    public string Message { get; set; } = string.Empty;
}

public class TestSampleEventHandler : IEventHandler<TestSampleDomainEvent>
{
    public int HandledCount { get; private set; }

    public Task HandleAsync(TestSampleDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        HandledCount++;
        return Task.CompletedTask;
    }
}

public class OutboxAndEventPlatformTests
{
    private ShdOneErpDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ShdOneErpDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ShdOneErpDbContext(options);
    }

    [Fact]
    public async Task EventDispatcher_DispatchesToRegisteredHandlers()
    {
        var services = new ServiceCollection();
        var handler = new TestSampleEventHandler();
        services.AddSingleton<IEventHandler<TestSampleDomainEvent>>(handler);

        var serviceProvider = services.BuildServiceProvider();
        var loggerMock = new Mock<ILogger<EventDispatcher>>();

        var dispatcher = new EventDispatcher(serviceProvider, loggerMock.Object);

        var sampleEvent = new TestSampleDomainEvent { Message = "Hello Event" };

        await dispatcher.DispatchAsync(sampleEvent);

        handler.HandledCount.Should().Be(1);
    }

    [Fact]
    public async Task MemoryIdempotencyStore_TracksProcessedMessages()
    {
        var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var store = new MemoryIdempotencyStore(memoryCache);

        var messageId = Guid.NewGuid();
        const string consumerName = "PaymentConsumer";

        // Chưa xử lý
        var before = await store.HasBeenProcessedAsync(messageId, consumerName);
        before.Should().BeFalse();

        // Đánh dấu đã xử lý
        await store.MarkProcessedAsync(messageId, consumerName);

        // Sau khi xử lý
        var after = await store.HasBeenProcessedAsync(messageId, consumerName);
        after.Should().BeTrue();
    }

    [Fact]
    public async Task OutboxProcessor_ProcessesPendingMessages_Successfully()
    {
        using var context = CreateInMemoryDbContext();
        var dispatcherMock = new Mock<IEventDispatcher>();
        var idempotencyMock = new Mock<IIdempotencyStore>();
        var loggerMock = new Mock<ILogger<OutboxProcessor>>();

        idempotencyMock.Setup(i => i.HasBeenProcessedAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Tạo 2 messages pending
        var msg1 = new OutboxMessage(typeof(TestSampleDomainEvent).FullName!, "{\"Message\":\"Test 1\"}");
        var msg2 = new OutboxMessage(typeof(TestSampleDomainEvent).FullName!, "{\"Message\":\"Test 2\"}");

        context.OutboxMessages.AddRange(msg1, msg2);
        await context.SaveChangesAsync();

        var processor = new OutboxProcessor(context, dispatcherMock.Object, idempotencyMock.Object, loggerMock.Object);

        var processedCount = await processor.ProcessPendingMessagesAsync(batchSize: 10);

        processedCount.Should().Be(2);

        var updatedMsg1 = await context.OutboxMessages.FindAsync(msg1.Id);
        updatedMsg1!.Status.Should().Be(OutboxMessageStatus.Processed);
        updatedMsg1.ProcessedOnUtc.Should().NotBeNull();
        updatedMsg1.Error.Should().BeNull();

        dispatcherMock.Verify(d => d.DispatchRawAsync(typeof(TestSampleDomainEvent).FullName!, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task OutboxProcessor_WhenDispatcherFails_IncrementsRetryCount()
    {
        using var context = CreateInMemoryDbContext();
        var dispatcherMock = new Mock<IEventDispatcher>();
        var idempotencyMock = new Mock<IIdempotencyStore>();
        var loggerMock = new Mock<ILogger<OutboxProcessor>>();

        dispatcherMock.Setup(d => d.DispatchRawAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("External service unavailable"));

        var msg = new OutboxMessage("SampleEvent", "{}");
        context.OutboxMessages.Add(msg);
        await context.SaveChangesAsync();

        var processor = new OutboxProcessor(context, dispatcherMock.Object, idempotencyMock.Object, loggerMock.Object);

        var processedCount = await processor.ProcessPendingMessagesAsync(batchSize: 10);

        processedCount.Should().Be(0);

        var updatedMsg = await context.OutboxMessages.FindAsync(msg.Id);
        updatedMsg!.Status.Should().Be(OutboxMessageStatus.Failed);
        updatedMsg.RetryCount.Should().Be(1);
        updatedMsg.Error.Should().Contain("External service unavailable");
    }

    [Fact]
    public async Task OutboxProcessor_WhenMaxRetriesReached_MarksDeadLetter()
    {
        using var context = CreateInMemoryDbContext();
        var dispatcherMock = new Mock<IEventDispatcher>();
        var idempotencyMock = new Mock<IIdempotencyStore>();
        var loggerMock = new Mock<ILogger<OutboxProcessor>>();

        dispatcherMock.Setup(d => d.DispatchRawAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Permanent failure"));

        var msg = new OutboxMessage("SampleEvent", "{}");
        // Giả lập đã thất bại 4 lần trước đó
        msg.RecordFailure("Error 1");
        msg.RecordFailure("Error 2");
        msg.RecordFailure("Error 3");
        msg.RecordFailure("Error 4");
        msg.ResetForRetry(); // Reset về Pending để được quét

        context.OutboxMessages.Add(msg);
        await context.SaveChangesAsync();

        var processor = new OutboxProcessor(context, dispatcherMock.Object, idempotencyMock.Object, loggerMock.Object);

        // Lần thứ 5 thất bại -> DeadLetter
        await processor.ProcessPendingMessagesAsync(batchSize: 10);

        var updatedMsg = await context.OutboxMessages.FindAsync(msg.Id);
        updatedMsg!.Status.Should().Be(OutboxMessageStatus.DeadLetter);
        updatedMsg.RetryCount.Should().Be(5);
    }

    [Fact]
    public async Task OutboxProcessor_RecordsProcessingHistory_ForEveryAttempt()
    {
        using var context = CreateInMemoryDbContext();
        var dispatcherMock = new Mock<IEventDispatcher>();
        var idempotencyMock = new Mock<IIdempotencyStore>();
        var loggerMock = new Mock<ILogger<OutboxProcessor>>();

        idempotencyMock.Setup(i => i.HasBeenProcessedAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var msg = new OutboxMessage(typeof(TestSampleDomainEvent).FullName!, "{\"Message\":\"History Tracking Test\"}");
        context.OutboxMessages.Add(msg);
        await context.SaveChangesAsync();

        var processor = new OutboxProcessor(context, dispatcherMock.Object, idempotencyMock.Object, loggerMock.Object);

        await processor.ProcessPendingMessagesAsync(batchSize: 10);

        var histories = await context.OutboxProcessingHistories.Where(h => h.MessageId == msg.Id).ToListAsync();
        histories.Should().HaveCount(1);
        histories[0].Status.Should().Be(OutboxMessageStatus.Processed);
        histories[0].ConsumerName.Should().Be("OutboxProcessor_Default");
        histories[0].AttemptNumber.Should().Be(1);
        histories[0].ErrorMessage.Should().BeNull();
        histories[0].DurationMs.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task AuditSaveChangesInterceptor_EnqueuesDomainEventsToOutbox_Atomically()
    {
        var currentUserMock = new Mock<ICurrentUser>();
        var currentUserId = Guid.NewGuid();
        currentUserMock.Setup(u => u.UserId).Returns(currentUserId);
        currentUserMock.Setup(u => u.Username).Returns("test.user");

        var interceptor = new ShdOneErp.Infrastructure.Persistence.Interceptors.AuditSaveChangesInterceptor(currentUserMock.Object);

        var options = new DbContextOptionsBuilder<ShdOneErpDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(interceptor)
            .Options;

        using var context = new ShdOneErpDbContext(options);

        var legalEntityId = Guid.NewGuid();
        var instance = new WorkflowInstance(
            definitionId: Guid.NewGuid(),
            definitionVersion: 1,
            legalEntityId: legalEntityId,
            entityType: "AdmissionDocument",
            entityId: "ADM-999",
            initialState: "Draft",
            requesterUserId: currentUserId,
            payloadJson: "{\"applicant\": \"Nguyen Van A\"}",
            workflowCode: "TEST_FLOW");

        instance.DomainEvents.Should().HaveCount(1);

        context.WorkflowInstances.Add(instance);
        await context.SaveChangesAsync();

        // Kiểm tra sau khi SaveChangesAsync:
        // 1. Domain events trên entity đã được dọn sạch để tránh dual-fire
        instance.DomainEvents.Should().BeEmpty();

        // 2. OutboxMessage đã được tạo tự động trong cùng DbContext transaction
        var outboxMessage = await context.OutboxMessages.FirstOrDefaultAsync();
        outboxMessage.Should().NotBeNull();
        outboxMessage!.EventType.Should().Contain("WorkflowStartedDomainEvent");
        outboxMessage.Status.Should().Be(OutboxMessageStatus.Pending);
        outboxMessage.AggregateType.Should().Be("WorkflowInstance");
        outboxMessage.AggregateId.Should().Be(instance.Id.ToString());
        outboxMessage.UserId.Should().Be(currentUserId);
    }
}

