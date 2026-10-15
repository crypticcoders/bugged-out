# bugged-out

Local workspace synchronized with GitHub repository: **[crypticcoders/bugged-out](https://github.com/crypticcoders/bugged-out)**

---

## 🔄 Automatic Synchronization

This repository includes an automatic synchronization system that monitors changes in `C:\bugged out` and pushes them directly to GitHub on `main`.

### How to use:
- **`start-autosync.bat`**: Launches the auto-sync watcher in a visible console window where you can see real-time sync logs.
- **`start-autosync-background.bat`**: Launches the auto-sync watcher silently in the background.
- **`stop-autosync.bat`**: Stops any background auto-sync process.
- **`sync-now.bat`**: Manually stage, commit, and push immediately with an optional custom message.

---

### How Auto-Sync Works
1. Runs in the background and checks for file changes every few seconds.
2. When a modification, new file, or deletion is detected, it pauses briefly (3 seconds) to let file writes complete (debounce).
3. Executes `git add -A`, commits with a formatted timestamp, and pushes to `origin/main`.
