param(
  [switch]$Force,
  [switch]$DryRun
)

$PROJECT_ROOT = Resolve-Path "$PSScriptRoot\.."

# ─── 1. Leer versión desde package.json ──────────────────────────────
$pkg = Get-Content -Raw "$PROJECT_ROOT\package.json" | ConvertFrom-Json
$version = $pkg.version
$tag = "v$version"
Write-Host "[release] Versión: $version" -ForegroundColor Cyan

# ─── 2. Verificar gh autenticado ─────────────────────────────────────
Write-Host "[release] Verificando autenticación GitHub CLI..." -NoNewline
$null = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host " ERROR" -ForegroundColor Red
  Write-Host "[release] No autenticado. Ejecuta: gh auth login --web" -ForegroundColor Red
  exit 1
}
Write-Host " OK" -ForegroundColor Green

# ─── 3. Verificar que el repositorio remoto sea correcto ─────────────
Write-Host "[release] Verificando remoto..." -NoNewline
$remoteUrl = git remote get-url origin
$expectedUrl = "https://github.com/FranzMuhlhauser/marknote.git"
if ($remoteUrl -ne $expectedUrl) {
  Write-Host " ERROR" -ForegroundColor Red
  Write-Host "[release] Remoto 'origin' = '$remoteUrl', se esperaba '$expectedUrl'" -ForegroundColor Red
  exit 1
}
Write-Host " OK" -ForegroundColor Green

# ─── 4. Verificar que dist-electron/ exista ──────────────────────────
$distDir = "$PROJECT_ROOT\dist-electron"
if (-not (Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir -Force | Out-Null
  Write-Host "[release] Creado dist-electron/"
}

# ─── 5. Verificar working tree limpio (salvo si --force) ─────────────
$gitStatus = (git status --porcelain) -join "`n"
if ($gitStatus -and -not $Force) {
  Write-Host "[release] ERROR: Working tree sucio. Commit o usa -Force." -ForegroundColor Red
  Write-Host "$gitStatus"
  exit 1
}
if ($gitStatus -and $Force) {
  Write-Host "[release] AVISO: Working tree sucio, forzando release." -ForegroundColor Yellow
}

# ─── 6. Verificar que los artefactos existan ─────────────────────────
$exe = Get-ChildItem "$distDir\Marknote-$version-Setup.exe" | Select-Object -First 1
$blockmap = Get-ChildItem "$distDir\Marknote-$version-Setup.exe.blockmap" | Select-Object -First 1
$latestYml = "$distDir\latest.yml"

$missingArtifacts = @()
if (-not $exe) { $missingArtifacts += "Marknote-$version-Setup.exe" }
if (-not $blockmap) { $missingArtifacts += "Marknote-$version-Setup.exe.blockmap" }
if (-not (Test-Path $latestYml)) { $missingArtifacts += "latest.yml" }

if ($missingArtifacts.Count -gt 0) {
  Write-Host "[release] ERROR: Artefactos faltantes en dist-electron/:" -ForegroundColor Red
  foreach ($a in $missingArtifacts) { Write-Host "         $a" -ForegroundColor Red }
  Write-Host ""
  Write-Host "  Ejecuta primero: npm run build:win" -ForegroundColor Yellow
  Write-Host "  Luego ejecuta:   npm run release" -ForegroundColor Yellow
  exit 1
}
Write-Host "[release] Artefactos:" -ForegroundColor Green
Write-Host "       $($exe.Name)"
Write-Host "       $($blockmap.Name)"
Write-Host "       latest.yml"

if ($DryRun) {
  Write-Host "[release] [DRY-RUN] Todos los checks pasaron. Para publicar, omite -DryRun." -ForegroundColor Magenta
  exit 0
}

# ─── 7. Crear y pushear tag Git ──────────────────────────────────────
$existingTag = git tag -l $tag
if (-not $existingTag) {
  git tag $tag
  if ($LASTEXITCODE -ne 0) { exit 1 }
  Write-Host "[release] Tag creado: $tag" -ForegroundColor Green
} else {
  Write-Host "[release] Tag $tag ya existe, omitiendo creación" -ForegroundColor Yellow
}

Write-Host "[release] Pusheando tag..." -NoNewline
git push origin $tag
if ($LASTEXITCODE -ne 0) {
  Write-Host " ERROR" -ForegroundColor Red
  exit 1
}
Write-Host " OK" -ForegroundColor Green

# ─── 8. Crear o actualizar Release en GitHub ─────────────────────────
# --generate-notes falla si el release ya existe; --notes passthru
Write-Host "[release] Creando release..." -NoNewline
$releaseOutput = gh release create $tag `
  --title $tag `
  --generate-notes `
  --repo FranzMuhlhauser/marknote 2>&1
$releaseExitCode = $LASTEXITCODE

if ($releaseExitCode -eq 0) {
  Write-Host " CREADO" -ForegroundColor Green
} else {
  Write-Host " YA EXISTE" -ForegroundColor Yellow
  Write-Host "[release] Se actualizarán los artifacts del release existente."
}

# ─── 9. Subir artifacts al Release ──────────────────────────────────
Write-Host "[release] Subiendo artifacts..." -NoNewline
$uploadArgs = @(
  "release", "upload", $tag,
  "$($exe.FullName)",
  "$($blockmap.FullName)",
  "$latestYml",
  "--repo", "FranzMuhlhauser/marknote",
  "--clobber"
)
$null = gh @uploadArgs 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host " ERROR" -ForegroundColor Red
  exit 1
}
Write-Host " OK" -ForegroundColor Green

# ─── 10. Resumen final ──────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RELEASE COMPLETADO: $tag" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Repositorio: https://github.com/FranzMuhlhauser/marknote"
Write-Host "  Release:     https://github.com/FranzMuhlhauser/marknote/releases/tag/$tag"
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
