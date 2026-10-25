using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Entities.Party;
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply Configurations
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new UserGroupConfiguration());
        modelBuilder.ApplyConfiguration(new PermissionConfiguration());
        modelBuilder.ApplyConfiguration(new UserGroupPermissionConfiguration());
        modelBuilder.ApplyConfiguration(new UserGroupMemberConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());

        modelBuilder.ApplyConfiguration(new LegalEntityConfiguration());
        modelBuilder.ApplyConfiguration(new BusinessUnitConfiguration());
        modelBuilder.ApplyConfiguration(new BranchConfiguration());

        modelBuilder.ApplyConfiguration(new PartyConfiguration());
        modelBuilder.ApplyConfiguration(new PersonConfiguration());
        modelBuilder.ApplyConfiguration(new OrganizationPartyConfiguration());
        modelBuilder.ApplyConfiguration(new PartyRoleConfiguration());
        modelBuilder.ApplyConfiguration(new PartyContactMethodConfiguration());
        modelBuilder.ApplyConfiguration(new PartyIdentificationConfiguration());
    }
}
