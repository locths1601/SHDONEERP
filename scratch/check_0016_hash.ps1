$path = "database\migrations\20261102_0016_EnhanceMasterDataCatalogsSchemaAndSp.sql"
$bytes = [System.IO.File]::ReadAllBytes($path)
$sha = [System.Security.Cryptography.SHA256]::Create()
$fileHash = -join ($sha.ComputeHash($bytes) | ForEach-Object { "{0:x2}" -f $_ })
Write-Output "File raw bytes hash: $fileHash"

$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$contentHash = -join ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($content)) | ForEach-Object { "{0:x2}" -f $_ })
Write-Output "Content UTF8 hash: $contentHash"

# Check with LF vs CRLF
$lfContent = $content.Replace("`r`n", "`n")
$lfHash = -join ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($lfContent)) | ForEach-Object { "{0:x2}" -f $_ })
Write-Output "LF content hash: $lfHash"

$crlfContent = $lfContent.Replace("`n", "`r`n")
$crlfHash = -join ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($crlfContent)) | ForEach-Object { "{0:x2}" -f $_ })
Write-Output "CRLF content hash: $crlfHash"

