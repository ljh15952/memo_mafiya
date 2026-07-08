param(
  [string]$Root = "999.Cthulhu",
  [string]$Output = "manifest.json"
)

# 実行場所: index.html と 999.Cthulhu があるリポジトリ直下
# 例: powershell -ExecutionPolicy Bypass -File .\tools\generate-manifest.ps1

$ErrorActionPreference = "Stop"

function Get-NaturalPrefixNumber($Name) {
  if ($Name -match '^(\d+)') { return [int]$matches[1] }
  return [int]::MaxValue
}

$groups = Get-ChildItem -LiteralPath $Root -Directory |
  Sort-Object @{ Expression = { Get-NaturalPrefixNumber $_.Name } }, Name |
  ForEach-Object {
    $dir = $_
    $files = Get-ChildItem -LiteralPath $dir.FullName -Filter *.md -File |
      Sort-Object @{ Expression = { Get-NaturalPrefixNumber $_.Name } }, Name |
      ForEach-Object {
        $relative = $_.FullName.Substring((Get-Location).Path.Length + 1).Replace('\', '/')
        [ordered]@{
          title = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
          path  = $relative
        }
      }

    [ordered]@{
      title = $dir.Name
      files = @($files)
    }
  }

$groups | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $Output -Encoding UTF8
Write-Host "Generated $Output"
