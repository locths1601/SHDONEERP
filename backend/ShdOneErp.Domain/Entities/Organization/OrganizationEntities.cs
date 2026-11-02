using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Domain.Entities.Organization;

public class LegalEntity : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? TradingName { get; private set; }
    public string? TaxCode { get; private set; }
    public string? Address { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? Email { get; private set; }
    public string? Website { get; private set; }
    public EntityStatus Status { get; private set; } = EntityStatus.Active;
    public bool IsDeleted { get; private set; } = false;
    public DateTime? DeletedAtUtc { get; private set; }

    public ICollection<BusinessUnit> BusinessUnits { get; private set; } = new List<BusinessUnit>();
    public ICollection<Branch> Branches { get; private set; } = new List<Branch>();

    private LegalEntity() { } // For EF Core

    public LegalEntity(
        string code,
        string name,
        string? tradingName = null,
        string? taxCode = null,
        string? address = null,
        string? phoneNumber = null,
        string? email = null,
        string? website = null,
        EntityStatus status = EntityStatus.Active)
    {
        SetCode(code);
        SetName(name);
        TradingName = tradingName?.Trim();
        TaxCode = taxCode?.Trim();
        Address = address?.Trim();
        PhoneNumber = phoneNumber?.Trim();
        Email = email?.Trim().ToLowerInvariant();
        Website = website?.Trim();
        Status = status;
    }

    public void Update(
        string name,
        string? tradingName,
        string? taxCode,
        string? address,
        string? phoneNumber,
        string? email,
        string? website,
        EntityStatus status)
    {
        SetName(name);
        TradingName = tradingName?.Trim();
        TaxCode = taxCode?.Trim();
        Address = address?.Trim();
        PhoneNumber = phoneNumber?.Trim();
        Email = email?.Trim().ToLowerInvariant();
        Website = website?.Trim();
        Status = status;
        MarkUpdated();
    }

    public void SoftDelete()
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }

    public void Restore()
    {
        if (!IsDeleted) return;
        IsDeleted = false;
        DeletedAtUtc = null;
        MarkUpdated();
    }

    private void SetCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_LEGAL_ENTITY_CODE", "Mã pháp nhân không được để trống.");
        Code = code.Trim().ToUpperInvariant();
    }

    private void SetName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_LEGAL_ENTITY_NAME", "Tên pháp nhân không được để trống.");
        Name = name.Trim();
    }
}

public class BusinessUnit : BaseEntity
{
    public Guid LegalEntityId { get; private set; }
    public LegalEntity? LegalEntity { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public EntityStatus Status { get; private set; } = EntityStatus.Active;
    public bool IsDeleted { get; private set; } = false;
    public DateTime? DeletedAtUtc { get; private set; }

    public ICollection<Branch> Branches { get; private set; } = new List<Branch>();

    private BusinessUnit() { }

    public BusinessUnit(Guid legalEntityId, string code, string name, EntityStatus status = EntityStatus.Active)
    {
        if (legalEntityId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_LEGAL_ENTITY_ID", "Pháp nhân là bắt buộc.");
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_BUSINESS_UNIT_CODE", "Mã đơn vị kinh doanh không được để trống.");
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_BUSINESS_UNIT_NAME", "Tên đơn vị kinh doanh không được để trống.");
        if (!Enum.IsDefined(status))
            throw new BusinessRuleViolationException("INVALID_BUSINESS_UNIT_STATUS", "Trạng thái đơn vị kinh doanh không hợp lệ.");

        LegalEntityId = legalEntityId;
        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Status = status;
    }

    public void Update(string name, EntityStatus status)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_BUSINESS_UNIT_NAME", "Tên đơn vị kinh doanh không được để trống.");
        if (!Enum.IsDefined(status))
            throw new BusinessRuleViolationException("INVALID_BUSINESS_UNIT_STATUS", "Trạng thái đơn vị kinh doanh không hợp lệ.");

        Name = name.Trim();
        Status = status;
        MarkUpdated();
    }

    public void SoftDelete()
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }
}

public class Branch : BaseEntity
{
    public Guid LegalEntityId { get; private set; }
    public LegalEntity? LegalEntity { get; private set; }

    public Guid? BusinessUnitId { get; private set; }
    public BusinessUnit? BusinessUnit { get; private set; }

    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Address { get; private set; }
    public EntityStatus Status { get; private set; } = EntityStatus.Active;
    public bool IsDeleted { get; private set; } = false;
    public DateTime? DeletedAtUtc { get; private set; }

    private Branch() { }

    public Branch(Guid legalEntityId, string code, string name, Guid? businessUnitId = null, string? address = null, EntityStatus status = EntityStatus.Active)
    {
        if (legalEntityId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_LEGAL_ENTITY_ID", "Pháp nhân là bắt buộc.");
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_BRANCH_CODE", "Mã chi nhánh/cơ sở không được để trống.");
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_BRANCH_NAME", "Tên chi nhánh/cơ sở không được để trống.");
        if (!Enum.IsDefined(status))
            throw new BusinessRuleViolationException("INVALID_BRANCH_STATUS", "Trạng thái chi nhánh không hợp lệ.");

        LegalEntityId = legalEntityId;
        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        BusinessUnitId = businessUnitId;
        Address = address?.Trim();
        Status = status;
    }

    public void Update(string name, Guid? businessUnitId, string? address, EntityStatus status)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_BRANCH_NAME", "Tên chi nhánh/cơ sở không được để trống.");
        if (!Enum.IsDefined(status))
            throw new BusinessRuleViolationException("INVALID_BRANCH_STATUS", "Trạng thái chi nhánh không hợp lệ.");

        Name = name.Trim();
        BusinessUnitId = businessUnitId;
        Address = address?.Trim();
        Status = status;
        MarkUpdated();
    }

    public void SoftDelete()
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }
}
