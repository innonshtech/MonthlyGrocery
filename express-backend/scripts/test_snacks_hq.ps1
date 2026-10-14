Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\samar\.gemini\antigravity-ide\brain\2952da9f-db35-449c-b85c-aed17766bc98\.user_uploaded\media_1791795677371.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)

$testDir = "C:\Users\samar\.gemini\antigravity-ide\brain\2952da9f-db35-449c-b85c-aed17766bc98\scratch\crops_snacks_hq"
if (Test-Path $testDir) { Remove-Item -Path $testDir -Recurse -Force }
New-Item -ItemType Directory -Path $testDir | Out-Null

$targetW = 191
$targetH = 181
$cornerRadius = 18

function Get-RoundedPath($rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Export-Clean($name, $srcX, $srcY, $srcW, $srcH, $exactBgColor) {
    # 1. Standard (191 x 181)
    $outBmp = New-Object System.Drawing.Bitmap $targetW, $targetH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $cardRect = New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH
    $path = Get-RoundedPath $cardRect $cornerRadius
    $g.SetClip($path)

    $brush = New-Object System.Drawing.SolidBrush $exactBgColor
    $g.FillRectangle($brush, 0, 0, $targetW, $targetH)
    $brush.Dispose()

    $pad = 8
    $availW = $targetW - ($pad * 2)
    $availH = $targetH - ($pad * 2)

    $scale = [Math]::Min($availW / $srcW, $availH / $srcH)
    $destW = [int]($srcW * $scale)
    $destH = [int]($srcH * $scale)
    $destX = [int](($targetW - $destW) / 2)
    $destY = [int](($targetH - $destH) / 2)

    $srcRect = New-Object System.Drawing.Rectangle $srcX, $srcY, $srcW, $srcH
    $destRect = New-Object System.Drawing.Rectangle $destX, $destY, $destW, $destH

    $g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $path.Dispose()
    $g.Dispose()

    $savePath = Join-Path $testDir "$name.png"
    $outBmp.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()

    # 2. @2x (382 x 362)
    $out2xBmp = New-Object System.Drawing.Bitmap ($targetW * 2), ($targetH * 2), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g2 = [System.Drawing.Graphics]::FromImage($out2xBmp)
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $cardRect2 = New-Object System.Drawing.Rectangle 0, 0, ($targetW * 2), ($targetH * 2)
    $path2 = Get-RoundedPath $cardRect2 ($cornerRadius * 2)
    $g2.SetClip($path2)

    $brush2 = New-Object System.Drawing.SolidBrush $exactBgColor
    $g2.FillRectangle($brush2, 0, 0, ($targetW * 2), ($targetH * 2))
    $brush2.Dispose()

    $dest2xRect = New-Object System.Drawing.Rectangle ($destX * 2), ($destY * 2), ($destW * 2), ($destH * 2)
    $g2.DrawImage($bmp, $dest2xRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $path2.Dispose()
    $g2.Dispose()

    $save2xPath = Join-Path $testDir "${name}@2x.png"
    $out2xBmp.Save($save2xPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $out2xBmp.Dispose()

    Write-Host "Exported: $name"
}

$cSnacks = [System.Drawing.Color]::FromArgb(252, 238, 203)

# Row 1 (y: 148 to 308)
Export-Clean "77_namkeen" 24 148 224 160 $cSnacks
Export-Clean "78_chips" 526 148 226 160 $cSnacks
Export-Clean "79_snacks" 274 148 224 160 $cSnacks

# Row 3 (y: 546 to 702)
Export-Clean "80_cheese_balls" 526 546 226 156 $cSnacks

$bmp.Dispose()
Write-Host "All 4 requested Snacks HQ crops exported!"
