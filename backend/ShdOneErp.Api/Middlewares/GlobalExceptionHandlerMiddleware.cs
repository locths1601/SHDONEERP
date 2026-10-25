using System.Diagnostics;
using System.Net;
using System.Text.Json;
using FluentValidation;
using ShdOneErp.Domain.Common;

namespace ShdOneErp.Api.Middlewares;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        _logger.LogError(exception, "[LỖI HỆ THỐNG] TraceId: {TraceId} - Message: {Message}", traceId, exception.Message);

        var statusCode = HttpStatusCode.InternalServerError;
        string errorCode = "INTERNAL_SERVER_ERROR";
        string message = "Đã xảy ra lỗi ngoài ý muốn. Vui lòng liên hệ bộ phận hỗ trợ kỹ thuật.";
        object? details = null;

        switch (exception)
        {
            case ValidationException valEx:
                statusCode = HttpStatusCode.BadRequest;
                errorCode = "VALIDATION_ERROR";
                message = "Dữ liệu gửi lên không vượt qua kiểm tra tính hợp lệ.";
                details = valEx.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage });
                break;

            case EntityNotFoundException notFoundEx:
                statusCode = HttpStatusCode.NotFound;
                errorCode = notFoundEx.Code;
                message = notFoundEx.Message;
                break;

            case ConcurrencyConflictException concEx:
                statusCode = HttpStatusCode.Conflict;
                errorCode = concEx.Code;
                message = concEx.Message;
                break;

            case UnauthorizedScopeException scopeEx:
                statusCode = HttpStatusCode.Forbidden;
                errorCode = scopeEx.Code;
                message = scopeEx.Message;
                break;

            case BusinessRuleViolationException bizEx:
                statusCode = HttpStatusCode.BadRequest;
                errorCode = bizEx.Code;
                message = bizEx.Message;
                break;

            case DomainException domEx:
                statusCode = HttpStatusCode.BadRequest;
                errorCode = domEx.Code;
                message = domEx.Message;
                break;

            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                errorCode = "UNAUTHORIZED";
                message = "Bạn không có quyền truy cập vào tài nguyên này.";
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var responsePayload = new
        {
            success = false,
            error = new
            {
                code = errorCode,
                message,
                details
            },
            traceId
        };

        var json = JsonSerializer.Serialize(responsePayload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
