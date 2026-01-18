param(
    [switch]$Apply
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$samplesRoot = Join-Path $repoRoot "public\samples"

function Slugify([string]$s) {
    $name = $s -replace '\.mp3$', '' -replace '\.wav$', '' -replace '\.ogg$', '' -replace '\.aif$', ''
    $name = $name -replace '^[0-9_\-\. ]+', ''    # strip leading numbers and separators
    $name = $name.ToLower()
    $name = $name -replace '[^a-z0-9]', '-'      # non-alnum -> hyphen
    $name = $name -replace '-{2,}', '-'          # collapse hyphens
    $name = $name.Trim('-')
    if ($name.Length -gt 40) { $name = $name.Substring(0, 40).Trim('-') }
    if ([string]::IsNullOrEmpty($name)) { $name = 'sample' }
    return $name
}

$files = Get-ChildItem -Path $samplesRoot -Recurse -File | Sort-Object FullName

# Group by containing directory
$groups = $files | Group-Object { Split-Path $_.DirectoryName -Leaf }

$mapping = @()

foreach ($g in $groups) {
    $dirLeaf = $g.Name
    # Determine category (first path segment under samplesRoot)
    foreach ($f in $g.Group | Sort-Object Name) {
        $relative = $f.FullName.Substring($samplesRoot.Length + 1)
        $segments = $relative -split '\\'
        $category = $segments[0]
        $subfolder = (Split-Path $f.DirectoryName -Leaf)
    }
    # enumerate with index
    $i = 1
    foreach ($f in $g.Group | Sort-Object Name) {
        $ext = '.mp3'
        $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
        # handle cases like name.wav.mp3 -> remove last extension only
        if ($f.Name -match '\.(wav|aif|ogg)\.mp3$') {
            $base = $f.Name -replace '\.(wav|aif|ogg)\.mp3$', ''
        }
        $slug = Slugify $base
        $index = '{0:D2}' -f $i
        $newName = "${category}-${subfolder}-${index}-${slug}${ext}"
        $newPath = Join-Path $f.DirectoryName $newName
        # avoid collisions by appending counter
        $counter = 1
        $candidate = $newPath
        while (Test-Path $candidate) {
            $candidate = Join-Path $f.DirectoryName ([IO.Path]::GetFileNameWithoutExtension($newName) + "-$counter" + $ext)
            $counter++
        }
        $mapping += [PSCustomObject]@{
            OldPath = $f.FullName
            NewPath = $candidate
        }
        $i++
    }
}

# Output mapping
Write-Output "Preview of renames (no changes made unless -Apply):"
foreach ($m in $mapping) {
    Write-Output ("{0} -> {1}" -f $m.OldPath, $m.NewPath)
}

if ($Apply) {
    Write-Output "\nApplying renames..."
    foreach ($m in $mapping) {
        $old = $m.OldPath
        $new = $m.NewPath
        New-Item -ItemType Directory -Force -Path (Split-Path $new -Parent) | Out-Null
        Move-Item -LiteralPath $old -Destination $new -Force
    }
    Write-Output "Done."
}

# write mapping to a file for review
$mapFile = Join-Path $repoRoot 'sample-rename-mapping.txt'
$mapping | ForEach-Object { "{0} -> {1}" -f $_.OldPath, $_.NewPath } | Out-File -FilePath $mapFile -Encoding utf8
Write-Output "Mapping written to $mapFile"