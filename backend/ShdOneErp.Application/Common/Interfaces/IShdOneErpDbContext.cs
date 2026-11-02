using Microsoft.EntityFrameworkCore;
using ShdOneErp.Domain.Entities.AdmissionVisa;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Entities.Party;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Application.Common.Interfaces;

public interface IShdOneErpDbContext
{
    // Identity & Access
    DbSet<User> Users { get; }
    DbSet<UserGroup> UserGroups { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserGroupPermission> UserGroupPermissions { get; }
    DbSet<UserGroupMember> UserGroupMembers { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    // Organization
    DbSet<LegalEntity> LegalEntities { get; }
    DbSet<BusinessUnit> BusinessUnits { get; }
    DbSet<Branch> Branches { get; }

    // Party 360
    DbSet<Party> Parties { get; }
    DbSet<Person> Persons { get; }
    DbSet<OrganizationParty> OrganizationParties { get; }
    DbSet<PartyRole> PartyRoles { get; }
    DbSet<PartyContactMethod> PartyContactMethods { get; }
    DbSet<PartyIdentification> PartyIdentifications { get; }
    DbSet<PartyRelationship> PartyRelationships { get; }

    // Admission & Visa
    DbSet<StudentApplication> StudentApplications { get; }
    DbSet<ChecklistItem> ChecklistItems { get; }
    DbSet<ApplicationDocumentLink> ApplicationDocumentLinks { get; }

    // Foundation Platform
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<OutboxMessage> OutboxMessages { get; }
    DbSet<SystemModule> SystemModules { get; }
    DbSet<SystemFeature> SystemFeatures { get; }
    DbSet<SystemModuleDependency> SystemModuleDependencies { get; }
    DbSet<SystemFeatureActionPermission> SystemFeatureActionPermissions { get; }
    DbSet<MasterDataCatalog> MasterDataCatalogs { get; }
    DbSet<MasterDataItem> MasterDataItems { get; }
    DbSet<Document> Documents { get; }
    DbSet<WorkflowDefinition> WorkflowDefinitions { get; }
    DbSet<WorkflowDefinitionVersion> WorkflowDefinitionVersions { get; }
    DbSet<WorkflowInstance> WorkflowInstances { get; }
    DbSet<WorkflowHistory> WorkflowHistories { get; }
    DbSet<OutboxProcessingHistory> OutboxProcessingHistories { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
