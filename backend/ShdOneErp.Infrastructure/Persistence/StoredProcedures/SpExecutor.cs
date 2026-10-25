using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures;

public class SpExecutor : ISpExecutor
{
    private readonly string _connectionString;
    private readonly ILogger<SpExecutor> _logger;

    public SpExecutor(IConfiguration configuration, ILogger<SpExecutor> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chuỗi kết nối 'DefaultConnection' chưa được cấu hình.");
        _logger = logger;
    }

    public async Task<PagedResult<T>> ExecuteStoredProcedurePagedAsync<T>(
        string procedureName,
        object? parameters = null,
        string totalCountParamName = "TotalCount",
        CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var dynamicParams = new DynamicParameters(parameters);
        if (!dynamicParams.ParameterNames.Contains(totalCountParamName))
        {
            dynamicParams.Add(totalCountParamName, dbType: DbType.Int32, direction: ParameterDirection.Output);
        }

        var commandDefinition = new CommandDefinition(
            procedureName,
            dynamicParams,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        var items = (await connection.QueryAsync<T>(commandDefinition)).ToList();
        var totalCount = dynamicParams.Get<int>(totalCountParamName);

        // Trích xuất page và pageSize từ dynamicParams nếu có
        int page = 1;
        int pageSize = 20;

        try
        {
            if (dynamicParams.ParameterNames.Contains("PageNumber"))
                page = dynamicParams.Get<int>("PageNumber");
            if (dynamicParams.ParameterNames.Contains("PageSize"))
                pageSize = dynamicParams.Get<int>("PageSize");
        }
        catch
        {
            // fallback default
        }

        return new PagedResult<T>(items, page, pageSize, totalCount);
    }

    public async Task<T?> ExecuteStoredProcedureSingleAsync<T>(
        string procedureName,
        object? parameters = null,
        CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var commandDefinition = new CommandDefinition(
            procedureName,
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        return await connection.QueryFirstOrDefaultAsync<T>(commandDefinition);
    }

    public async Task<IReadOnlyList<T>> ExecuteStoredProcedureListAsync<T>(
        string procedureName,
        object? parameters = null,
        CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var commandDefinition = new CommandDefinition(
            procedureName,
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        var results = await connection.QueryAsync<T>(commandDefinition);
        return results.ToList();
    }
}
