using Microsoft.EntityFrameworkCore;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Entities.Party;

namespace ShdOneErp.Application.Common.Interfaces;

public interface IShdOneErpDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserGroup> UserGroups { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserGroupPermission> UserGroupPermissions { get; }
    DbSet<UserGroupMember> UserGroupMembers { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    DbSet<LegalEntity> LegalEntities { get; }
    DbSet<BusinessUnit> BusinessUnits { get; }
    DbSet<Branch> Branches { get; }

    DbSet<Party> Parties { get; }
    DbSet<Person> Persons { get; }
    DbSet<OrganizationParty> OrganizationParties { get; }
    DbSet<PartyRole> PartyRoles { get; }
    DbSet<PartyContactMethod> PartyContactMethods { get; }
    DbSet<PartyIdentification> PartyIdentifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
