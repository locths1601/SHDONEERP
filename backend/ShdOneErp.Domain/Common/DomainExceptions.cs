namespace ShdOneErp.Domain.Common;

public abstract class DomainException : Exception
{
    public string Code { get; }

    protected DomainException(string code, string message) : base(message)
    {
        Code = code;
    }
}

public class EntityNotFoundException : DomainException
{
    public EntityNotFoundException(string entityName, object key)
        : base("ENTITY_NOT_FOUND", $"Không tìm thấy thực thể '{entityName}' với mã định danh '{key}'.")
    {
    }
}

public class BusinessRuleViolationException : DomainException
{
    public BusinessRuleViolationException(string code, string message)
        : base(code, message)
    {
    }
}

public class ConcurrencyConflictException : DomainException
{
    public ConcurrencyConflictException(string message = "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang và thử lại.")
        : base("CONCURRENCY_CONFLICT", message)
    {
    }
}

public class UnauthorizedScopeException : DomainException
{
    public UnauthorizedScopeException(string message = "Bạn không có quyền thao tác trên phạm vi dữ liệu hoặc pháp nhân này.")
        : base("UNAUTHORIZED_SCOPE", message)
    {
    }
}
