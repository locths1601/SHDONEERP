using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Party360.DTOs;

namespace ShdOneErp.Application.Modules.Party360.Interfaces;

public interface IPartyReadService
{
    Task<PagedResult<PartyListItemDto>> GetPagedAsync(PartyFilterQuery query, CancellationToken cancellationToken = default);
    Task<PartyDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<StudentListItemDto>> GetStudentsPagedAsync(PartyFilterQuery query, CancellationToken cancellationToken = default);
    Task<PartyDetailDto?> GetStudentDetailAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IPartyWriteService
{
    Task<Result<Guid>> CreatePersonAsync(CreatePersonPartyRequest request, CancellationToken cancellationToken = default);
    Task<Result<Guid>> CreateOrganizationAsync(CreateOrganizationPartyRequest request, CancellationToken cancellationToken = default);
    Task<Result<Guid>> CreateStudentAsync(CreateStudentProfileRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdatePersonAsync(Guid id, UpdatePersonPartyRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateOrganizationAsync(Guid id, UpdateOrganizationPartyRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateStatusAsync(Guid id, UpdatePartyStatusRequest request, CancellationToken cancellationToken = default);
    Task<Result> SoftDeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> AddRoleAsync(Guid partyId, AddPartyRoleRequest request, CancellationToken cancellationToken = default);
    Task<Result> AddContactMethodAsync(Guid partyId, AddPartyContactMethodRequest request, CancellationToken cancellationToken = default);
    Task<Result> AddIdentificationAsync(Guid partyId, AddPartyIdentificationRequest request, CancellationToken cancellationToken = default);
    Task<Result> AddRelationshipAsync(Guid partyId, AddPartyRelationshipRequest request, CancellationToken cancellationToken = default);
}

