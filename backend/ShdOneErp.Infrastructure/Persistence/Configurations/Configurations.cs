using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Entities.Party;

namespace ShdOneErp.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Identity_Users");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Username).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(100).IsRequired();
        builder.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(20);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasIndex(x => x.Username).IsUnique();
        builder.HasIndex(x => x.Email).IsUnique();
    }
}

public class UserGroupConfiguration : IEntityTypeConfiguration<UserGroup>
{
    public void Configure(EntityTypeBuilder<UserGroup> builder)
    {
        builder.ToTable("Identity_UserGroups");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(250);
        builder.Property(x => x.ScopeType).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasIndex(x => x.Code).IsUnique();
    }
}

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Identity_Permissions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Module).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(250);

        builder.HasIndex(x => x.Code).IsUnique();
    }
}

public class UserGroupPermissionConfiguration : IEntityTypeConfiguration<UserGroupPermission>
{
    public void Configure(EntityTypeBuilder<UserGroupPermission> builder)
    {
        builder.ToTable("Identity_UserGroupPermissions");
        builder.HasKey(x => new { x.UserGroupId, x.PermissionId });

        builder.HasOne(x => x.UserGroup)
            .WithMany(x => x.GroupPermissions)
            .HasForeignKey(x => x.UserGroupId);

        builder.HasOne(x => x.Permission)
            .WithMany(x => x.GroupPermissions)
            .HasForeignKey(x => x.PermissionId);
    }
}

public class UserGroupMemberConfiguration : IEntityTypeConfiguration<UserGroupMember>
{
    public void Configure(EntityTypeBuilder<UserGroupMember> builder)
    {
        builder.ToTable("Identity_UserGroupMembers");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User)
            .WithMany(x => x.GroupMemberships)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.UserGroup)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.UserGroupId);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("Identity_RefreshTokens");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TokenHash).HasMaxLength(256).IsRequired();

        builder.HasOne(x => x.User)
            .WithMany(x => x.RefreshTokens)
            .HasForeignKey(x => x.UserId);
    }
}

public class LegalEntityConfiguration : IEntityTypeConfiguration<LegalEntity>
{
    public void Configure(EntityTypeBuilder<LegalEntity> builder)
    {
        builder.ToTable("Org_LegalEntities");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.TradingName).HasMaxLength(200);
        builder.Property(x => x.TaxCode).HasMaxLength(50);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.PhoneNumber).HasMaxLength(50);
        builder.Property(x => x.Email).HasMaxLength(100);
        builder.Property(x => x.Website).HasMaxLength(150);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasQueryFilter(x => !x.IsDeleted);
        builder.HasIndex(x => x.Code).IsUnique();
    }
}

public class BusinessUnitConfiguration : IEntityTypeConfiguration<BusinessUnit>
{
    public void Configure(EntityTypeBuilder<BusinessUnit> builder)
    {
        builder.ToTable("Org_BusinessUnits");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasQueryFilter(x => !x.IsDeleted);
        builder.HasOne(x => x.LegalEntity)
            .WithMany(x => x.BusinessUnits)
            .HasForeignKey(x => x.LegalEntityId);
    }
}

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("Org_Branches");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasQueryFilter(x => !x.IsDeleted);
        builder.HasOne(x => x.LegalEntity)
            .WithMany(x => x.Branches)
            .HasForeignKey(x => x.LegalEntityId);

        builder.HasOne(x => x.BusinessUnit)
            .WithMany(x => x.Branches)
            .HasForeignKey(x => x.BusinessUnitId);
    }
}

public class PartyConfiguration : IEntityTypeConfiguration<Party>
{
    public void Configure(EntityTypeBuilder<Party> builder)
    {
        builder.ToTable("Party_Parties");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PartyType).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class PersonConfiguration : IEntityTypeConfiguration<Person>
{
    public void Configure(EntityTypeBuilder<Person> builder)
    {
        builder.ToTable("Party_Persons");
        builder.HasKey(x => x.PartyId);
        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Gender).HasMaxLength(10);
        builder.Property(x => x.Nationality).HasMaxLength(50);

        builder.HasOne(x => x.Party)
            .WithOne(x => x.Person)
            .HasForeignKey<Person>(x => x.PartyId);
    }
}

public class OrganizationPartyConfiguration : IEntityTypeConfiguration<OrganizationParty>
{
    public void Configure(EntityTypeBuilder<OrganizationParty> builder)
    {
        builder.ToTable("Party_OrganizationParties");
        builder.HasKey(x => x.PartyId);
        builder.Property(x => x.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.TradingName).HasMaxLength(200);
        builder.Property(x => x.TaxId).HasMaxLength(50);
        builder.Property(x => x.RegistrationNumber).HasMaxLength(50);

        builder.HasOne(x => x.Party)
            .WithOne(x => x.OrganizationParty)
            .HasForeignKey<OrganizationParty>(x => x.PartyId);
    }
}

public class PartyRoleConfiguration : IEntityTypeConfiguration<PartyRole>
{
    public void Configure(EntityTypeBuilder<PartyRole> builder)
    {
        builder.ToTable("Party_PartyRoles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.RoleType).HasMaxLength(50).IsRequired();

        builder.HasOne(x => x.Party)
            .WithMany(x => x.Roles)
            .HasForeignKey(x => x.PartyId);
    }
}

public class PartyContactMethodConfiguration : IEntityTypeConfiguration<PartyContactMethod>
{
    public void Configure(EntityTypeBuilder<PartyContactMethod> builder)
    {
        builder.ToTable("Party_PartyContactMethods");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ContactType).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.Value).HasMaxLength(250).IsRequired();

        builder.HasOne(x => x.Party)
            .WithMany(x => x.ContactMethods)
            .HasForeignKey(x => x.PartyId);
    }
}

public class PartyIdentificationConfiguration : IEntityTypeConfiguration<PartyIdentification>
{
    public void Configure(EntityTypeBuilder<PartyIdentification> builder)
    {
        builder.ToTable("Party_PartyIdentifications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.IdentificationType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.IdentificationNumber).HasMaxLength(100).IsRequired();
        builder.Property(x => x.IssuingAuthority).HasMaxLength(200);

        builder.HasOne(x => x.Party)
            .WithMany(x => x.Identifications)
            .HasForeignKey(x => x.PartyId);
    }
}
