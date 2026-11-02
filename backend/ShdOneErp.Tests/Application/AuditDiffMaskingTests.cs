using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Infrastructure.Persistence;
using ShdOneErp.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class AuditDiffMaskingTests
{
    [Fact]
    public async Task AuditSaveChangesInterceptor_SanitizesSensitiveFields_InAuditLog()
    {
        var currentUserMock = new Mock<ICurrentUser>();
        var currentUserId = Guid.NewGuid();
        currentUserMock.Setup(u => u.UserId).Returns(currentUserId);
        currentUserMock.Setup(u => u.Username).Returns("admin");

        var interceptor = new AuditSaveChangesInterceptor(currentUserMock.Object);

        var options = new DbContextOptionsBuilder<ShdOneErpDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(interceptor)
            .Options;

        using var context = new ShdOneErpDbContext(options);

        // Tạo user mới có PasswordHash nhạy cảm
        var user = new User("superadmin", "admin@shd.vn", "SuperSecretHash$123456", "Admin Quản trị");

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Kiểm tra AuditLog được tạo tự động
        var auditLogs = await context.AuditLogs.ToListAsync();
        auditLogs.Should().NotBeEmpty();

        var userAudit = auditLogs.FirstOrDefault(a => a.EntityName == nameof(User));
        userAudit.Should().NotBeNull();
        userAudit!.NewValues.Should().NotBeNull();

        // PasswordHash không được lộ trong JSON NewValues
        userAudit.NewValues.Should().NotContain("SuperSecretHash$123456");
        userAudit.NewValues.Should().Contain("***MASKED***");
    }
}

