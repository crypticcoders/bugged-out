# Auto-sync script for bugged-out
# Monitors c:\bugged out and pushes changes to https://github.com/crypticcoders/bugged-out

$Host.UI.RawUI.WindowTitle = "Git Auto-Sync (bugged-out)"
$repoPath = "C:\bugged out"
Set-Location $repoPath

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Git Auto-Sync Started for crypticcoders/bugged-out" -ForegroundColor Green
Write-Host " Repository: https://github.com/crypticcoders/bugged-out" -ForegroundColor DarkCyan
Write-Host " Monitoring folder: $repoPath" -ForegroundColor Gray
Write-Host " Press Ctrl+C in this window to stop auto-sync." -ForegroundColor Yellow
Write-Host "=================================================`n" -ForegroundColor Cyan

$lastSync = Get-Date

while ($true) {
    try {
        # Check if there are modified, untracked, or deleted files
        $status = git status --porcelain
        
        if ($status) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Change detected. Waiting 3 seconds for file writes to settle..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3

            # Check again to ensure files are still changed
            $statusAfter = git status --porcelain
            if ($statusAfter) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Staging changes..." -ForegroundColor Cyan
                git add -A

                $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                $commitMsg = "Auto-sync: $timestamp"

                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Committing: '$commitMsg'..." -ForegroundColor Cyan
                $commitOutput = git commit -m "$commitMsg" 2>&1

                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Pushing to GitHub (origin/main)..." -ForegroundColor Cyan
                $pushOutput = git push origin main 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Successfully synced to GitHub!" -ForegroundColor Green
                    $lastSync = Get-Date
                } else {
                    Write-Warning "[$(Get-Date -Format 'HH:mm:ss')] Push failed. Will retry on next cycle. Details:`n$pushOutput"
                }
            }
        }
    } catch {
        Write-Warning "[$(Get-Date -Format 'HH:mm:ss')] An unexpected error occurred: $_"
    }

    Start-Sleep -Seconds 4
}
