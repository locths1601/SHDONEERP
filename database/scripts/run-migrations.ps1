<#
.SYNOPSIS
    SHD OneERP Hand-written SQL Migration Runner
.DESCRIPTION
    Quét và thực thi tuần tự các file migration trong database/migrations/
    Ghi nhận lịch sử, thời gian chạy và mã băm SHA256 vào __DbMigrationHistory.
    Tích hợp khóa phân tán sp_getapplock chống chạy đồng thời nhiều runner.
.PARAMETER Server
    Tên máy chủ SQL Server (Mặc định: localhost)
.PARAMETER Database
    Tên cơ sở dữ liệu (Mặc định: ShdOneErpDb)
.PARAMETER User
    Tài khoản SQL Server (nếu dùng SQL Auth)
.PARAMETER Password
    Mật khẩu SQL Server (nếu dùng SQL Auth)
#>

[CmdletBinding()]
param (
    [string]$Server = "localhost",
    [string]$Database = "ShdOneErpDb",
    [string]$User = "sa",
    [string]$Password = "ssa",
    [switch]$IntegratedSecurity = $false
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " SHD OneERP Migration Runner (Distributed Locked)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Server:   $Server"
Write-Host "Database: $Database"

$connectionString = ""
if ($IntegratedSecurity) {
    $connectionString = "Server=$Server;Database=$Database;Integrated Security=True;TrustServerCertificate=True;"
} else {
    $connectionString = "Server=$Server;Database=$Database;User Id=$User;Password=$Password;TrustServerCertificate=True;"
}

$migrationDir = Join-Path $PSScriptRoot "..\migrations"
if (-not (Test-Path $migrationDir)) {
    Write-Error "Thư mục migrations không tồn tại: $migrationDir"
    exit 1
}

# Khởi tạo kết nối SQL
$conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $conn.Open()
    Write-Host "[OK] Đã kết nối cơ sở dữ liệu thành công." -ForegroundColor Green
} catch {
    Write-Error "[LỖI KẾT NỐI] Không thể kết nối tới cơ sở dữ liệu: $_"
    exit 1
}

