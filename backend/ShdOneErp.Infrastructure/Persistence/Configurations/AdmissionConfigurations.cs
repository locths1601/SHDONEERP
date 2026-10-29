using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShdOneErp.Domain.Entities.AdmissionVisa;

namespace ShdOneErp.Infrastructure.Persistence.Configurations;

public class StudentApplicationConfiguration : IEntityTypeConfiguration<StudentApplication>
{
    public void Configure(EntityTypeBuilder<StudentApplication> builder)
    {
        builder.ToTable("Adm_StudentApplications");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ApplicationCode).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TargetMarket).HasMaxLength(100).IsRequired();
        builder.Property(x => x.IntakeTerm).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ProgramName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasQueryFilter(x => !x.IsDeleted);

        builder.HasOne(x => x.LegalEntity)
            .WithMany()
            .HasForeignKey(x => x.LegalEntityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.BusinessUnit)
            .WithMany()
            .HasForeignKey(x => x.BusinessUnitId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Branch)
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.StudentParty)
            .WithMany()
            .HasForeignKey(x => x.StudentPartyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.ChecklistItems)
            .WithOne(c => c.StudentApplication)
            .HasForeignKey(c => c.StudentApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.ApplicationCode).IsUnique();
        builder.HasIndex(x => x.StudentPartyId);
        builder.HasIndex(x => x.LegalEntityId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.IntakeTerm);
    }
}

public class ChecklistItemConfiguration : IEntityTypeConfiguration<ChecklistItem>
{
    public void Configure(EntityTypeBuilder<ChecklistItem> builder)
    {
        builder.ToTable("Adm_ChecklistItems");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ItemCode).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ItemName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(500);
        builder.Property(x => x.RejectionReason).HasMaxLength(500);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasMany(x => x.DocumentLinks)
            .WithOne(l => l.ChecklistItem)
            .HasForeignKey(l => l.ChecklistItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.StudentApplicationId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => new { x.StudentApplicationId, x.ItemCode }).IsUnique();
    }
}

public class ApplicationDocumentLinkConfiguration : IEntityTypeConfiguration<ApplicationDocumentLink>
{
    public void Configure(EntityTypeBuilder<ApplicationDocumentLink> builder)
    {
        builder.ToTable("Adm_ApplicationDocumentLinks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasOne(x => x.ChecklistItem)
            .WithMany(c => c.DocumentLinks)
            .HasForeignKey(x => x.ChecklistItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Document)
            .WithMany()
            .HasForeignKey(x => x.DocumentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.ChecklistItemId);
        builder.HasIndex(x => x.DocumentId);
    }
}

