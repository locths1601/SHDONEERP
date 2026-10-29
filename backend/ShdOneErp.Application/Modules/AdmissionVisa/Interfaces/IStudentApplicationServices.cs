using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;

namespace ShdOneErp.Application.Modules.AdmissionVisa.Interfaces;

public interface IStudentApplicationReadService
{
    Task<PagedResult<StudentApplicationListItemDto>> GetApplicationsPagedAsync(
        StudentApplicationFilterQuery query,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<StudentApplicationDetailDto?> GetApplicationDetailAsync(
        Guid applicationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<List<StudentApplicationListItemDto>> GetApplicationsByStudentPartyIdAsync(
        Guid studentPartyId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}

public interface IStudentApplicationWriteService
{
    Task<Result<Guid>> CreateApplicationAsync(
        CreateStudentApplicationRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result> UpdateApplicationAsync(
        Guid id,
        UpdateStudentApplicationRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result> UpdateStatusAsync(
        Guid id,
        UpdateStudentApplicationStatusRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result> DeleteApplicationAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}

public interface IChecklistReadService
{
    Task<List<ChecklistItemDto>> GetChecklistByApplicationIdAsync(
        Guid applicationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ChecklistItemDto?> GetChecklistItemByIdAsync(
        Guid checklistItemId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}

public interface IChecklistWriteService
{
    Task<Result<Guid>> AddChecklistItemAsync(
        Guid applicationId,
        AddChecklistItemRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result> VerifyChecklistItemAsync(
        Guid checklistItemId,
        VerifyChecklistItemRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result> RejectChecklistItemAsync(
        Guid checklistItemId,
        RejectChecklistItemRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result> ResetChecklistItemAsync(
        Guid checklistItemId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result<Guid>> LinkDocumentAsync(
        Guid checklistItemId,
        Guid documentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}
