Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Admin\.gemini\antigravity-ide\brain\386a65e9-55ea-46b2-9832-eb07d685ec00\.user_uploaded\media_1790958931741.png"
$resDir = "C:\Users\Admin\Desktop\Innonsh\MonthlyGrocery\merchant-app\android\app\src\main\res"
$assetsDir = "C:\Users\Admin\Desktop\Innonsh\MonthlyGrocery\merchant-app\src\assets"

if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

# 1. Load source image
$src = [System.Drawing.Bitmap]::FromFile($sourcePath)
$w = $src.Width
$h = $src.Height

# 2. Create clean 1024x1024 bitmap where black corners are replaced with pure white
$clean = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cleanG = [System.Drawing.Graphics]::FromImage($clean)
$cleanG.Clear([System.Drawing.Color]::White)
$cleanG.DrawImage($src, 0, 0, $w, $h)
$cleanG.Dispose()

# Replace any dark corner pixels with white
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        # Only check corners (outside circle of radius ~460 from center)
        $dx = $x - ($w / 2)
        $dy = $y - ($h / 2)
        $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)
        if ($dist -gt 400) {
            $c = $clean.GetPixel($x, $y)
            # If dark/black pixel, make it white
            if ($c.R -lt 50 -and $c.G -lt 50 -and $c.B -lt 50) {
                $clean.SetPixel($x, $y, [System.Drawing.Color]::White)
            }
        }
    }
}

# Save cleaned high-res master copy
$cleanMasterPath = "$assetsDir\app_icon.png"
$clean.Save($cleanMasterPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved clean master to $cleanMasterPath"

# Also save 512x512 Play Store icon
$playStoreBmp = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$pg = [System.Drawing.Graphics]::FromImage($playStoreBmp)
$pg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$pg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$pg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$pg.Clear([System.Drawing.Color]::White)
$pg.DrawImage($clean, 0, 0, 512, 512)
$pg.Dispose()
$playStoreBmp.Save("$assetsDir\play_store_512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$playStoreBmp.Dispose()
Write-Host "Saved Play Store 512x512 icon"

# Function to generate resized icon
function Resize-Image {
    param(
        [System.Drawing.Bitmap]$sourceImg,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [double]$scaleFactor = 1.0,
        [bool]$clipCircle = $false,
        [bool]$transparentBg = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($transparentBg) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $g.Clear([System.Drawing.Color]::White)
    }

    if ($clipCircle) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $targetWidth, $targetHeight)
        $g.SetClip($path)
    }

    $scaledW = [int]($targetWidth * $scaleFactor)
    $scaledH = [int]($targetHeight * $scaleFactor)
    $offsetX = [int](($targetWidth - $scaledW) / 2)
    $offsetY = [int](($targetHeight - $scaledH) / 2)

    $g.DrawImage($sourceImg, $offsetX, $offsetY, $scaledW, $scaledH)
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($targetWidth x $targetHeight)"
}

# Icon dimensions for Android
# 1. Standard launcher icons (ic_launcher.png, ic_launcher_round.png)
$standardSizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

# 2. Adaptive icon foregrounds (108dp base grid, safe zone ~72dp -> scale factor ~0.72)
$foregroundSizes = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

foreach ($folder in $standardSizes.Keys) {
    $dir = "$resDir\$folder"
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $size = $standardSizes[$folder]
    # Square / standard launcher
    Resize-Image -sourceImg $clean -targetWidth $size -targetHeight $size -outputPath "$dir\ic_launcher.png" -scaleFactor 1.0 -clipCircle $false
    # Round launcher
    Resize-Image -sourceImg $clean -targetWidth $size -targetHeight $size -outputPath "$dir\ic_launcher_round.png" -scaleFactor 0.96 -clipCircle $true
}

foreach ($folder in $foregroundSizes.Keys) {
    $dir = "$resDir\$folder"
    $size = $foregroundSizes[$folder]
    # Foreground scaled to 70% in safe zone with white background
    Resize-Image -sourceImg $clean -targetWidth $size -targetHeight $size -outputPath "$dir\ic_launcher_foreground.png" -scaleFactor 0.70 -clipCircle $false -transparentBg $true
}

# 3. Create values/colors.xml if missing or add ic_launcher_background
$valuesDir = "$resDir\values"
if (-not (Test-Path $valuesDir)) {
    New-Item -ItemType Directory -Path $valuesDir -Force | Out-Null
}
$colorsPath = "$valuesDir\colors.xml"
$colorsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
"@
Set-Content -Path $colorsPath -Value $colorsXml -Encoding UTF8
Write-Host "Updated $colorsPath"

# 4. Create mipmap-anydpi-v26 for adaptive icons
$anyDpiDir = "$resDir\mipmap-anydpi-v26"
if (-not (Test-Path $anyDpiDir)) {
    New-Item -ItemType Directory -Path $anyDpiDir -Force | Out-Null
}

$adaptiveXml = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"@
Set-Content -Path "$anyDpiDir\ic_launcher.xml" -Value $adaptiveXml -Encoding UTF8
Set-Content -Path "$anyDpiDir\ic_launcher_round.xml" -Value $adaptiveXml -Encoding UTF8
Write-Host "Created mipmap-anydpi-v26 XML definitions"

$src.Dispose()
$clean.Dispose()
Write-Host "All merchant icons successfully generated!"
