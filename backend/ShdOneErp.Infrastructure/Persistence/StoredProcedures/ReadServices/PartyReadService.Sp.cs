using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Party360.DTOs;
using ShdOneErp.Application.Modules.Party360.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class PartyReadService : IPartyReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly ICurrentUser _currentUser;
    private readonly string _connectionString;

    public PartyReadService(ISpExecutor spExecutor, ICurrentUser currentUser, IConfiguration configuration)
    {
        _spExecutor = spExecutor;
        _currentUser = currentUser;
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chuỗi kết nối 'DefaultConnection' chưa được cấu hình.");
    }

    public async Task<PagedResult<PartyListItemDto>> GetPagedAsync(PartyFilterQuery query, CancellationToken cancellationToken = default)
    {
        var parameters = new
        {
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            PartyType = query.PartyType,
            SearchTerm = query.SearchTerm,
            Status = query.Status,
            LegalEntityId = query.LegalEntityId,
            SortBy = query.SortBy,
            SortOrder = query.SortOrder,
            CurrentUserId = _currentUser.UserId
        };

        return await _spExecutor.ExecuteStoredProcedurePagedAsync<PartyListItemDto>(
            "sp_Party_GetPaged",
            parameters,
            totalCountParamName: "TotalCount",
            cancellationToken: cancellationToken);
    }

    public async Task<PartyDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var parameters = new
        {
            Id = id,
            CurrentUserId = _currentUser.UserId
        };

        var command = new CommandDefinition(
            "sp_Party_GetById",
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        using var multi = await connection.QueryMultipleAsync(command);

        var party = await multi.ReadFirstOrDefaultAsync<PartyDetailDto>();
        if (party == null) return null;

        var roles = (await multi.ReadAsync<PartyRoleDto>()).ToList();
        var contacts = (await multi.ReadAsync<PartyContactMethodDto>()).ToList();

        party.Roles = roles;
        party.ContactMethods = contacts;

        return party;
    }

    public async Task<PagedResult<StudentListItemDto>> GetStudentsPagedAsync(PartyFilterQuery query, CancellationToken cancellationToken = default)
    {
        var parameters = new
        {
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            SearchTerm = query.SearchTerm,
            Status = query.Status,
            LegalEntityId = query.LegalEntityId,
            SortBy = query.SortBy,
            SortOrder = query.SortOrder,
            CurrentUserId = _currentUser.UserId
        };

        return await _spExecutor.ExecuteStoredProcedurePagedAsync<StudentListItemDto>(
            "sp_Party_Student_GetPagedList",
            parameters,
            totalCountParamName: "TotalCount",
            cancellationToken: cancellationToken);
    }

    public async Task<PartyDetailDto?> GetStudentDetailAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var parameters = new
        {
            Id = id,
            CurrentUserId = _currentUser.UserId
        };

        var command = new CommandDefinition(
            "sp_Party_Student_GetDetailById",
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        using var multi = await connection.QueryMultipleAsync(command);

        var party = await multi.ReadFirstOrDefaultAsync<PartyDetailDto>();
        if (party == null) return null;

        party.Roles = (await multi.ReadAsync<PartyRoleDto>()).ToList();
        party.ContactMethods = (await multi.ReadAsync<PartyContactMethodDto>()).ToList();
        party.Identifications = (await multi.ReadAsync<PartyIdentificationDto>()).ToList();
        party.Relationships = (await multi.ReadAsync<PartyRelationshipDto>()).ToList();

        return party;
    }
}

