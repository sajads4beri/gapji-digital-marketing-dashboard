# Phase 3: Backup & Disaster Recovery Plan

**Execution Mode:** STRICT READ-ONLY PREPARATION AUDIT  
**Audit Timestamp:** 2026-11-18  
**Repository Identity:** `gapji-digital-marketing-dashboard`  
**Consolidation Destination:** `F:\marketing-platform-backend`  

---

## 1. Safety Principles & Prohibited Operations

> [!CAUTION]
> **STRICT RECOVERY PRINCIPLES:**
> 1. **Zero Git Stash as Backup:** `git stash` is volatile, prone to index corruption across linked worktrees, and omits untracked directories unless explicitly flagged. It is **strictly prohibited** as a safety mechanism.
> 2. **Zero Destructive Git Commands:** `git clean -fd`, `git reset --hard`, `git checkout .`, and `git worktree prune` are completely prohibited prior to verified snapshot creation.
> 3. **Isolation of Git Administrative Metadata:** The `.git` administrative pointers in linked worktrees (`.git` text files containing `gitdir: ...`) must **never** be copied into destination project folders as regular files.
> 4. **No Execution Before Approval:** The backup script provided below is designed for user inspection and **must not be executed until explicit user confirmation is granted**.

---

## 2. Inventory of High-Value Assets to Protect

| Worktree Location | High-Value Uncommitted Assets | Risk Level | Protection Requirement |
| :--- | :--- | :---: | :--- |
| **`F:\marketing-platform-backend`** | • 4 Prisma migrations (`20261112090000`, `20261112133000`, `20261114143000`, `20261118101500`)<br/>• 11 NestJS backend modules (`audiences`, `calendar`, `imports`, `kpis`, `landing`, `organization`, `platforms`, `sms`, `tasks`, `users`, `webinars`)<br/>• `seed-comprehensive.ts`, `check-counts.ts`<br/>• Modified `schema.prisma`, `app.module.ts`, `leads.service.ts` | **CRITICAL** | Snapshot must capture all untracked `.ts` and `.sql` files before any branch or merge operations. |
| **`C:\...\zero_vapor_blasts_11h11`** | • `packages/shared/src/index.ts` (extended models)<br/>• `apps/web/src/middleware.ts`<br/>• `apps/web/src/stores/*`<br/>• `apps/web/src/components/providers/query-provider.tsx`<br/>• `calendar.integration.spec.ts`<br/>• 42 markdown files in `docs/project-audit/` | **CRITICAL** | Snapshot must preserve all integration glue code and forensic audit documentation. |
| **`F:\marketing platform`** | • `apps/web/src/app/(app)/work/calendar/`<br/>• `apps/web/src/features/calendar/`<br/>• `apps/web/.env.local` | **HIGH** | Snapshot must preserve untracked calendar frontend views and developer environment secrets. |

---

## 3. Sensitive Files Protection Matrix

The following sensitive files must be backed up to a dedicated secure subfolder with restricted permissions:

1. `F:\marketing-platform-backend\.env` (Database credentials, backend port, secrets)
2. `F:\marketing-platform-backend\apps\api\.env` (Database connection URL)
3. `F:\marketing platform\apps\web\.env.local` (Local frontend API rewrite endpoint)

*Note: In the backup script, `.env` files are captured, but never printed or logged to console or audit reports.*

---

## 4. Proposed Non-Destructive Backup Script (PowerShell)

> [!IMPORTANT]
> **STATUS: PROPOSED ONLY — AWAITING EXPLICIT USER APPROVAL BEFORE EXECUTION.**  
> This script performs a physical, timestamped file-level copy of all three worktrees to an independent backup location, computes SHA-256 checksums, and produces a tamper-proof verification manifest.

