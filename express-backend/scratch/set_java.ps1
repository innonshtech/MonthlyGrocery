[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
$p = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($p -notlike "*Android Studio\jbr\bin*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$p;C:\Program Files\Android\Android Studio\jbr\bin", "User")
    Write-Host "Java bin path added to user environment variables."
} else {
    Write-Host "Java path already present."
}
Write-Host "Java environment variables configured successfully!"
