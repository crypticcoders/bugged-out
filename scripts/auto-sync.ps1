# Auto-sync script for bugged-out
# Monitors C:\bugged out and pushes changes to https://github.com/crypticcoders/bugged-out

try {
    $Host.UI.RawUI.WindowTitle = "Git Auto-Sync (bugged-out)"
} catch {
    # Ignore when running hidden / redirected
}

$repoPath = "C:\bugged out"
Set-Location $repoPath

$logFile = Join-Path $repoPath ".autosync.log"

function Log-Message([string]$msg, [string]$color = "White") {
    $entry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    try {
        Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
    } catch {}
    Write-Host $entry -ForegroundColor $color
}

Log-Message "=================================================" "Cyan"
Log-Message " Git Auto-Sync Started for crypticcoders/bugged-out" "Green"
Log-Message " Repository: https://github.com/crypticcoders/bugged-out" "DarkCyan"
Log-Message " Monitoring folder: $repoPath" "Gray"
Log-Message " Press Ctrl+C in this window to stop auto-sync." "Yellow"
Log-Message "=================================================" "Cyan"

while ($true) {
    try {
        # Check if there are modified, untracked, or deleted files
        $status = git status --porcelain
        
        if ($status) {
            Log-Message "Changes detected. Waiting 3 seconds for file writes to settle..." "Yellow"
            Start-Sleep -Seconds 3

            # Check again to ensure changes are still present
            $statusAfter = git status --porcelain
            if ($statusAfter) {
                Log-Message "Staging changes..." "Cyan"
                git add -A

                $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                $commitMsg = "Auto-sync: $timestamp"

                Log-Message "Committing: '$commitMsg'..." "Cyan"
                $commitOutput = git commit -m "$commitMsg" 2>&1

                Log-Message "Pushing to GitHub (origin/main)..." "Cyan"
                $pushOutput = git push origin main 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Log-Message "Successfully synced to GitHub!" "Green"
                } else {
                    Log-Message "Push failed. Will retry on next cycle. Details:`n$pushOutput" "Red"
                }
            }
        }
    } catch {
        Log-Message "Unexpected error: $_" "Red"
    }

    Start-Sleep -Seconds 4
}
