using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;
using ShdOneErp.Application.Modules.AdmissionVisa.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class ChecklistReadService : IChecklistReadService
{
    private readonly ICurrentUser _currentUser;
    private readonly string _connectionString;

    public ChecklistReadService(
        ICurrentUser currentUser,
        IConfiguration configuration)
    {
        _currentUser = currentUser;
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chuỗi kết nối 'DefaultConnection' chưa được cấu hình.");
    }

    public async Task<List<ChecklistItemDto>> GetChecklistByApplicationIdAsync(
        Guid applicationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var parameters = new
        {
            ApplicationId = applicationId,
            CurrentUserId = currentUserId != Guid.Empty ? currentUserId : _currentUser.UserId
        };

        var command = new CommandDefinition(
            "sp_Admission_Checklist_GetByApplicationId",
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        using var multi = await connection.QueryMultipleAsync(command);

        var items = (await multi.ReadAsync<ChecklistItemDto>()).ToList();
        var links = (await multi.ReadAsync<ApplicationDocumentLinkDto>()).ToList();

        var linksByItemId = links.GroupBy(l => l.ChecklistItemId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var item in items)
        {
            if (linksByItemId.TryGetValue(item.Id, out var itemLinks))
            {
                item.DocumentLinks = itemLinks;
            }
        }

        return items;
    }

    public async Task<ChecklistItemDto?> GetChecklistItemByIdAsync(
        Guid checklistItemId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var parameters = new
        {
            Id = checklistItemId,
            CurrentUserId = currentUserId != Guid.Empty ? currentUserId : _currentUser.UserId
        };

        var command = new CommandDefinition(
            "sp_Admission_Checklist_GetById",
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        using var multi = await connection.QueryMultipleAsync(command);

        var item = await multi.ReadFirstOrDefaultAsync<ChecklistItemDto>();
        if (item == null) return null;

        item.DocumentLinks = (await multi.ReadAsync<ApplicationDocumentLinkDto>()).ToList();
        return item;
    }
}

