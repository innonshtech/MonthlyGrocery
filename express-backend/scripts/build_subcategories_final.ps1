Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\samar\.gemini\antigravity-ide\brain\2952da9f-db35-449c-b85c-aed17766bc98\.user_uploaded\media_1791711584300.png"
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)

$destRoot = "c:\Users\samar\OneDrive\Desktop\MonthlyGrocery\categories\Sub Category"
if (Test-Path $destRoot) { Remove-Item -Path $destRoot -Recurse -Force }
New-Item -ItemType Directory -Path $destRoot | Out-Null

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

function Save-Card($filename, $srcX, $srcY, $srcW, $srcH, $bgColor, $categorySubdir) {
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

    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $g.FillRectangle($brush, 0, 0, $targetW, $targetH)
    $brush.Dispose()

    $pad = 10
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

    # Save flat in Sub Category folder
    $outBmp.Save((Join-Path $destRoot "$filename.png"), [System.Drawing.Imaging.ImageFormat]::Png)

    # Also save inside categorized subfolder
    $catDir = Join-Path $destRoot $categorySubdir
    if (-not (Test-Path $catDir)) { New-Item -ItemType Directory -Path $catDir | Out-Null }
    $outBmp.Save((Join-Path $catDir "$filename.png"), [System.Drawing.Imaging.ImageFormat]::Png)
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

    $out2xBmp.Save((Join-Path $destRoot "${filename}@2x.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $out2xBmp.Save((Join-Path $catDir "${filename}@2x.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $out2xBmp.Dispose()

    Write-Host "Exported: $filename"
}

# Pastel card background colors matching category tiles
$cAtta = [System.Drawing.Color]::FromArgb(254, 237, 193)
$cRice = [System.Drawing.Color]::FromArgb(208, 238, 254)
$cDal  = [System.Drawing.Color]::FromArgb(236, 223, 254)
$cOil  = [System.Drawing.Color]::FromArgb(210, 248, 222)
$cDry  = [System.Drawing.Color]::FromArgb(253, 225, 230)

# 1. Atta & Flour
Save-Card "01_wheat_atta" 16 74 54 82 $cAtta "01_Atta & Flour"
Save-Card "02_multigrain_atta" 78 74 54 82 $cAtta "01_Atta & Flour"
Save-Card "03_maida" 140 74 54 82 $cAtta "01_Atta & Flour"
Save-Card "04_besan" 16 181 54 80 $cAtta "01_Atta & Flour"
Save-Card "05_sooji_rava" 78 181 54 80 $cAtta "01_Atta & Flour"
Save-Card "06_rice_flour" 140 181 54 80 $cAtta "01_Atta & Flour"
Save-Card "07_other_flours" 16 286 178 54 $cAtta "01_Atta & Flour"

# 2. Rice
Save-Card "08_basmati_rice" 220 74 54 82 $cRice "02_Rice"
Save-Card "09_sona_masoori_rice" 282 74 54 82 $cRice "02_Rice"
Save-Card "10_kolam_rice" 344 74 54 82 $cRice "02_Rice"
Save-Card "11_indrayani_rice" 220 181 54 80 $cRice "02_Rice"
Save-Card "12_brown_rice" 282 181 54 80 $cRice "02_Rice"
Save-Card "13_other_rice" 344 181 54 80 $cRice "02_Rice"

# 3. Dal & Pulses
Save-Card "14_toor_dal" 424 74 54 62 $cDal "03_Dal & Pulses"
Save-Card "15_moong_dal" 486 74 54 62 $cDal "03_Dal & Pulses"
Save-Card "16_masoor_dal" 548 74 54 62 $cDal "03_Dal & Pulses"
Save-Card "17_chana_dal" 424 153 54 65 $cDal "03_Dal & Pulses"
Save-Card "18_urad_dal" 486 153 54 65 $cDal "03_Dal & Pulses"
Save-Card "19_moong_whole" 548 153 54 65 $cDal "03_Dal & Pulses"
Save-Card "20_rajma" 424 244 54 66 $cDal "03_Dal & Pulses"
Save-Card "21_kabuli_chana" 486 244 54 66 $cDal "03_Dal & Pulses"
Save-Card "22_other_pulses" 548 244 54 66 $cDal "03_Dal & Pulses"

# 4. Edible Oil & Ghee
Save-Card "23_sunflower_oil" 621 74 44 82 $cOil "04_Edible Oil & Ghee"
Save-Card "24_soybean_oil" 669 74 44 82 $cOil "04_Edible Oil & Ghee"
Save-Card "25_mustard_oil" 717 74 44 82 $cOil "04_Edible Oil & Ghee"
Save-Card "26_groundnut_oil" 765 74 44 82 $cOil "04_Edible Oil & Ghee"
Save-Card "27_rice_bran_oil" 622 186 44 68 $cOil "04_Edible Oil & Ghee"
Save-Card "28_coconut_oil" 674 186 60 68 $cOil "04_Edible Oil & Ghee"
Save-Card "29_other_cooking_oils" 746 186 60 68 $cOil "04_Edible Oil & Ghee"
Save-Card "30_other_cooking_oils_blended" 626 286 80 47 $cOil "04_Edible Oil & Ghee"
Save-Card "31_ghee" 714 286 90 47 $cOil "04_Edible Oil & Ghee"

# 5. Dry Fruits & Nuts
Save-Card "32_almonds" 830 74 54 62 $cDry "05_Dry Fruits & Nuts"
Save-Card "33_cashews" 892 74 54 62 $cDry "05_Dry Fruits & Nuts"
Save-Card "34_raisins" 954 74 54 62 $cDry "05_Dry Fruits & Nuts"
Save-Card "35_walnuts" 830 153 54 65 $cDry "05_Dry Fruits & Nuts"
Save-Card "36_pistachios" 892 153 54 65 $cDry "05_Dry Fruits & Nuts"
Save-Card "37_dates" 954 153 54 65 $cDry "05_Dry Fruits & Nuts"
Save-Card "38_anjeer" 830 244 54 66 $cDry "05_Dry Fruits & Nuts"
Save-Card "39_mixed_dry_fruits" 892 244 54 66 $cDry "05_Dry Fruits & Nuts"
Save-Card "40_seeds" 954 244 54 66 $cDry "05_Dry Fruits & Nuts"

$bmp.Dispose()
Write-Host "All subcategory cards exported successfully!"
