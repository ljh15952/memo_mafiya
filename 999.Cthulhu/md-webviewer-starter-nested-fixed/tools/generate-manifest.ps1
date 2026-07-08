param(
  [string]$Root = "",
  [string]$Output = ""
)

# 対応構造:
# repo/
#   999.Cthulhu/
#   md-webviewer-starter/
#     index.html
#     manifest.json
#     tools/generate-manifest.ps1
#
# 実行例:
# cd repo
# powershell -ExecutionPolicy Bypass -File .\md-webviewer-starter\tools\generate-manifest.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

if ([string]::IsNullOrWhiteSpace($Root)) {
  $Root = Join-Path $RepoRoot "999.Cthulhu"
}

if ([string]::IsNullOrWhiteSpace($Output)) {
  $Output = Join-Path $RepoRoot "md-webviewer-starter\manifest.json"
}

$Root = Resolve-Path $Root
$RepoRootPath = (Resolve-Path $RepoRoot).Path

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
        $relative = $_.FullName.Substring($RepoRootPath.Length + 1).Replace('\', '/')
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
