[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\Admin\AppData\Local\Android\Sdk", "User")
$p = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($p -notlike "*platform-tools*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$p;C:\Users\Admin\AppData\Local\Android\Sdk\platform-tools;C:\Users\Admin\AppData\Local\Android\Sdk\emulator", "User")
    Write-Host "Paths added to user environment variables."
} else {
    Write-Host "Paths already present in environment variables."
}
Write-Host "Android environment variables configured successfully!"
