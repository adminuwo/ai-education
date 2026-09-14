Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\assets\adaptive-icon.png"
if (-not (Test-Path $srcPath)) {
    $srcPath = Join-Path $PSScriptRoot "..\assets\icon.png"
}
Write-Output "Using source icon: $srcPath"
$src = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath).Path)

# Extract transparent logo
$bg = $src.GetPixel(0, 0) # R:8, G:15, B:31
$cleanLogo = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        $diff = [Math]::Abs($p.R - $bg.R) + [Math]::Abs($p.G - $bg.G) + [Math]::Abs($p.B - $bg.B)
        if ($diff -gt 35) {
            $cleanLogo.SetPixel($x, $y, $p)
        } else {
            $cleanLogo.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$resDir = Join-Path $PSScriptRoot "..\android\app\src\main\res"

# Splash icon
$drawableDir = Join-Path $resDir "drawable"
if (-not (Test-Path $drawableDir)) { New-Item -ItemType Directory -Path $drawableDir -Force | Out-Null }
$splashPath = Join-Path $drawableDir "splash_icon.png"
$splashBmp = New-Object System.Drawing.Bitmap(288, 288, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gSp = [System.Drawing.Graphics]::FromImage($splashBmp)
$gSp.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gSp.DrawImage($cleanLogo, 0, 0, 288, 288)
$gSp.Dispose()
$splashBmp.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)
$splashBmp.Dispose()

$legacySizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$adaptiveSizes = @{
    "mipmap-mdpi" = 108
    "mipmap-hdpi" = 162
    "mipmap-xhdpi" = 216
    "mipmap-xxhdpi" = 324
    "mipmap-xxxhdpi" = 432
}

foreach ($folder in $legacySizes.Keys) {
    $size = $legacySizes[$folder]
    $destDir = Join-Path $resDir $folder
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    # Square icon (with dark background)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()
    $bmp.Save((Join-Path $destDir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    # Round icon (edge-to-edge dark circle)
    $bmpRound = New-Object System.Drawing.Bitmap($size, $size)
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $gRound.SetClip($path)
    $gRound.DrawImage($src, 0, 0, $size, $size)
    $path.Dispose()
    $gRound.Dispose()
    $bmpRound.Save((Join-Path $destDir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()

    # Adaptive foreground icon
    $adSize = $adaptiveSizes[$folder]
    $logoDim = [int]($adSize * 0.70)
    $offset = [int](($adSize - $logoDim) / 2)
    $bmpFg = New-Object System.Drawing.Bitmap($adSize, $adSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFg = [System.Drawing.Graphics]::FromImage($bmpFg)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.DrawImage($cleanLogo, $offset, $offset, $logoDim, $logoDim)
    $gFg.Dispose()
    $bmpFg.Save((Join-Path $destDir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpFg.Dispose()

    Write-Output "Generated $folder icons (legacy ${size}x${size}, adaptive ${adSize}x${adSize})"
}

$cleanLogo.Dispose()
$src.Dispose()
Write-Output "All Android icons and splash assets generated successfully."
