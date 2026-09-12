param([string]$ProjectRoot="E:\POS_App\hafizretailpos")
$ErrorActionPreference = "Stop"
$PackageRoot = $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupRoot = "E:\POS_App\hafizretailpos_backups\before_production_hardening_$stamp"

Write-Host "HECC Production Hardening 1-6" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"
Write-Host "Backup:  $BackupRoot"

$files = @(
  "src\prisma\contract.prisma",
  "src\lib\auth\apiGuard.ts",
  "src\lib\auth\branchScope.ts",
  "src\lib\returns\accounting.ts",
  "src\lib\autonomous-intelligence\types.ts",
  "src\lib\autonomous-intelligence\embeddings.ts",
  "src\lib\autonomous-intelligence\knowledge.ts",
  "src\lib\autonomous-intelligence\agent.ts",
  "src\lib\autonomous-intelligence\index.ts",
  "app\api\ai\knowledge\route.ts",
  "app\api\ai\agent\route.ts",
  "app\api\ai\approvals\route.ts",
  "app\dashboard\ai-command-center\page.tsx",
  "app\dashboard\page.tsx",
  "app\api\invoices\route.ts",
  "app\api\purchases\route.ts",
  "app\api\returns\route.ts",
  "app\api\returns\[id]\route.ts",
  "app\api\inventory-adjustments\route.ts",
  "app\api\customers\[id]\payments\route.ts",
  "app\api\purchases\[id]\payments\route.ts",
  "proxy.ts",
  "scripts\hecc-final-qa.mjs",
  ".env.example"
)

New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
foreach ($rel in $files) {
  $dst = Join-Path $ProjectRoot $rel
  if (Test-Path -LiteralPath $dst) {
    $backup = Join-Path $BackupRoot $rel
    New-Item -ItemType Directory -Path (Split-Path $backup -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $dst -Destination $backup -Force
  }
}

foreach ($rel in $files) {
  $src = Join-Path $PackageRoot $rel
  if (!(Test-Path -LiteralPath $src)) { throw "Package file missing: $rel" }
  $dst = Join-Path $ProjectRoot $rel
  New-Item -ItemType Directory -Path (Split-Path $dst -Parent) -Force | Out-Null
  Copy-Item -LiteralPath $src -Destination $dst -Force
  Write-Host "[INSTALLED] $rel" -ForegroundColor Green
}

Set-Location $ProjectRoot
Write-Host "`n[1/5] Source QA" -ForegroundColor Cyan
node scripts/hecc-final-qa.mjs

Write-Host "`n[2/5] Emit Prisma contract" -ForegroundColor Cyan
npm run contract:emit
if ($LASTEXITCODE -ne 0) { throw "Prisma contract emit failed." }

Write-Host "`n[3/5] Plan reviewed migration" -ForegroundColor Cyan
npx prisma migration plan --name hecc_production_hardening
if ($LASTEXITCODE -ne 0) { throw "Migration plan failed. Database was not migrated." }

Write-Host "`n[4/5] Apply + verify migration" -ForegroundColor Cyan
npx prisma db migrate
if ($LASTEXITCODE -ne 0) { throw "Database migration failed." }
npx prisma db verify
if ($LASTEXITCODE -ne 0) { throw "Database verification failed." }

Write-Host "`n[5/5] Production build" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

Write-Host "`nHECC 1-6 hardening installed, migrated, verified and built successfully." -ForegroundColor Green
Write-Host "Backup: $BackupRoot" -ForegroundColor Yellow
