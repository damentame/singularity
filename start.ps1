#Requires -Version 5.1
<#
.SYNOPSIS
    Starts the full Singularity environment via Docker Compose.
    Works on Windows. Run from any directory.

.NOTES
    If PowerShell blocks this script, run once in an admin terminal:
        Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#>

# ── Colour helpers ────────────────────────────────────────────────────────────
$script:ErrorCount = 0

function Write-Ok   ($msg) { Write-Host "  [OK]  $msg"   -ForegroundColor Green  }
function Write-Fail ($msg) { Write-Host "  [!!]  $msg"   -ForegroundColor Red;    $script:ErrorCount++ }
function Write-Warn ($msg) { Write-Host "  [>>]  $msg"   -ForegroundColor Yellow }
function Write-Info ($msg) { Write-Host "  [->]  $msg"   -ForegroundColor Cyan   }
function Write-Hint ($msg) { Write-Host "          $msg"                          }
function Write-Hdr  ($msg) { Write-Host "`n$msg"          -ForegroundColor White  }

# Move to repo root (directory that contains this script)
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Singularity - Environment Startup       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Docker ─────────────────────────────────────────────────────────────────
Write-Hdr "1. Docker"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Fail "Docker is not installed"
    Write-Hint "Download Docker Desktop: https://www.docker.com/products/docker-desktop/"
    Write-Host "`nCannot continue without Docker." -ForegroundColor Red
    exit 1
}
Write-Ok "Docker found  ($(docker --version 2>&1))"

$null = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Docker daemon is not running"
    Write-Hint "Open Docker Desktop and wait for it to finish starting, then re-run this script."
    Write-Hint "You can tell it is ready when the whale icon in the system tray stops animating."
    Write-Host "`nCannot continue - Docker is not running." -ForegroundColor Red
    exit 1
}
Write-Ok "Docker daemon is running"

$null = docker compose version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Ok "Docker Compose v2  ($(docker compose version 2>&1))"
    $ComposeCmd = "docker compose"
} elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Write-Warn "Using legacy docker-compose v1 - upgrade Docker Desktop to get Compose v2"
    $ComposeCmd = "docker-compose"
} else {
    Write-Fail "Docker Compose not found"
    Write-Hint "Re-install Docker Desktop - Compose is bundled with it."
    Write-Host "`nCannot continue without Docker Compose." -ForegroundColor Red
    exit 1
}

# ── 2. Git branch ─────────────────────────────────────────────────────────────
Write-Hdr "2. Git branch"

$currentBranch = (git rev-parse --abbrev-ref HEAD 2>&1).ToString().Trim()
if ($currentBranch -eq "develop") {
    Write-Ok "On branch: develop"
} else {
    Write-Warn "Current branch is '$currentBranch', not 'develop'"
    Write-Hint "Switch with:  git checkout develop  (then re-run this script)"
    Write-Hint "Continuing on '$currentBranch' anyway..."
}

# ── 3. Environment variables ──────────────────────────────────────────────────
Write-Hdr "3. Environment variables"

# Parses a .env file into a hashtable. Ignores comments and blank lines.
function Read-DotEnv ($Path) {
    $vars = @{}
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            $line = $_.Trim()
            if ($line -and $line -notmatch '^#' -and $line -match '^([^=]+)=(.*)$') {
                $key = $Matches[1].Trim()
                $val = $Matches[2].Trim().Trim('"').Trim("'")
                $vars[$key] = $val
            }
        }
    }
    return $vars
}

# Checks that a variable exists in the hashtable and is not a placeholder.
function Test-EnvVar ($vars, $name, $hint) {
    if (-not $vars.ContainsKey($name)) {
        Write-Fail "$name  is missing"
        Write-Hint "Add this line to the file:  $name=<$hint>"
        return $false
    }
    $val = $vars[$name]
    if ([string]::IsNullOrWhiteSpace($val) -or $val -match '<.+>' -or $val -match '^your[-_]') {
        Write-Fail "$name  is still a placeholder:  '$val'"
        Write-Hint "Replace it with:  $hint"
        return $false
    }
    Write-Ok "$name"
    return $true
}

# ── frontend\.env ─────────────────────────────────────────────────────────────
$FrontendEnv = "frontend\.env"

