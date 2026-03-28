# sync-lisn.ps1 — Synchronise le ZIP lisn-v8 vers le projet local
# Usage: .\sync-lisn.ps1
# Placer ce script dans le même dossier que lisn-v8.zip

$ErrorActionPreference = "Stop"

$zipName   = "lisn-v8.zip"
$tempDir   = "$env:TEMP\lisn_sync_temp"
$srcInner  = "$tempDir\lisn_clean"

# Déterminer le dossier destination (là où se trouve le projet Next.js)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipPath   = Join-Path $scriptDir $zipName

# Chercher le projet dans les emplacements communs
$candidates = @(
    (Join-Path $scriptDir "lisn_projet"),
    (Join-Path $scriptDir "."),
    "C:\Users\$env:USERNAME\Downloads\lisn_projet"
)
$dst = $null
foreach ($c in $candidates) {
    if (Test-Path (Join-Path $c "package.json")) {
        $dst = $c; break
    }
}
if (-not $dst) {
    Write-Host "❌ Projet non trouvé. Spécifie le chemin manuellement dans le script." -ForegroundColor Red
    exit 1
}

Write-Host "📦 ZIP     : $zipPath"
Write-Host "📁 Projet  : $dst"
Write-Host ""

# Extraire le ZIP
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Write-Host "⏳ Extraction du ZIP..."
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

# Copier tous les fichiers
$files = Get-ChildItem -Path $srcInner -Recurse -File
$count = 0
foreach ($file in $files) {
    $rel      = $file.FullName.Substring($srcInner.Length + 1)
    $destFile = Join-Path $dst $rel
    $destDir  = Split-Path $destFile
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Force $destDir | Out-Null
    }
    Copy-Item $file.FullName $destFile -Force
    Write-Host "  ✓ $rel"
    $count++
}

# Nettoyage
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "✅ $count fichiers synchronisés vers $dst" -ForegroundColor Green
Write-Host ""
Write-Host "👉 Prochaine étape :"
Write-Host "   cd $dst"
Write-Host "   npm install"
Write-Host "   npm run dev"
