using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Infrastructure.Services.DocumentStorage;

public class LocalFileSystemDocumentStorageService : IDocumentStorageService
{
    private readonly IShdOneErpDbContext _context;
    private readonly IPermissionResolver _permissionResolver;
    private readonly string _storageRoot;

    public LocalFileSystemDocumentStorageService(
        IShdOneErpDbContext context,
        IPermissionResolver permissionResolver,
        IConfiguration configuration)
    {
        _context = context;
        _permissionResolver = permissionResolver;

        var configuredPath = configuration["Storage:LocalPath"];
        _storageRoot = !string.IsNullOrWhiteSpace(configuredPath)
            ? Path.GetFullPath(configuredPath)
            : Path.Combine(AppContext.BaseDirectory, "storage", "documents");

        if (!Directory.Exists(_storageRoot))
        {
            Directory.CreateDirectory(_storageRoot);
        }
    }

    public async Task<StoredDocumentResult> StoreDocumentAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        DataClassification classification,
        Guid legalEntityId,
        Guid ownerUserId,
        CancellationToken cancellationToken = default)
    {
        if (fileStream == null || fileStream.Length == 0)
            throw new ArgumentException("File stream rỗng hoặc không hợp lệ.", nameof(fileStream));
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("Tên tập tin không được để trống.", nameof(fileName));

        var cleanFileName = Path.GetFileName(fileName);
        var subDir = Path.Combine(DateTime.UtcNow.ToString("yyyy"), DateTime.UtcNow.ToString("MM"), DateTime.UtcNow.ToString("dd"));
        var targetDir = Path.Combine(_storageRoot, subDir);

        if (!Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        var uniquePrefix = Guid.NewGuid().ToString("N");
        var savedFileName = $"{uniquePrefix}_{cleanFileName}";
        var fullPath = Path.Combine(targetDir, savedFileName);

        // Security check: Path traversal prevention
        var canonicalPath = Path.GetFullPath(fullPath);
        if (!canonicalPath.StartsWith(_storageRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Phát hiện đường dẫn lưu trữ không an toàn.");
        }

        string sha256Hex;
        long totalBytesWritten;

        using (var sha256 = SHA256.Create())
        using (var diskStream = new FileStream(canonicalPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            fileStream.Position = 0;
            var buffer = new byte[81920];
            int bytesRead;
            totalBytesWritten = 0;

            while ((bytesRead = await fileStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken)) > 0)
            {
                await diskStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
                totalBytesWritten += bytesRead;
            }

            sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
            sha256Hex = Convert.ToHexString(sha256.Hash ?? Array.Empty<byte>()).ToLowerInvariant();
        }

        var relativePath = Path.Combine(subDir, savedFileName).Replace('\\', '/');

        var document = new Document(
            legalEntityId,
            cleanFileName,
            "ChecklistAttachment",
            classification,
            ownerUserId,
            relativePath,
            cleanFileName,
            string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
            totalBytesWritten,
            sha256Hex);

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        return new StoredDocumentResult
        {
            DocumentId = document.Id,
            StoragePath = relativePath,
            Sha256Checksum = sha256Hex,
            FileSizeBytes = totalBytesWritten
        };
    }

    public async Task<Stream?> GetDocumentStreamAsync(
        Guid documentId,
        Guid requesterUserId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsDeleted, cancellationToken);

        if (document == null) return null;

        // Authorization check: Document owner OR has permission on the LegalEntity OR has global permission
        if (document.OwnerUserId != requesterUserId)
        {
            var hasAccess = await _permissionResolver.HasPermissionAsync(
                requesterUserId,
                "admission.dossier.view",
                document.LegalEntityId,
                cancellationToken: cancellationToken);

            if (!hasAccess)
            {
                hasAccess = await _permissionResolver.HasGlobalPermissionAsync(
                    requesterUserId,
                    "admission.dossier.view",
                    cancellationToken);
            }

            if (!hasAccess)
            {
                return null;
            }
        }

        var localPath = Path.Combine(_storageRoot, document.StoragePath.Replace('/', Path.DirectorySeparatorChar));
        var canonicalPath = Path.GetFullPath(localPath);

        if (!canonicalPath.StartsWith(_storageRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(canonicalPath))
        {
            return null;
        }

        return new FileStream(canonicalPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
    }
}

