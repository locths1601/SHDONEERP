namespace ShdOneErp.Domain.Common;

/// <summary>
/// Thực thể cơ sở chứa các trường kiểm toán và token khóa lạc quan (concurrency token).
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; protected set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public void MarkUpdated()
    {
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
