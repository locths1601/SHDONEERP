using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Party360.DTOs;
using ShdOneErp.Application.Modules.Party360.Interfaces;
using ShdOneErp.Domain.Entities.Party;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Party360.Services;

public class PartyWriteService : IPartyWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public PartyWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
    }

    public async Task<Result<Guid>> CreatePersonAsync(CreatePersonPartyRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("party.profile.create", request.LegalEntityId, cancellationToken))
        {
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền tạo hồ sơ Party tại phạm vi này.");
        }

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.Parties.AnyAsync(p => p.Code == normalizedCode && !p.IsDeleted, cancellationToken);
        if (codeExists)
        {
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã định danh Party '{normalizedCode}' đã tồn tại.");
        }

        if (request.LegalEntityId.HasValue)
        {
            var legalEntityExists = await _context.LegalEntities.AnyAsync(le => le.Id == request.LegalEntityId.Value && !le.IsDeleted, cancellationToken);
            if (!legalEntityExists)
            {
                return Result<Guid>.Fail("LEGAL_ENTITY_NOT_FOUND", "Không tìm thấy pháp nhân chỉ định.");
            }
        }

        var party = new Party(PartyType.Person, normalizedCode);
        var person = new Person(
            party.Id,
            request.FirstName,
            request.LastName,
            request.DateOfBirth,
            request.Gender,
            request.Nationality);

        party.AttachPerson(person);

        if (!string.IsNullOrWhiteSpace(request.InitialRoleType))
        {
            party.AddRole(request.InitialRoleType, request.LegalEntityId);
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            party.AddContactMethod(ContactType.Email, request.Email, isPrimary: true);
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            party.AddContactMethod(ContactType.Phone, request.PhoneNumber, isPrimary: true);
        }

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            party.AddContactMethod(ContactType.Address, request.Address, isPrimary: false);
        }

        _context.Parties.Add(party);
        _context.Persons.Add(person);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(party.Id, "Tạo hồ sơ cá nhân (Person Party) thành công.");
    }

    public async Task<Result<Guid>> CreateOrganizationAsync(CreateOrganizationPartyRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("party.profile.create", request.LegalEntityId, cancellationToken))
        {
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền tạo đối tác tổ chức tại phạm vi này.");
        }

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.Parties.AnyAsync(p => p.Code == normalizedCode && !p.IsDeleted, cancellationToken);
        if (codeExists)
        {
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã định danh Party '{normalizedCode}' đã tồn tại.");
        }

        if (request.LegalEntityId.HasValue)
        {
            var legalEntityExists = await _context.LegalEntities.AnyAsync(le => le.Id == request.LegalEntityId.Value && !le.IsDeleted, cancellationToken);
            if (!legalEntityExists)
            {
                return Result<Guid>.Fail("LEGAL_ENTITY_NOT_FOUND", "Không tìm thấy pháp nhân chỉ định.");
            }
        }

        var party = new Party(PartyType.Organization, normalizedCode);
        var org = new OrganizationParty(
            party.Id,
            request.CompanyName,
            request.TradingName,
            request.TaxId,
            request.RegistrationNumber);

        party.AttachOrganizationParty(org);

        if (!string.IsNullOrWhiteSpace(request.InitialRoleType))
        {
            party.AddRole(request.InitialRoleType, request.LegalEntityId);
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            party.AddContactMethod(ContactType.Email, request.Email, isPrimary: true);
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            party.AddContactMethod(ContactType.Phone, request.PhoneNumber, isPrimary: true);
        }

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            party.AddContactMethod(ContactType.Address, request.Address, isPrimary: false);
        }

        _context.Parties.Add(party);
        _context.OrganizationParties.Add(org);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(party.Id, "Tạo hồ sơ đối tác/tổ chức (Organization Party) thành công.");
    }

    public async Task<Result> UpdatePersonAsync(Guid id, UpdatePersonPartyRequest request, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.Person)
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);

        if (party == null || party.Person == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ cá nhân.");
        }

        if (!await HasPartyScopeAsync("party.profile.edit", party, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền chỉnh sửa hồ sơ này.");
        }

        if (!VerifyRowVersion(party.RowVersion, request.RowVersionBase64))
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại.");
        }

        party.Person.Update(
            request.FirstName,
            request.LastName,
            request.DateOfBirth,
            request.Gender,
            request.Nationality);

        party.UpdateStatus(request.Status);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật thông tin cá nhân thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác.");
        }
    }

    public async Task<Result> UpdateOrganizationAsync(Guid id, UpdateOrganizationPartyRequest request, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.OrganizationParty)
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);

        if (party == null || party.OrganizationParty == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ đối tác/tổ chức.");
        }

        if (!await HasPartyScopeAsync("party.profile.edit", party, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền chỉnh sửa hồ sơ này.");
        }

        if (!VerifyRowVersion(party.RowVersion, request.RowVersionBase64))
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại.");
        }

        party.OrganizationParty.Update(
            request.CompanyName,
            request.TradingName,
            request.TaxId,
            request.RegistrationNumber);

        party.UpdateStatus(request.Status);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật thông tin tổ chức thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác.");
        }
    }

    public async Task<Result> UpdateStatusAsync(Guid id, UpdatePartyStatusRequest request, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);

        if (party == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ Party.");
        }

        if (!await HasPartyScopeAsync("party.profile.edit", party, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền thay đổi trạng thái hồ sơ này.");
        }

        if (!VerifyRowVersion(party.RowVersion, request.RowVersionBase64))
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã bị thay đổi bởi phiên làm việc khác.");
        }

        party.UpdateStatus(request.Status);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật trạng thái Party thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã bị thay đổi bởi phiên làm việc khác.");
        }
    }

    public async Task<Result> SoftDeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);

        if (party == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ Party.");
        }

        if (!await HasPartyScopeAsync("party.profile.edit", party, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền xóa hồ sơ này.");
        }

        party.SoftDelete();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Xóa mềm hồ sơ Party thành công.");
    }

    public async Task<Result> AddRoleAsync(Guid partyId, AddPartyRoleRequest request, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == partyId && !p.IsDeleted, cancellationToken);

        if (party == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ Party.");
        }

        if (!await HasPermissionAsync("party.profile.edit", request.LegalEntityId, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền gán vai trò tại pháp nhân này.");
        }

        party.AddRole(request.RoleType, request.LegalEntityId);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Thêm vai trò cho Party thành công.");
    }

    public async Task<Result> AddContactMethodAsync(Guid partyId, AddPartyContactMethodRequest request, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.ContactMethods)
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == partyId && !p.IsDeleted, cancellationToken);

        if (party == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ Party.");
        }

        if (!await HasPartyScopeAsync("party.profile.edit", party, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền cập nhật phương thức liên hệ.");
        }

        party.AddContactMethod(request.ContactType, request.Value, request.IsPrimary);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Thêm phương thức liên hệ thành công.");
    }

    public async Task<Result<Guid>> CreateStudentAsync(CreateStudentProfileRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("party.profile.create", request.LegalEntityId, cancellationToken))
        {
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền tạo hồ sơ học viên tại phạm vi này.");
        }

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.Parties.AnyAsync(p => p.Code == normalizedCode && !p.IsDeleted, cancellationToken);
        if (codeExists)
        {
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã học viên '{normalizedCode}' đã tồn tại trong hệ sinh thái.");
        }

        if (request.LegalEntityId.HasValue)
        {
            var legalEntityExists = await _context.LegalEntities.AnyAsync(le => le.Id == request.LegalEntityId.Value && !le.IsDeleted, cancellationToken);
            if (!legalEntityExists)
            {
                return Result<Guid>.Fail("LEGAL_ENTITY_NOT_FOUND", "Không tìm thấy pháp nhân chỉ định.");
            }
        }

        var party = new Party(PartyType.Person, normalizedCode);
        var person = new Person(
            party.Id,
            request.FirstName,
            request.LastName,
            request.DateOfBirth,
            request.Gender,
            request.Nationality);

        party.AttachPerson(person);

        // Kích hoạt vai trò Học viên (Student)
        party.AddRole("Student", request.LegalEntityId);

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            party.AddContactMethod(ContactType.Email, request.Email, isPrimary: true);
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            party.AddContactMethod(ContactType.Phone, request.PhoneNumber, isPrimary: true);
        }

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            party.AddContactMethod(ContactType.Address, request.Address, isPrimary: false);
        }

        if (!string.IsNullOrWhiteSpace(request.IdentificationNumber))
        {
            party.AddIdentification(
                request.IdentificationType ?? "CitizenId",
                request.IdentificationNumber,
                request.IssueDate,
                request.ExpiryDate,
                request.IssuingAuthority);
        }

        _context.Parties.Add(party);
        _context.Persons.Add(person);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(party.Id, "Tạo mới hồ sơ học viên thành công.");
    }

    public async Task<Result> AddIdentificationAsync(Guid partyId, AddPartyIdentificationRequest request, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.Identifications)
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == partyId && !p.IsDeleted, cancellationToken);

        if (party == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ Party.");
        }

        if (!await HasPartyScopeAsync("party.profile.edit", party, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền cập nhật giấy tờ định danh.");
        }

        party.AddIdentification(
            request.IdentificationType,
            request.IdentificationNumber,
            request.IssueDate,
            request.ExpiryDate,
            request.IssuingAuthority);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Thêm thông tin giấy tờ định danh thành công.");
    }

    public async Task<Result> AddRelationshipAsync(Guid partyId, AddPartyRelationshipRequest request, CancellationToken cancellationToken = default)
    {
        var party = await _context.Parties
            .Include(p => p.Relationships)
            .Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == partyId && !p.IsDeleted, cancellationToken);

        if (party == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ Party.");
        }

        if (!await HasPartyScopeAsync("party.profile.edit", party, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền cập nhật mối quan hệ người thân.");
        }

        var targetPartyExists = await _context.Parties.AnyAsync(p => p.Id == request.ToPartyId && !p.IsDeleted, cancellationToken);
        if (!targetPartyExists)
        {
            return Result.Fail("TARGET_PARTY_NOT_FOUND", "Không tìm thấy hồ sơ người thân/giám hộ chỉ định.");
        }

        party.AddRelationship(request.ToPartyId, request.RelationshipType);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Thêm mối quan hệ phụ huynh/người giám hộ thành công.");
    }

    private static bool VerifyRowVersion(byte[] entityRowVersion, string? requestRowVersionBase64)
    {
        if (string.IsNullOrEmpty(requestRowVersionBase64) || entityRowVersion.Length == 0)
            return true;

        var requestBytes = Convert.FromBase64String(requestRowVersionBase64);
        return requestBytes.SequenceEqual(entityRowVersion);
    }

    private async Task<bool> HasPartyScopeAsync(string permissionCode, Party party, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue) return false;

        // Check if user has global permission
        if (await _permissionResolver.HasGlobalPermissionAsync(_currentUser.UserId.Value, permissionCode, cancellationToken))
            return true;

        // Check if user has scoped permission for any of the party's legal entities
        foreach (var role in party.Roles.Where(r => r.LegalEntityId.HasValue && r.IsActive))
        {
            if (await _permissionResolver.HasPermissionAsync(
                _currentUser.UserId.Value,
                permissionCode,
                role.LegalEntityId,
                cancellationToken: cancellationToken))
            {
                return true;
            }
        }

        return false;
    }

    private async Task<bool> HasPermissionAsync(string permissionCode, Guid? legalEntityId, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue) return false;

        if (!legalEntityId.HasValue)
        {
            return await _permissionResolver.HasGlobalPermissionAsync(_currentUser.UserId.Value, permissionCode, cancellationToken);
        }

        return await _permissionResolver.HasPermissionAsync(
            _currentUser.UserId.Value,
            permissionCode,
            legalEntityId,
            cancellationToken: cancellationToken);
    }
}

