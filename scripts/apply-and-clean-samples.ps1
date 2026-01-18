# Safe apply + clean script
param(
    [switch]$PreviewOnly
)
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$samplesRoot = Join-Path $repoRoot "public\samples"
$mapFile = Join-Path $repoRoot 'sample-rename-mapping.txt'
$finalMap = Join-Path $repoRoot 'sample-rename-final-mapping.txt'

if (-not (Test-Path $mapFile)) { Write-Error "Mapping file not found: $mapFile"; exit 1 }

$allowed = @('.mp3', '.wav', '.ogg', '.flac', '.aif')

$lines = Get-Content $mapFile | Where-Object { $_ -match '->' }
$applied = @()

foreach ($ln in $lines) {
    $parts = $ln -split '->'
    if ($parts.Count -lt 2) { continue }
    $old = $parts[0].Trim()
    $new = $parts[1].Trim()
    $ext = [IO.Path]::GetExtension($old).ToLower()
    if ($allowed -notcontains $ext) { continue }
    if ($PreviewOnly) { Write-Output "Would: $old -> $new"; continue }
    # ensure target dir exists
    $tgtDir = Split-Path $new -Parent
    New-Item -ItemType Directory -Force -Path $tgtDir | Out-Null
    # move
    try {
        Move-Item -LiteralPath $old -Destination $new -Force
        $applied += [PSCustomObject]@{ Old = $old; New = $new }
    }
    catch {
        Write-Warning "Failed to move $old -> $new : $_"
    }
}

# Second pass: simplify odd/overlong names using original old name as hint
$cleaned = @()
foreach ($m in $applied) {
    $cur = $m.New
    $name = [IO.Path]::GetFileNameWithoutExtension($cur)
    $dir = Split-Path $cur -Parent
    # if name contains underscores in category/subfolder part, replace them with hyphens
    $cleanName = $name -replace '_', '-'
    # split tokens
    $tokens = $cleanName -split '-'
    $needSimplify = $false
    foreach ($t in $tokens) { if ($t.Length -gt 20) { $needSimplify = $true; break } }
    if ($cleanName -match 'hihat_closed') { $needSimplify = $true }

    if (-not $needSimplify) { continue }

    # extract index (first numeric token) if present, else preserve ordering
    $index = '01'
    foreach ($t in $tokens) { if ($t -match '^[0-9]{2}$') { $index = $t; break } }

    # Derive a short friendly token from original old filename
    $oldBase = [IO.Path]::GetFileNameWithoutExtension($m.Old)
    # remove leading numbers and separators
    $oldBaseClean = $oldBase -replace '^[0-9_\-\. ]+', ''
    $match = [regex]::Matches($oldBaseClean, '[A-Za-z]{3,}') | Select-Object -First 1
    if ($match) { $token = $match.Value.ToLower() } else {
        # fallback to last token of folder
        $folderLeaf = Split-Path $dir -Leaf
        $token = ($folderLeaf -replace '[^a-zA-Z0-9]', '-').ToLower()
    }
    # shorten token if still long
    if ($token.Length -gt 12) { $token = $token.Substring(0, 8) }

    # build category and subfolder from dir relative to samples root
    $rel = $dir.Substring($samplesRoot.Length + 1)
    $parts = $rel -split '\\'
    $category = $parts[0].ToLower() -replace '[^a-z0-9]', '-'
    $sub = if ($parts.Count -gt 1) { $parts[1].ToLower() -replace '[^a-z0-9]', '-' } else { $category }

    $newBase = "${category}-${sub}-${index}-${token}"
    $newFile = Join-Path $dir ($newBase + '.mp3')
    $counter = 1
    while (Test-Path $newFile) {
        $newFile = Join-Path $dir ($newBase + "-$counter.mp3")
        $counter++
    }
    if ($PreviewOnly) { Write-Output "Would simplify: $cur -> $newFile"; continue }
    try {
        Move-Item -LiteralPath $cur -Destination $newFile -Force
        $cleaned += [PSCustomObject]@{ Old = $cur; New = $newFile }
    }
    catch {
        Write-Warning "Failed to simplify $cur -> $newFile : $_"
    }
}

# write final mapping
if (-not $PreviewOnly) {
    $out = @()
    foreach ($x in $applied) { $out += "{0} -> {1}" -f $x.Old, $x.New }
    foreach ($x in $cleaned) { $out += "{0} -> {1}" -f $x.Old, $x.New }
    $out | Out-File -FilePath $finalMap -Encoding utf8
    Write-Output "Applied renames: $($applied.Count). Simplified: $($cleaned.Count). Final mapping: $finalMap"
}
else {
    Write-Output "Preview only; no changes applied. Would apply: $($lines.Count) mappings (audio-only)."
}
