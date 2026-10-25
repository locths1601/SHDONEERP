using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;

namespace ShdOneErp.Application.Modules.Organization.Interfaces;

public interface ILegalEntityReadService
{
    Task<PagedResult<LegalEntityDto>> GetPagedAsync(LegalEntityFilterQuery query, CancellationToken cancellationToken = default);
    Task<LegalEntityDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LegalEntityLookupDto>> GetLookupAsync(CancellationToken cancellationToken = default);
}

public interface ILegalEntityWriteService
{
    Task<Result<Guid>> CreateAsync(CreateLegalEntityRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, UpdateLegalEntityRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
