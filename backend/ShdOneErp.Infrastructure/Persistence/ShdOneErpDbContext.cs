using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Entities.AdmissionVisa;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Entities.Party;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Infrastructure.Persistence.Configurations;

namespace ShdOneErp.Infrastructure.Persistence;

public class ShdOneErpDbContext : DbContext, IShdOneErpDbContext
{
    public ShdOneErpDbContext(DbContextOptions<ShdOneErpDbContext> options) : base(options)
    {
    }

    // Identity & Access
    public DbSet<User> Users => Set<User>();
    public DbSet<UserGroup> UserGroups => Set<UserGroup>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserGroupPermission> UserGroupPermissions => Set<UserGroupPermission>();
    public DbSet<UserGroupMember> UserGroupMembers => Set<UserGroupMember>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Organization
    public DbSet<LegalEntity> LegalEntities => Set<LegalEntity>();
    public DbSet<BusinessUnit> BusinessUnits => Set<BusinessUnit>();
    public DbSet<Branch> Branches => Set<Branch>();

    // Party 360
    public DbSet<Party> Parties => Set<Party>();
    public DbSet<Person> Persons => Set<Person>();
    public DbSet<OrganizationParty> OrganizationParties => Set<OrganizationParty>();
    public DbSet<PartyRole> PartyRoles => Set<PartyRole>();
    public DbSet<PartyContactMethod> PartyContactMethods => Set<PartyContactMethod>();
    public DbSet<PartyIdentification> PartyIdentifications => Set<PartyIdentification>();
    public DbSet<PartyRelationship> PartyRelationships => Set<PartyRelationship>();

    // Admission & Visa
    public DbSet<StudentApplication> StudentApplications => Set<StudentApplication>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
    public DbSet<ApplicationDocumentLink> ApplicationDocumentLinks => Set<ApplicationDocumentLink>();

    // Foundation Platform
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<SystemModule> SystemModules => Set<SystemModule>();
    public DbSet<SystemFeature> SystemFeatures => Set<SystemFeature>();
    public DbSet<SystemModuleDependency> SystemModuleDependencies => Set<SystemModuleDependency>();
    public DbSet<SystemFeatureActionPermission> SystemFeatureActionPermissions => Set<SystemFeatureActionPermission>();
    public DbSet<MasterDataCatalog> MasterDataCatalogs => Set<MasterDataCatalog>();
    public DbSet<MasterDataItem> MasterDataItems => Set<MasterDataItem>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<WorkflowDefinition> WorkflowDefinitions => Set<WorkflowDefinition>();
    public DbSet<WorkflowDefinitionVersion> WorkflowDefinitionVersions => Set<WorkflowDefinitionVersion>();
    public DbSet<WorkflowInstance> WorkflowInstances => Set<WorkflowInstance>();
    public DbSet<WorkflowHistory> WorkflowHistories => Set<WorkflowHistory>();
    public DbSet<OutboxProcessingHistory> OutboxProcessingHistories => Set<OutboxProcessingHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply Configurations - Identity & Access
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new UserGroupConfiguration());
        modelBuilder.ApplyConfiguration(new PermissionConfiguration());
        modelBuilder.ApplyConfiguration(new UserGroupPermissionConfiguration());
        modelBuilder.ApplyConfiguration(new UserGroupMemberConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());

        // Apply Configurations - Organization
        modelBuilder.ApplyConfiguration(new LegalEntityConfiguration());
        modelBuilder.ApplyConfiguration(new BusinessUnitConfiguration());
        modelBuilder.ApplyConfiguration(new BranchConfiguration());

        // Apply Configurations - Party 360
        modelBuilder.ApplyConfiguration(new PartyConfiguration());
        modelBuilder.ApplyConfiguration(new PersonConfiguration());
        modelBuilder.ApplyConfiguration(new OrganizationPartyConfiguration());
        modelBuilder.ApplyConfiguration(new PartyRoleConfiguration());
        modelBuilder.ApplyConfiguration(new PartyContactMethodConfiguration());
        modelBuilder.ApplyConfiguration(new PartyIdentificationConfiguration());
        modelBuilder.ApplyConfiguration(new PartyRelationshipConfiguration());

        // Apply Configurations - Admission & Visa
        modelBuilder.ApplyConfiguration(new StudentApplicationConfiguration());
        modelBuilder.ApplyConfiguration(new ChecklistItemConfiguration());
        modelBuilder.ApplyConfiguration(new ApplicationDocumentLinkConfiguration());

        // Apply Configurations - Foundation Platform
        modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new OutboxMessageConfiguration());
        modelBuilder.ApplyConfiguration(new OutboxProcessingHistoryConfiguration());
        modelBuilder.ApplyConfiguration(new SystemModuleConfiguration());
        modelBuilder.ApplyConfiguration(new SystemFeatureConfiguration());
        modelBuilder.ApplyConfiguration(new SystemModuleDependencyConfiguration());
        modelBuilder.ApplyConfiguration(new SystemFeatureActionPermissionConfiguration());
        modelBuilder.ApplyConfiguration(new MasterDataCatalogConfiguration());
        modelBuilder.ApplyConfiguration(new MasterDataItemConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentConfiguration());
        modelBuilder.ApplyConfiguration(new WorkflowDefinitionConfiguration());
        modelBuilder.ApplyConfiguration(new WorkflowDefinitionVersionConfiguration());
        modelBuilder.ApplyConfiguration(new WorkflowInstanceConfiguration());
        modelBuilder.ApplyConfiguration(new WorkflowHistoryConfiguration());
    }
}
