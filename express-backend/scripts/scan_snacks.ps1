Add-Type -AssemblyName System.Drawing

$path = 'C:\Users\samar\.gemini\antigravity-ide\brain\2952da9f-db35-449c-b85c-aed17766bc98\.user_uploaded\media_1791795677371.jpg'
$bmp = [System.Drawing.Bitmap]::FromFile($path)

Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

# Sample card backgrounds:
Write-Host "`nSampling card backgrounds:"
foreach ($pt in @(@(230, 200), @(480, 200), @(730, 200), @(980, 200), @(730, 580))) {
    $c = $bmp.GetPixel($pt[0], $pt[1])
    Write-Host "($($pt[0]), $($pt[1])): R=$($c.R), G=$($c.G), B=$($c.B)"
}

# Scan Row 1 Card top at x=230:
Write-Host "`nRow 1 card top scan at x=230:"
for ($y = 135; $y -le 160; $y++) {
    $c = $bmp.GetPixel(230, $y)
    Write-Host "y=$y : R=$($c.R), G=$($c.G), B=$($c.B)"
}

# Scan Row 1 Text tops:
function Find-TextTop($name, $x1, $x2, $yStart, $yEnd) {
    for ($y = $yStart; $y -le $yEnd; $y++) {
        for ($x = $x1; $x -le $x2; $x++) {
            $c = $bmp.GetPixel($x, $y)
            # Dark brown text: R < 95, G < 50, B < 30
            if ($c.R -lt 95 -and $c.G -lt 50 -and $c.B -lt 30) {
                Write-Host "${name} text starts at y=$y (x=$x, R=$($c.R), G=$($c.G), B=$($c.B))"
                return $y
            }
        }
    }
    Write-Host "${name}: No text found in range $yStart..$yEnd"
    return -1
}

Write-Host "`n--- ROW 1 Text Tops ---"
Find-TextTop "Namkeen" 30 240 310 340
Find-TextTop "Extruded Snacks" 280 490 310 340
Find-TextTop "Potato Chips" 530 740 310 340

# Scan Row 3 Card top at x=730 (Col 3 Cheese Balls):
Write-Host "`nRow 3 card top scan at x=730:"
for ($y = 530; $y -le 560; $y++) {
    $c = $bmp.GetPixel(730, $y)
    Write-Host "y=$y : R=$($c.R), G=$($c.G), B=$($c.B)"
}

Write-Host "`n--- ROW 3 Cheese Balls Text Top ---"
Find-TextTop "Cheese Balls" 530 740 685 725

# Check column boundaries at y=200:
Write-Host "`nColumn Margins Check at y=200:"
function Check-H($startX, $endX) {
    for ($x = $startX; $x -le $endX; $x++) {
        $c = $bmp.GetPixel($x, 200)
        Write-Host "x=$x : R=$($c.R), G=$($c.G), B=$($c.B)"
    }
}
Write-Host "Col 1 left (15..30):"
Check-H 15 30
Write-Host "`nCol 1 right / Col 2 left (245..275):"
Check-H 245 275
Write-Host "`nCol 2 right / Col 3 left (495..530):"
Check-H 495 530
Write-Host "`nCol 3 right / Col 4 left (745..780):"
Check-H 745 780

$bmp.Dispose()
