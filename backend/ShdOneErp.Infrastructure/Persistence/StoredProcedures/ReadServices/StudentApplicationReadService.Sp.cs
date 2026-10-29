using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;
using ShdOneErp.Application.Modules.AdmissionVisa.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class StudentApplicationReadService : IStudentApplicationReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly ICurrentUser _currentUser;
    private readonly string _connectionString;

    public StudentApplicationReadService(
        ISpExecutor spExecutor,
        ICurrentUser currentUser,
        IConfiguration configuration)
    {
        _spExecutor = spExecutor;
        _currentUser = currentUser;
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chuỗi kết nối 'DefaultConnection' chưa được cấu hình.");
    }

    public async Task<PagedResult<StudentApplicationListItemDto>> GetApplicationsPagedAsync(
        StudentApplicationFilterQuery query,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var parameters = new
        {
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            SearchTerm = query.SearchTerm,
            TargetMarket = query.TargetMarket,
            IntakeTerm = query.IntakeTerm,
            Status = query.Status,
            LegalEntityId = query.LegalEntityId,
            StudentPartyId = query.StudentPartyId,
            CurrentUserId = currentUserId != Guid.Empty ? currentUserId : _currentUser.UserId
        };

        return await _spExecutor.ExecuteStoredProcedurePagedAsync<StudentApplicationListItemDto>(
            "sp_Admission_Application_GetPagedList",
            parameters,
            totalCountParamName: "TotalCount",
            cancellationToken: cancellationToken);
    }

    public async Task<StudentApplicationDetailDto?> GetApplicationDetailAsync(
        Guid applicationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var parameters = new
        {
            Id = applicationId,
            CurrentUserId = currentUserId != Guid.Empty ? currentUserId : _currentUser.UserId
        };

        var command = new CommandDefinition(
            "sp_Admission_Application_GetDetailById",
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        using var multi = await connection.QueryMultipleAsync(command);

        var application = await multi.ReadFirstOrDefaultAsync<StudentApplicationDetailDto>();
        if (application == null) return null;

        var items = (await multi.ReadAsync<ChecklistItemDto>()).ToList();
        var links = (await multi.ReadAsync<ApplicationDocumentLinkDto>()).ToList();

        // Group links into their respective checklist items
        var linksByItemId = links.GroupBy(l => l.ChecklistItemId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var item in items)
        {
            if (linksByItemId.TryGetValue(item.Id, out var itemLinks))
            {
                item.DocumentLinks = itemLinks;
            }
        }

        application.ChecklistItems = items;
        return application;
    }

    public async Task<List<StudentApplicationListItemDto>> GetApplicationsByStudentPartyIdAsync(
        Guid studentPartyId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var parameters = new
        {
            StudentPartyId = studentPartyId,
            CurrentUserId = currentUserId != Guid.Empty ? currentUserId : _currentUser.UserId
        };

        var command = new CommandDefinition(
            "sp_Admission_Application_GetByStudentPartyId",
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        var list = await connection.QueryAsync<StudentApplicationListItemDto>(command);
        return list.ToList();
    }
}

