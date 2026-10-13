Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\samar\.gemini\antigravity-ide\brain\2952da9f-db35-449c-b85c-aed17766bc98\.user_uploaded\media_1791711584300.png"
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)

$testDir = "C:\Users\samar\.gemini\antigravity-ide\brain\2952da9f-db35-449c-b85c-aed17766bc98\scratch\crops_test"
if (Test-Path $testDir) { Remove-Item -Path $testDir -Recurse -Force }
New-Item -ItemType Directory -Path $testDir | Out-Null

# Target standard size: 191 x 181
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

function Export-SubCategory($name, $srcX, $srcY, $srcW, $srcH, $bgColor) {
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

    # Fill background with theme color
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $g.FillRectangle($brush, 0, 0, $targetW, $targetH)
    $brush.Dispose()

    # Calculate destination rectangle to scale and center the cropped image inside card
    # Leave small padding (e.g. 8px top/bottom, 8px sides)
    $pad = 6
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

    $brush2 = New-Object System.Drawing.SolidBrush $bgColor
    $g2.FillRectangle($brush2, 0, 0, ($targetW * 2), ($targetH * 2))
    $brush2.Dispose()

    $dest2xRect = New-Object System.Drawing.Rectangle ($destX * 2), ($destY * 2), ($destW * 2), ($destH * 2)
    $g2.DrawImage($bmp, $dest2xRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $path2.Dispose()
    $g2.Dispose()

    $save2xPath = Join-Path $testDir "${name}@2x.png"
    $out2xBmp.Save($save2xPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $out2xBmp.Dispose()
}

# Colors
$cAtta = [System.Drawing.Color]::FromArgb(254, 246, 224)
$cRice = [System.Drawing.Color]::FromArgb(231, 247, 254)
$cDal = [System.Drawing.Color]::FromArgb(239, 225, 253)
$cOil = [System.Drawing.Color]::FromArgb(228, 252, 238)
$cDry = [System.Drawing.Color]::FromArgb(253, 225, 229)

# PANEL 1: Atta & Flour
Export-SubCategory "wheat_atta" 14 74 58 84 $cAtta
Export-SubCategory "multigrain_atta" 76 74 58 84 $cAtta
Export-SubCategory "maida" 138 74 58 84 $cAtta
Export-SubCategory "besan" 14 181 58 84 $cAtta
Export-SubCategory "sooji_rava" 76 181 58 84 $cAtta
Export-SubCategory "rice_flour" 138 181 58 84 $cAtta
Export-SubCategory "other_flours" 14 286 182 56 $cAtta

# PANEL 2: Rice
Export-SubCategory "basmati_rice" 218 74 58 84 $cRice
Export-SubCategory "sona_masoori_rice" 280 74 58 84 $cRice
Export-SubCategory "kolam_rice" 342 74 58 84 $cRice
Export-SubCategory "indrayani_rice" 218 181 58 84 $cRice
Export-SubCategory "brown_rice" 280 181 58 84 $cRice
Export-SubCategory "other_rice" 342 181 58 84 $cRice

# PANEL 3: Dal & Pulses
Export-SubCategory "toor_dal" 422 66 58 68 $cDal
Export-SubCategory "moong_dal" 484 66 58 68 $cDal
Export-SubCategory "masoor_dal" 546 66 58 68 $cDal
Export-SubCategory "chana_dal" 422 152 58 68 $cDal
Export-SubCategory "urad_dal" 484 152 58 68 $cDal
Export-SubCategory "moong_whole" 546 152 58 68 $cDal
Export-SubCategory "rajma" 422 244 58 68 $cDal
Export-SubCategory "kabuli_chana" 484 244 58 68 $cDal
Export-SubCategory "other_pulses" 546 244 58 68 $cDal

# PANEL 4: Edible Oil & Ghee
# Row 1 (4 items)
Export-SubCategory "sunflower_oil" 621 74 44 84 $cOil
Export-SubCategory "soybean_oil" 669 74 44 84 $cOil
Export-SubCategory "mustard_oil" 717 74 44 84 $cOil
Export-SubCategory "groundnut_oil" 765 74 44 84 $cOil
# Row 2 (3 items)
Export-SubCategory "rice_bran_oil" 621 176 58 82 $cOil
Export-SubCategory "coconut_oil" 682 176 58 82 $cOil
Export-SubCategory "other_cooking_oils" 743 176 66 82 $cOil
# Row 3 (2 items)
Export-SubCategory "other_cooking_oils_blended" 621 282 86 64 $cOil
Export-SubCategory "ghee" 711 282 98 64 $cOil

# PANEL 5: Dry Fruits & Nuts
Export-SubCategory "almonds" 828 66 58 68 $cDry
Export-SubCategory "cashews" 890 66 58 68 $cDry
Export-SubCategory "raisins" 952 66 58 68 $cDry
Export-SubCategory "walnuts" 828 152 58 68 $cDry
Export-SubCategory "pistachios" 890 152 58 68 $cDry
Export-SubCategory "dates" 952 152 58 68 $cDry
Export-SubCategory "anjeer" 828 244 58 68 $cDry
Export-SubCategory "mixed_dry_fruits" 890 244 58 68 $cDry
Export-SubCategory "seeds" 952 244 58 68 $cDry

$bmp.Dispose()
Write-Host "Export completed successfully! Total images: $((Get-ChildItem $testDir).Count)"
