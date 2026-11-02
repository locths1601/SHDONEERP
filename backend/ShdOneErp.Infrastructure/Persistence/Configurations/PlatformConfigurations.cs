using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("Audit_SystemLogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasMaxLength(50).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.UserName).HasMaxLength(100);
        builder.Property(x => x.IpAddress).HasMaxLength(50);
        builder.Property(x => x.UserAgent).HasMaxLength(500);
        builder.Property(x => x.CorrelationId).HasMaxLength(100);

        builder.HasIndex(x => new { x.EntityName, x.EntityId });
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.CreatedAtUtc);
    }
}

public class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("System_OutboxMessages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EventType).HasMaxLength(250).IsRequired();
        builder.Property(x => x.PayloadJson).IsRequired();
        builder.Property(x => x.CorrelationId).HasMaxLength(100);

        builder.HasIndex(x => new { x.ProcessedOnUtc, x.OccurredOnUtc });
    }
}

public class SystemModuleConfiguration : IEntityTypeConfiguration<SystemModule>
{
    public void Configure(EntityTypeBuilder<SystemModule> builder)
    {
        builder.ToTable("System_Modules");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Version).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasOne(x => x.ParentModule)
            .WithMany(x => x.ChildModules)
            .HasForeignKey(x => x.ParentModuleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Dependencies)
            .WithOne(x => x.Module)
            .HasForeignKey(x => x.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SystemModuleDependencyConfiguration : IEntityTypeConfiguration<SystemModuleDependency>
{
    public void Configure(EntityTypeBuilder<SystemModuleDependency> builder)
    {
        builder.ToTable("System_ModuleDependencies");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Module)
            .WithMany(x => x.Dependencies)
            .HasForeignKey(x => x.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.DependsOnModule)
            .WithMany()
            .HasForeignKey(x => x.DependsOnModuleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SystemFeatureConfiguration : IEntityTypeConfiguration<SystemFeature>
{
    public void Configure(EntityTypeBuilder<SystemFeature> builder)
    {
        builder.ToTable("System_Features");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasOne(x => x.Module)
            .WithMany(x => x.Features)
            .HasForeignKey(x => x.ModuleId);

        builder.HasOne(x => x.ParentFeature)
            .WithMany(x => x.ChildFeatures)
            .HasForeignKey(x => x.ParentFeatureId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SystemFeatureActionPermissionConfiguration : IEntityTypeConfiguration<SystemFeatureActionPermission>
{
    public void Configure(EntityTypeBuilder<SystemFeatureActionPermission> builder)
    {
        builder.ToTable("System_FeatureActionPermissions");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Feature)
            .WithMany(x => x.ActionPermissions)
            .HasForeignKey(x => x.FeatureId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MasterDataCatalogConfiguration : IEntityTypeConfiguration<MasterDataCatalog>
{
    public void Configure(EntityTypeBuilder<MasterDataCatalog> builder)
    {
        builder.ToTable("System_MasterDataCatalogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.OwnerModule).HasMaxLength(50).IsRequired().HasDefaultValue("SYSTEM");
        builder.Property(x => x.ScopePolicy).HasMaxLength(30).IsRequired().HasDefaultValue("GLOBAL");
        builder.Property(x => x.IsSystem).IsRequired();
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc);
        builder.HasIndex(x => x.Code).IsUnique();
    }
}

public class MasterDataItemConfiguration : IEntityTypeConfiguration<MasterDataItem>
{
    public void Configure(EntityTypeBuilder<MasterDataItem> builder)
    {
        builder.ToTable("System_MasterDataItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Value).HasMaxLength(500);
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.UpdatedAtUtc);

        builder.HasOne(x => x.Catalog)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.CatalogId);

        builder.HasOne(x => x.ParentItem)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.CatalogId, x.Code }).IsUnique();
    }
}

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Doc_Documents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(250).IsRequired();
        builder.Property(x => x.DocumentType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.DataClassification).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.StorageProvider).HasMaxLength(50).IsRequired();
        builder.Property(x => x.StoragePath).HasMaxLength(500).IsRequired();
        builder.Property(x => x.OriginalFileName).HasMaxLength(250).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Sha256Checksum).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasQueryFilter(x => !x.IsDeleted);

        builder.HasOne(x => x.LegalEntity)
            .WithMany()
            .HasForeignKey(x => x.LegalEntityId);

        builder.HasOne(x => x.Party)
            .WithMany()
            .HasForeignKey(x => x.PartyId)
            .IsRequired(false);

        builder.HasIndex(x => x.OwnerUserId);
        builder.HasIndex(x => x.LegalEntityId);
        builder.HasIndex(x => x.DataClassification);
    }
}

public class WorkflowDefinitionConfiguration : IEntityTypeConfiguration<WorkflowDefinition>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinition> builder)
    {
        builder.ToTable("Wf_Definitions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.InitialState).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasMany(x => x.Versions)
            .WithOne(x => x.Definition)
            .HasForeignKey(x => x.DefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class WorkflowDefinitionVersionConfiguration : IEntityTypeConfiguration<WorkflowDefinitionVersion>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinitionVersion> builder)
    {
        builder.ToTable("Wf_DefinitionVersions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.InitialState).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => new { x.DefinitionId, x.Version }).IsUnique();
    }
}

public class WorkflowInstanceConfiguration : IEntityTypeConfiguration<WorkflowInstance>
{
    public void Configure(EntityTypeBuilder<WorkflowInstance> builder)
    {
        builder.ToTable("Wf_Instances");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EntityId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CurrentState).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);

        builder.HasOne(x => x.Definition)
            .WithMany(x => x.Instances)
            .HasForeignKey(x => x.DefinitionId);

        builder.HasOne(x => x.LegalEntity)
            .WithMany()
            .HasForeignKey(x => x.LegalEntityId);

        builder.HasOne(x => x.BusinessUnit)
            .WithMany()
            .HasForeignKey(x => x.BusinessUnitId)
            .IsRequired(false);

        builder.HasIndex(x => new { x.EntityId, x.DefinitionId });
        builder.HasIndex(x => new { x.Status, x.LegalEntityId, x.BusinessUnitId });
    }
}

public class WorkflowHistoryConfiguration : IEntityTypeConfiguration<WorkflowHistory>
{
    public void Configure(EntityTypeBuilder<WorkflowHistory> builder)
    {
        builder.ToTable("Wf_History");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasMaxLength(50).IsRequired();
        builder.Property(x => x.FromState).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ToState).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Comments).HasMaxLength(1000);

        builder.HasOne(x => x.Instance)
            .WithMany(x => x.History)
            .HasForeignKey(x => x.InstanceId);

        builder.HasIndex(x => new { x.InstanceId, x.OccurredAtUtc });
    }
}

public class OutboxProcessingHistoryConfiguration : IEntityTypeConfiguration<OutboxProcessingHistory>
{
    public void Configure(EntityTypeBuilder<OutboxProcessingHistory> builder)
    {
        builder.ToTable("System_OutboxProcessingHistory");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ConsumerName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);

        builder.HasOne(x => x.Message)
            .WithMany(x => x.ProcessingHistories)
            .HasForeignKey(x => x.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.MessageId, x.ProcessedAtUtc });
    }
}

