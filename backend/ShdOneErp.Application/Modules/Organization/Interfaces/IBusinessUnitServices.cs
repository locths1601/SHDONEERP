using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;

namespace ShdOneErp.Application.Modules.Organization.Interfaces;

public interface IBusinessUnitReadService
{
    Task<PagedResult<BusinessUnitDto>> GetPagedAsync(BusinessUnitFilterQuery query, CancellationToken cancellationToken = default);
    Task<BusinessUnitDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IBusinessUnitWriteService
{
    Task<Result<Guid>> CreateAsync(CreateBusinessUnitRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, UpdateBusinessUnitRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
