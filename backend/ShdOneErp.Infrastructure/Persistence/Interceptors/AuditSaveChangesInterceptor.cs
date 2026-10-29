using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Infrastructure.Persistence.Interceptors;

public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUser _currentUser;

    private static readonly HashSet<string> SensitiveProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "PasswordHash", "TokenHash", "Secret", "SecurityStamp", "Salt", "PrivateKey", "RefreshToken"
    };

    public AuditSaveChangesInterceptor(ICurrentUser currentUser)
    {
        _currentUser = currentUser;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return base.SavingChangesAsync(eventData, result, cancellationToken);

        var context = eventData.Context;
        var auditEntries = CreateAuditEntries(context);

        // Process Outbox Messages from Domain Events
        ProcessDomainEvents(context);

        if (auditEntries.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditEntries);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private List<AuditLog> CreateAuditEntries(DbContext context)
    {
        context.ChangeTracker.DetectChanges();
        var auditLogs = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog or OutboxMessage || entry.State is EntityState.Detached or EntityState.Unchanged)
                continue;

            var action = entry.State switch
            {
                EntityState.Added => "Insert",
                EntityState.Modified => GetModifiedAction(entry),
                EntityState.Deleted => "HardDelete",
                _ => entry.State.ToString()
            };

            var entityName = entry.Entity.GetType().Name;
            var primaryKey = GetPrimaryKeyValue(entry);
            var legalEntityId = GetLegalEntityId(entry);

            var oldValues = new Dictionary<string, object?>();
            var newValues = new Dictionary<string, object?>();
            var affectedColumns = new List<string>();

            foreach (var property in entry.Properties)
            {
                if (property.IsTemporary)
                    continue;

                var propertyName = property.Metadata.Name;
                if (propertyName is "RowVersion")
                    continue;

                switch (entry.State)
                {
                    case EntityState.Added:
                        newValues[propertyName] = SanitizeValue(propertyName, property.CurrentValue);
                        affectedColumns.Add(propertyName);
                        break;

                    case EntityState.Deleted:
                        oldValues[propertyName] = SanitizeValue(propertyName, property.OriginalValue);
                        affectedColumns.Add(propertyName);
                        break;

                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            affectedColumns.Add(propertyName);
                            oldValues[propertyName] = SanitizeValue(propertyName, property.OriginalValue);
                            newValues[propertyName] = SanitizeValue(propertyName, property.CurrentValue);
                        }
                        break;
                }
            }

            var audit = new AuditLog(
                action: action,
                entityName: entityName,
                entityId: primaryKey,
                oldValues: oldValues.Count > 0 ? JsonSerializer.Serialize(oldValues) : null,
                newValues: newValues.Count > 0 ? JsonSerializer.Serialize(newValues) : null,
                affectedColumns: affectedColumns.Count > 0 ? string.Join(",", affectedColumns) : null,
                userId: _currentUser.UserId,
                userName: _currentUser.Username,
                legalEntityId: legalEntityId);

            auditLogs.Add(audit);
        }

        return auditLogs;
    }

    private static object? SanitizeValue(string propertyName, object? val)
    {
        if (val == null) return null;
        if (SensitiveProperties.Contains(propertyName))
            return "***MASKED***";
        return val;
    }

    private void ProcessDomainEvents(DbContext context)
    {
        var entitiesWithEvents = context.ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        foreach (var entity in entitiesWithEvents)
        {
            var events = entity.DomainEvents.ToList();
            entity.ClearDomainEvents();

            foreach (var domainEvent in events)
            {
                var eventType = domainEvent.GetType().FullName ?? domainEvent.GetType().Name;
                var payload = JsonSerializer.Serialize(domainEvent, domainEvent.GetType());

                Guid? legalEntityId = GetLegalEntityId(context.Entry(entity));
                string aggregateType = entity.GetType().Name;
                string aggregateId = entity.Id.ToString();
                Guid? userId = _currentUser.UserId;

                var outboxMessage = new OutboxMessage(
                    eventType,
                    payload,
                    legalEntityId: legalEntityId,
                    correlationId: null,
                    causationId: null,
                    aggregateType: aggregateType,
                    aggregateId: aggregateId,
                    userId: userId);

                context.Set<OutboxMessage>().Add(outboxMessage);
            }
        }
    }

    private static string GetModifiedAction(EntityEntry entry)
    {
        var isDeletedProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "IsDeleted");
        if (isDeletedProp != null && isDeletedProp.IsModified)
        {
            if (isDeletedProp.CurrentValue is true)
                return "SoftDelete";
            if (isDeletedProp.CurrentValue is false)
                return "Restore";
        }
        return "Update";
    }

    private static string GetPrimaryKeyValue(EntityEntry entry)
    {
        var key = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
        return key?.CurrentValue?.ToString() ?? Guid.NewGuid().ToString();
    }

    private static Guid? GetLegalEntityId(EntityEntry entry)
    {
        var legalEntityProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "LegalEntityId");
        if (legalEntityProp?.CurrentValue is Guid id)
            return id;

        // If the entity itself is LegalEntity
        if (entry.Entity.GetType().Name == "LegalEntity")
        {
            var idProp = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
            if (idProp?.CurrentValue is Guid entityId)
                return entityId;
        }

        return null;
    }
}
