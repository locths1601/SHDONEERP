using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;

namespace ShdOneErp.Application.Modules.Organization.Interfaces;

public interface IBranchReadService
{
    Task<PagedResult<BranchDto>> GetPagedAsync(BranchFilterQuery query, CancellationToken cancellationToken = default);
    Task<BranchDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BranchLookupDto>> GetLookupAsync(Guid? legalEntityId, Guid? businessUnitId, CancellationToken cancellationToken = default);
}

public interface IBranchWriteService
{
    Task<Result<Guid>> CreateAsync(CreateBranchRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, UpdateBranchRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

