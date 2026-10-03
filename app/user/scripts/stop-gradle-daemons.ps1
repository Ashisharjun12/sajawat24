# Stops Gradle daemons only (not VS Code / Red Hat Java language server).
# Run before npm install if you see EBUSY on expo-modules-autolinking.

$daemons = Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match 'GradleDaemon' }

if (-not $daemons) {
  Write-Host "No GradleDaemon java processes found."
  exit 0
}

foreach ($p in $daemons) {
  Write-Host "Stopping Gradle daemon PID $($p.ProcessId)"
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2
Write-Host "Done."