if (Test-Path $FrontendEnv) {
    Write-Ok "frontend\.env exists"
    $feVars = Read-DotEnv $FrontendEnv
    $null = Test-EnvVar $feVars "VITE_SUPABASE_URL"      "your Supabase project URL (e.g. https://xxxx.databasepad.com)"
    $null = Test-EnvVar $feVars "VITE_SUPABASE_ANON_KEY"  "anon key from your Supabase / Databasepad dashboard -> Settings -> API"
} else {
    Write-Fail "frontend\.env  not found"
    Write-Hint "Create it from the repo-root example:"
    Write-Hint "  Copy-Item .env.example frontend\.env"
    Write-Hint "Then open frontend\.env and set:"
    Write-Hint "  VITE_SUPABASE_URL=https://qdgjitmgoruiyajojjcr.databasepad.com"
    Write-Hint "  VITE_SUPABASE_ANON_KEY=<your anon key>"
    Write-Hint ""
    Write-Hint "Note: VITE_ vars are baked into the frontend bundle at build time."
    $script:ErrorCount += 2
}

# ── backend\.env ──────────────────────────────────────────────────────────────
$BackendEnv = "backend\.env"

if (Test-Path $BackendEnv) {
    Write-Ok "backend\.env exists"
    $beVars = Read-DotEnv $BackendEnv
    $null = Test-EnvVar $beVars "SUPABASE_URL"              "your Supabase project URL (e.g. https://xxxx.databasepad.com)"
    $null = Test-EnvVar $beVars "SUPABASE_ANON_KEY"          "anon key from your Supabase / Databasepad dashboard -> Settings -> API"
    $null = Test-EnvVar $beVars "SUPABASE_SERVICE_ROLE_KEY"   "service_role key from Databasepad dashboard -> Settings -> API  (keep this secret!)"
} else {
    Write-Fail "backend\.env  not found"
    Write-Hint "Create it from the example:"
    Write-Hint "  Copy-Item backend\.env.example backend\.env"
    Write-Hint "Then open backend\.env and fill in the three Supabase values:"
    Write-Hint "  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
    Write-Hint ""
    Write-Hint "The service role key bypasses Row Level Security - never commit it."
    $script:ErrorCount += 3
}

# ── 4. Port availability ──────────────────────────────────────────────────────
Write-Hdr "4. Port availability"

function Test-PortFree ($Port, $Service) {
    $occupied = $false
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $occupied = $true }
    } catch {
        # Fallback: netstat
        $ns = netstat -ano 2>$null | Select-String ":$Port\s"
        if ($ns) { $occupied = $true }
    }

    if ($occupied) {
        Write-Warn "Port $Port is already in use  (needed by $Service)"
        Write-Hint "To see what's using it:  netstat -ano | findstr :$Port"
        Write-Hint "Or stop existing containers:  $ComposeCmd down"
    } else {
        Write-Ok "Port $Port is free  ($Service)"
    }
}

Test-PortFree 8080 "frontend"
Test-PortFree 8000 "backend API"

# ── 5. Launch ─────────────────────────────────────────────────────────────────
Write-Hdr "5. Starting"

if ($script:ErrorCount -gt 0) {
    Write-Host ""
    Write-Host "  [!!]  Found $($script:ErrorCount) issue(s) above — fix them then re-run this script." -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Export VITE_ vars as process-level env vars so docker compose can forward
# them as build args to the frontend image (see docker-compose.yml build.args).
if (Test-Path $FrontendEnv) {
    $feVars = Read-DotEnv $FrontendEnv
    foreach ($key in $feVars.Keys) {
        [System.Environment]::SetEnvironmentVariable($key, $feVars[$key], "Process")
    }
}

Write-Info "Building images and starting containers..."
Write-Info "(First build downloads base images and may take 3-5 minutes)"
Write-Host ""

Invoke-Expression "$ComposeCmd up --build -d"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  [!!]  docker compose failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Common causes:" -ForegroundColor White
    Write-Hint "* Out of Docker memory - increase it: Docker Desktop -> Settings -> Resources -> Memory"
    Write-Hint "* Port conflict from a previous run - stop it:  $ComposeCmd down"
    Write-Hint "* Stale build cache - force a clean rebuild:  $ComposeCmd build --no-cache"
    Write-Hint "* Network issue pulling base images - check your internet connection"
    Write-Hint ""
    Write-Hint "Run  $ComposeCmd logs  to see the full error output."
    exit 1
}

Write-Host ""
Write-Host "  [OK]  All services are up!" -ForegroundColor Green
Write-Host ""
Write-Host "  URLs" -ForegroundColor White
Write-Host "  Frontend   ->  http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Backend    ->  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API docs   ->  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Useful commands" -ForegroundColor White
Write-Host "  $ComposeCmd logs -f              # stream all logs"
Write-Host "  $ComposeCmd logs -f backend      # backend logs only"
Write-Host "  $ComposeCmd logs -f frontend     # frontend logs only"
Write-Host "  $ComposeCmd down                 # stop all containers"
Write-Host "  $ComposeCmd build --no-cache     # force a clean rebuild"
Write-Host ""
