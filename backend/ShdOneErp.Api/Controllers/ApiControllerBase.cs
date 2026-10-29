using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Common.Models;

namespace ShdOneErp.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected string TraceId => Activity.Current?.Id ?? HttpContext.TraceIdentifier;

    protected IActionResult ApiOk<T>(T data, string? message = null)
    {
        return Ok(new
        {
            success = true,
            data,
            message,
            traceId = TraceId
        });
    }

    protected IActionResult ApiOk(string? message = "Thao tác thành công.")
    {
        return Ok(new
        {
            success = true,
            message,
            traceId = TraceId
        });
    }

    protected IActionResult ApiCreated<T>(string uri, T data, string? message = "Tạo mới thành công.")
    {
        return Created(uri, new
        {
            success = true,
            data,
            message,
            traceId = TraceId
        });
    }

    protected IActionResult ApiError(string code, string message, int statusCode = StatusCodes.Status400BadRequest, List<ErrorDetail>? details = null)
    {
        return StatusCode(statusCode, new
        {
            success = false,
            error = new
            {
                code,
                message,
                details
            },
            traceId = TraceId
        });
    }

    protected IActionResult FromResult(Result result)
    {
        if (result.Success)
            return ApiOk(result.Message);

        var statusCode = result.ErrorCode switch
        {
            "NOT_FOUND" => StatusCodes.Status404NotFound,
            "UNAUTHORIZED" => StatusCodes.Status401Unauthorized,
            "FORBIDDEN" or "UNAUTHORIZED_SCOPE" => StatusCodes.Status403Forbidden,
            "CONCURRENCY_CONFLICT" => StatusCodes.Status409Conflict,
            "DUPLICATE_CODE" => StatusCodes.Status409Conflict,
            "HAS_DEPENDENT_RECORDS" => StatusCodes.Status409Conflict,
            "LEGAL_ENTITY_NOT_FOUND" => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status400BadRequest
        };

        return ApiError(result.ErrorCode ?? "BAD_REQUEST", result.Message ?? "Đã xảy ra lỗi.", statusCode, result.Details);
    }

    protected IActionResult FromResult<T>(Result<T> result)
    {
        if (result.Success)
            return ApiOk(result.Data, result.Message);

        var statusCode = result.ErrorCode switch
        {
            "NOT_FOUND" => StatusCodes.Status404NotFound,
            "UNAUTHORIZED" => StatusCodes.Status401Unauthorized,
            "FORBIDDEN" or "UNAUTHORIZED_SCOPE" => StatusCodes.Status403Forbidden,
            "CONCURRENCY_CONFLICT" => StatusCodes.Status409Conflict,
            "DUPLICATE_CODE" => StatusCodes.Status409Conflict,
            "HAS_DEPENDENT_RECORDS" => StatusCodes.Status409Conflict,
            "LEGAL_ENTITY_NOT_FOUND" => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status400BadRequest
        };

        return ApiError(result.ErrorCode ?? "BAD_REQUEST", result.Message ?? "Đã xảy ra lỗi.", statusCode, result.Details);
    }
}