$lockAcquired = $false
try {
    # 1. Khóa ứng dụng chống chạy đồng thời (Distributed Session Lock)
    $lockCmd = $conn.CreateCommand()
    $lockCmd.CommandText = "DECLARE @result INT; EXEC @result = sp_getapplock @Resource = 'SHD_OneERP_MigrationRunner', @LockMode = 'Exclusive', @LockOwner = 'Session', @LockTimeout = 10000; SELECT @result;"
    $lockResult = [int]$lockCmd.ExecuteScalar()
    if ($lockResult -lt 0) {
        Write-Error "[LỖI KHÓA ĐỒNG THỜI] Không thể lấy khóa độc quyền (Mã lỗi sp_getapplock: $lockResult). Có tiến trình migration khác đang chạy."
        exit 1
    }
    $lockAcquired = $true
    Write-Host "[OK] Đã xác lập khóa độc quyền migration runner (sp_getapplock Session Lock)." -ForegroundColor Green

    # 2. Đảm bảo bảng __DbMigrationHistory tồn tại
    $checkTableCmd = $conn.CreateCommand()
    $checkTableCmd.CommandText = "IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__DbMigrationHistory' AND type = 'U') BEGIN CREATE TABLE [dbo].[__DbMigrationHistory] ([MigrationId] NVARCHAR(150) NOT NULL, [MigrationName] NVARCHAR(250) NOT NULL, [AppliedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_DbMigrationHistory_AppliedAtUtc DEFAULT SYSUTCDATETIME(), [Checksum] NVARCHAR(64) NOT NULL, [ExecutionTimeMs] INT NOT NULL, [AppliedBy] NVARCHAR(100) NOT NULL CONSTRAINT DF_DbMigrationHistory_AppliedBy DEFAULT SUSER_SNAME(), CONSTRAINT [PK___DbMigrationHistory] PRIMARY KEY CLUSTERED ([MigrationId] ASC)); END;"
    $checkTableCmd.ExecuteNonQuery() | Out-Null

    # 3. Lấy danh sách migration đã áp dụng
    $appliedMigrations = @{}
    $getAppliedCmd = $conn.CreateCommand()
    $getAppliedCmd.CommandText = "SELECT MigrationId, Checksum FROM [dbo].[__DbMigrationHistory]"
    $reader = $getAppliedCmd.ExecuteReader()
    while ($reader.Read()) {
        $appliedMigrations[$reader["MigrationId"].ToString()] = $reader["Checksum"].ToString()
    }
    $reader.Close()

    # 4. Lấy tất cả file sql trong thư mục migrations
    $files = Get-ChildItem -Path $migrationDir -Filter "*.sql" | Sort-Object Name
    $appliedCount = 0
    $skippedCount = 0

    foreach ($file in $files) {
        $migrationId = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

        # Tính SHA256 checksum
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $hashBytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($content))
        $currentChecksum = -join ($hashBytes | ForEach-Object { "{0:x2}" -f $_ })

        if ($appliedMigrations.ContainsKey($migrationId)) {
            $savedChecksum = $appliedMigrations[$migrationId]
            if ($savedChecksum -ne $currentChecksum) {
                Write-Warning "CẢNH BÁO: Migration [$migrationId] đã được áp dụng nhưng nội dung tệp đã bị thay đổi! (Checksum mismatch)"
            }
            $skippedCount++
            continue
        }

        Write-Host "-> Đang áp dụng migration: $($file.Name)..." -ForegroundColor Yellow

        # Tách các khối lệnh theo từ khóa 'GO'
        $batches = [System.Text.RegularExpressions.Regex]::Split($content, '^\s*GO\s*$', [System.Text.RegularExpressions.RegexOptions]::Multiline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $trans = $conn.BeginTransaction()
        try {
            foreach ($batch in $batches) {
                $trimmed = $batch.Trim()
                if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
                    $cmd = $conn.CreateCommand()
                    $cmd.Transaction = $trans
                    $cmd.CommandText = $trimmed
                    $cmd.CommandTimeout = 120
                    $cmd.ExecuteNonQuery() | Out-Null
                }
            }

            $sw.Stop()

            # Ghi nhận vào __DbMigrationHistory
            $recordCmd = $conn.CreateCommand()
            $recordCmd.Transaction = $trans
            $recordCmd.CommandText = "INSERT INTO [dbo].[__DbMigrationHistory] (MigrationId, MigrationName, Checksum, ExecutionTimeMs) VALUES (@MigrationId, @MigrationName, @Checksum, @ExecutionTimeMs);"
            $recordCmd.Parameters.AddWithValue("@MigrationId", $migrationId) | Out-Null
            $recordCmd.Parameters.AddWithValue("@MigrationName", $file.Name) | Out-Null
            $recordCmd.Parameters.AddWithValue("@Checksum", $currentChecksum) | Out-Null
            $recordCmd.Parameters.AddWithValue("@ExecutionTimeMs", [int]$sw.ElapsedMilliseconds) | Out-Null
            $recordCmd.ExecuteNonQuery() | Out-Null

            $trans.Commit()
            Write-Host "   [THÀNH CÔNG] $($file.Name) hoàn tất trong $($sw.ElapsedMilliseconds) ms" -ForegroundColor Green
            $appliedCount++
        } catch {
            $trans.Rollback()
            Write-Error "   [THẤT BẠI] Lỗi khi chạy $($file.Name): $_"
            exit 1
        }
    }

    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "Tổng kết: Đã áp dụng: $appliedCount | Bỏ qua (đã chạy): $skippedCount" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
} finally {
    if ($lockAcquired) {
        try {
            $unlockCmd = $conn.CreateCommand()
            $unlockCmd.CommandText = "EXEC sp_releaseapplock @Resource = 'SHD_OneERP_MigrationRunner', @LockOwner = 'Session';"
            $unlockCmd.ExecuteNonQuery() | Out-Null
            Write-Host "[OK] Đã giải phóng khóa session sp_releaseapplock." -ForegroundColor Gray
        } catch {
            Write-Warning "Không thể giải phóng khóa applock: $_"
        }
    }
    $conn.Close()
}
