namespace ShdOneErp.Application.Common.Models;

public class Result
{
    public bool Success { get; }
    public string? ErrorCode { get; }
    public string? Message { get; }
    public List<ErrorDetail>? Details { get; }

    protected Result(bool success, string? errorCode, string? message, List<ErrorDetail>? details = null)
    {
        Success = success;
        ErrorCode = errorCode;
        Message = message;
        Details = details;
    }

    public static Result Ok(string? message = null) => new(true, null, message);
    public static Result Fail(string errorCode, string message, List<ErrorDetail>? details = null) => new(false, errorCode, message, details);
}

public class Result<T> : Result
{
    public T? Data { get; }

    protected Result(bool success, T? data, string? errorCode, string? message, List<ErrorDetail>? details = null)
        : base(success, errorCode, message, details)
    {
        Data = data;
    }

    public static Result<T> Ok(T data, string? message = null) => new(true, data, null, message);
    public new static Result<T> Fail(string errorCode, string message, List<ErrorDetail>? details = null) => new(false, default, errorCode, message, details);
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int TotalItems { get; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;

    public PagedResult(IReadOnlyList<T> items, int page, int pageSize, int totalItems)
    {
        Items = items;
        Page = page;
        PageSize = pageSize;
        TotalItems = totalItems;
    }

    public static PagedResult<T> Empty(int page = 1, int pageSize = 20) => new(Array.Empty<T>(), page, pageSize, 0);
}

public class ErrorDetail
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public ErrorDetail() { }

    public ErrorDetail(string field, string message)
    {
        Field = field;
        Message = message;
    }
}