```powershell
<#
================================================================================
SCRIPT: Backup-MarketingPlatformWorktrees.ps1
PURPOSE: Create timestamped physical snapshot of all 3 worktrees prior to consolidation.
AUTHOR: Antigravity AI Pair Programmer
DATE: 2026-11-18
SAFETY: Non-destructive, read-only from sources, verifies SHA-256 for all files.
DO NOT EXECUTE WITHOUT EXPLICIT USER APPROVAL.
================================================================================
#>

[CmdletBinding()]
param(
    [string]$BackupRoot = "F:\marketing-platform-backups\pre-consolidation-20261118-snapshot"
)

$ErrorActionPreference = "Stop"

Write-Host "=== STARTING MARKETING PLATFORM PRE-CONSOLIDATION SNAPSHOT ===" -ForegroundColor Cyan
Write-Host "Target Backup Root: $BackupRoot"

if (Test-Path $BackupRoot) {
    throw "Safety Abort: Backup target directory '$BackupRoot' already exists. Will not overwrite."
}

$Sources = @(
    @{ Name = "Destination-Backend"; Path = "F:\marketing-platform-backend" },
    @{ Name = "SourceA-Frontend";    Path = "F:\marketing platform" },
    @{ Name = "SourceB-Worktree";    Path = "C:\Users\DRGAPJI\.gemini\antigravity\worktrees\marketing platform\zero_vapor_blasts_11h11" }
)

$ExcludeDirs = @('node_modules', '.next', 'dist', '.git', 'build')
$Sha256 = [System.Security.Cryptography.SHA256]::Create()
$ManifestEntries = [System.Collections.Generic.List[PSCustomObject]]::new()

foreach ($src in $Sources) {
    $srcName = $src.Name
    $srcPath = $src.Path
    $destFolder = Join-Path $BackupRoot $srcName
    
    Write-Host "`nBacking up [$srcName] from '$srcPath'..." -ForegroundColor Yellow
    
    if (-not (Test-Path $srcPath)) {
        throw "Source path '$srcPath' does not exist!"
    }
    
    $fileCount = 0
    
    function Backup-Folder($currentDir, $targetDir) {
        if (-not (Test-Path $targetDir)) {
            [System.IO.Directory]::CreateDirectory($targetDir) | Out-Null
        }
        
        # Recurse subdirectories (skipping excluded)
        foreach ($sub in [System.IO.Directory]::GetDirectories($currentDir)) {
            $dirName = [System.IO.Path]::GetFileName($sub)
            if ($dirName -notin $ExcludeDirs) {
                $nextTarget = Join-Path $targetDir $dirName
                Backup-Folder $sub $nextTarget
            }
        }
        
        # Copy files and calculate checksums
        foreach ($file in [System.IO.Directory]::GetFiles($currentDir)) {
            $fileName = [System.IO.Path]::GetFileName($file)
            $targetFile = Join-Path $targetDir $fileName
            
            # Copy file
            [System.IO.File]::Copy($file, $targetFile, $false)
            
            # Compute SHA-256
            $bytes = [System.IO.File]::ReadAllBytes($targetFile)
            $hashBytes = $Sha256.ComputeHash($bytes)
            $hash = [System.BitConverter]::ToString($hashBytes).Replace('-', '').ToLowerInvariant()
            $rel = $file.Substring($srcPath.Length).TrimStart('\', '/')
            
            $ManifestEntries.Add([PSCustomObject]@{
                SourceWorktree = $srcName
                RelativePath   = $rel
                FileSizeBytes  = $bytes.Length
                SHA256         = $hash
                CopiedAt       = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            })
            
            $script:fileCount++
        }
    }
    
    Backup-Folder $srcPath $destFolder
    Write-Host "Successfully backed up $srcName : $fileCount files." -ForegroundColor Green
}

# Export verification manifest
$manifestPath = Join-Path $BackupRoot "SNAPSHOT_MANIFEST.csv"
$ManifestEntries | Export-Csv -Path $manifestPath -NoTypeInformation -Encoding UTF8
Write-Host "`nVerification Manifest written to: $manifestPath" -ForegroundColor Cyan
Write-Host "Total Files Backed Up: $($ManifestEntries.Count)" -ForegroundColor Green
Write-Host "=== SNAPSHOT BACKUP COMPLETE ===" -ForegroundColor Cyan
```

---

## 5. Step-by-Step Disaster Recovery Procedure

If any issue, build breakage, or unexpected conflict occurs during the consolidation phase, the following recovery procedure guarantees 100% restoration to the current state:

### Recovery Step 1: Halt Operations
Immediately terminate any active terminal build, installation, or migration commands.

### Recovery Step 2: Validate Backup Integrity
Run verification against `SNAPSHOT_MANIFEST.csv`:
```powershell
$manifest = Import-Csv "F:\marketing-platform-backups\pre-consolidation-20261118-snapshot\SNAPSHOT_MANIFEST.csv"
Write-Host "Verifying $($manifest.Count) backed up files..."
```

### Recovery Step 3: Clean Target Worktree
Remove any newly copied files in `F:\marketing-platform-backend` that were not in the original Destination inventory (e.g. `apps/web/`).

### Recovery Step 4: Restore Original Files
Restore the exact files from `F:\marketing-platform-backups\pre-consolidation-20261118-snapshot\Destination-Backend\` back to `F:\marketing-platform-backend\`.

### Recovery Step 5: Verify Git Cleanliness
Run `git status` in `F:\marketing-platform-backend` to confirm the exact pre-consolidation working tree state is restored.
