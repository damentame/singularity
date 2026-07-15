#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstraps prerequisites, syncs develop, and starts Singularity via Docker Compose.
    Works on Windows. Run from any directory (including a fresh machine).

.NOTES
    If PowerShell blocks this script, run once in an admin terminal:
        Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#>

$script:ErrorCount = 0
$script:SupabaseCliSource = ""
$script:LastSupabaseExitCode = 0
$script:ApiUrl = ""
$script:AnonKey = ""
$script:ServiceRoleKey = ""
$script:DefaultRepoUrl = "https://github.com/damentame/singularity.git"
$script:DockerJustInstalled = $false

function Write-Ok   ($msg) { Write-Host "  [OK]  $msg" -ForegroundColor Green }
function Write-Fail ($msg) { Write-Host "  [!!]  $msg" -ForegroundColor Red; $script:ErrorCount++ }
function Write-Warn ($msg) { Write-Host "  [>>]  $msg" -ForegroundColor Yellow }
function Write-Info ($msg) { Write-Host "  [->]  $msg" -ForegroundColor Cyan }
function Write-Hint ($msg) { Write-Host "          $msg" }
function Write-Hdr  ($msg) { Write-Host ""; Write-Host $msg -ForegroundColor White }
function Write-Step ($num, $total, $name) { Write-Hdr "Step ${num}/${total}: ${name}" }

function Write-StartupIntro {
    Write-Host "  This script sets up everything and starts Singularity in one run."
    Write-Host "  First run may take 15-30 minutes (downloads tools, images, and code)."
    Write-Host "  Later runs are usually much faster."
    Write-Host ""
    Write-Host "  Status legend:  [OK] done   [->] working   [>>] note   [!!] problem"
    Write-Host ""
}

function Test-CommandAvailable ($Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-SessionPath {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

function Add-PathIfExists {
    param([string]$Path)
    if ($Path -and (Test-Path $Path) -and ($env:Path -notlike "*$Path*")) {
        $env:Path = "$Path;$env:Path"
    }
}

function Initialize-ToolPaths {
    Refresh-SessionPath
    Add-PathIfExists "${env:ProgramFiles}\Git\cmd"
    Add-PathIfExists "${env:ProgramFiles(x86)}\Git\cmd"
    Add-PathIfExists "${env:ProgramFiles}\nodejs"
    Add-PathIfExists "${env:ProgramFiles}\Docker\Docker\resources\bin"
    Add-PathIfExists "${env:LocalAppData}\Programs\Docker\Docker\resources\bin"
}

function Wait-ForCommand {
    param(
        [string]$Name,
        [int]$TimeoutSeconds = 300
    )

    $elapsed = 0
    $lastMessage = 0
    while ($elapsed -lt $TimeoutSeconds) {
        Initialize-ToolPaths
        if (Test-CommandAvailable $Name) { return $true }
        if (($elapsed - $lastMessage) -ge 15) {
            Write-Info "Waiting for ${Name} to become available after install... ($($TimeoutSeconds - $elapsed)s remaining)"
            $lastMessage = $elapsed
        }
        Start-Sleep -Seconds 3
        $elapsed += 3
    }
    return $false
}

function Ensure-ToolsReady {
    Initialize-ToolPaths
    foreach ($tool in @("git", "node", "docker")) {
        if (-not (Test-CommandAvailable $tool)) {
            Wait-ForCommand -Name $tool -TimeoutSeconds 300 | Out-Null
        }
    }
}

function Test-NeedsPrerequisitesInstall {
    return -not (
        (Test-CommandAvailable "git") -and
        (Test-CommandAvailable "node") -and
        (Test-CommandAvailable "docker")
    )
}

function Install-WindowsPackage {
    param(
        [string]$WingetId,
        [string]$Label
    )

    if (-not (Test-CommandAvailable "winget")) {
        Write-Warn "winget is not available - cannot auto-install ${Label}"
        Write-Hint "Install ${Label} manually, then re-run this script."
        return $false
    }

    Write-Info "Installing ${Label} via winget..."
    Write-Hint "This may take several minutes - winget is downloading and installing in the background."
    $null = winget install --id $WingetId -e --accept-source-agreements --accept-package-agreements 2>&1
    Refresh-SessionPath
    return $true
}

function Install-PrerequisitesWindows {
    Write-Info "Detected OS: Windows"
    Write-Info "Checking for Git, Node.js, and Docker - installing anything that is missing."

    if (-not (Test-CommandAvailable "git")) {
        Install-WindowsPackage "Git.Git" "Git" | Out-Null
    }
    if (Test-CommandAvailable "git") { Write-Ok "Git found  ($(git --version 2>&1))" }
    else { Write-Fail "Git is required but could not be installed automatically" }

    if (-not (Test-CommandAvailable "node")) {
        Install-WindowsPackage "OpenJS.NodeJS.LTS" "Node.js LTS" | Out-Null
    }
    Refresh-SessionPath
    if (Test-CommandAvailable "node") { Write-Ok "Node.js found  ($(node --version 2>&1))" }
    else { Write-Fail "Node.js is required but could not be installed automatically" }

    if (-not (Test-CommandAvailable "docker")) {
        Install-WindowsPackage "Docker.DockerDesktop" "Docker Desktop" | Out-Null
        $script:DockerJustInstalled = $true
    }
    Refresh-SessionPath
    Ensure-ToolsReady
    if (Test-CommandAvailable "docker") { Write-Ok "Docker CLI found  ($(docker --version 2>&1))" }
    else { Write-Fail "Docker is required but could not be installed automatically" }

    if ($script:DockerJustInstalled -and (Test-CommandAvailable "docker")) {
        Write-Info "Starting Docker Desktop after fresh install..."
        Start-DockerDesktop | Out-Null
    }
}

function Test-NeedsRepositorySync {
    if (-not (Test-CommandAvailable "git")) { return $true }
    if (-not (Test-Path ".git")) { return $true }

    $branch = (git rev-parse --abbrev-ref HEAD 2>&1).ToString().Trim()
    if ($branch -ne "develop") { return $true }

    $null = git rev-parse origin/develop 2>&1
    if ($LASTEXITCODE -ne 0) { return $true }

    $behind = (git rev-list --count HEAD..origin/develop 2>&1).ToString().Trim()
    if ($behind -match '^\d+$' -and [int]$behind -gt 0) { return $true }

    return $false
}

function Sync-DevelopBranch {
    param([string]$RepoUrl = $script:DefaultRepoUrl)

    if (-not (Test-CommandAvailable "git")) {
        Write-Fail "Git is not available - cannot sync repository"
        return
    }

    if (-not (Test-Path ".git")) {
        Write-Info "No git repository here - cloning ${RepoUrl}..."
        $otherItems = Get-ChildItem $RepoRoot -Force | Where-Object {
            $_.Name -notin @("start.ps1", "start.sh")
        }

        if ($otherItems.Count -gt 0) {
            Write-Warn "Directory is not empty and not a git repo."
            Write-Hint "Clone manually: git clone ${RepoUrl}"
            Write-Fail "Cannot auto-clone into a non-empty folder"
            return
        }

        git clone --branch develop $RepoUrl . 2>&1 | ForEach-Object { Write-Hint $_ }
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "git clone failed"
            Write-Hint "Check your internet connection and that you can access GitHub."
            Write-Hint "Try manually:  git clone --branch develop $RepoUrl ."
            return
        }
        Write-Ok "Repository cloned to develop"
        return
    }

    Write-Info "Fetching latest code from origin..."
    Write-Hint "Downloading updates from GitHub - this is usually quick."
    $null = git fetch origin 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "git fetch failed"
        return
    }

    $null = git checkout develop 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Creating local develop branch from origin/develop..."
        $null = git checkout -B develop origin/develop 2>&1
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Could not checkout develop branch"
        return
    }

    $status = git status --porcelain 2>&1
    $null = git pull --ff-only origin develop 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($status) {
            Write-Warn "Local changes blocked fast-forward - stashing, pulling, then restoring"
            $null = git stash push -m "singularity-start-autostash" 2>&1
            $null = git pull --ff-only origin develop 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warn "Fast-forward still blocked - resetting to origin/develop"
                $null = git reset --hard origin/develop 2>&1
            }
            $null = git stash pop 2>&1
        } else {
            Write-Warn "Fast-forward pull failed - resetting to origin/develop"
            $null = git reset --hard origin/develop 2>&1
        }
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "On latest develop  ($(git rev-parse --short HEAD))"
    } else {
        Write-Fail "Could not sync develop branch to latest"
    }
}

function Stop-PortListeners {
    param([int]$Port)

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            if ($procId -and $procId -ne 0) {
                Write-Info "Stopping process ${procId} on port ${Port}"
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        $matches = netstat -ano 2>$null | Select-String ":$Port\s"
        foreach ($line in $matches) {
            $parts = ($line -split '\s+') | Where-Object { $_ }
            $procId = $parts[-1]
            if ($procId -match '^\d+$') {
                Write-Info "Stopping process ${procId} on port ${Port}"
                Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

function Test-NeedsCleanup {
    foreach ($port in @(8080, 8000)) {
        try {
            $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
            if ($conn) { return $true }
        } catch {
            $ns = netstat -ano 2>$null | Select-String ":$port\s"
            if ($ns) { return $true }
        }
    }

    if ((Test-CommandAvailable "docker") -and (Test-Path "docker-compose.yml")) {
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $running = @(docker compose ps -q 2>$null) | Where-Object { $_ }
            if ($running.Count -gt 0) { return $true }
        }
    }

    return $false
}

function Stop-ExistingEnvironment {
    Write-Info "Stopping existing Singularity containers..."
    if (Test-CommandAvailable "docker") {
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            if (Test-Path "docker-compose.yml") {
                $null = docker compose down --remove-orphans 2>&1
            }
            if (Test-CommandAvailable "npx") {
                $null = npx --yes supabase stop 2>&1
            } elseif (Test-CommandAvailable "supabase") {
                $null = supabase stop 2>&1
            }
        }
    }

    foreach ($port in @(8080, 8000, 54321, 54322, 54323, 54324)) {
        Stop-PortListeners -Port $port
    }

    Write-Ok "Cleanup complete"
}

function Write-SkippedPrerequisites {
    Write-Ok "Git, Node.js, and Docker already installed - skipping"
    Write-Ok "Git found  ($(git --version 2>&1))"
    Write-Ok "Node.js found  ($(node --version 2>&1))"
    Write-Ok "Docker CLI found  ($(docker --version 2>&1))"
}

function Test-IsPlaceholder ($Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) { return $true }
    if ($Value -match '<.+>') { return $true }
    if ($Value -match '^your[-_]') { return $true }
    return $false
}

function Read-EnvValue {
    param(
        [string]$File,
        [string]$Var
    )

    if (-not (Test-Path $File)) { return $null }

    $line = Select-String -Path $File -Pattern "^${Var}=" -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $line) { return $null }

    $value = $line.Line.Substring($Var.Length + 1)
    $value = $value.Trim().Trim('"').Trim("'")
    return $value
}

function Set-EnvFileValue {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Value
    )

    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    if (-not (Test-Path $Path)) {
        New-Item -ItemType File -Path $Path -Force | Out-Null
    }

    $escapedName = [regex]::Escape($Name)
    $lines = Get-Content $Path -ErrorAction SilentlyContinue
    $found = $false
    $newLines = foreach ($line in $lines) {
        if ($line -match "^${escapedName}=") {
            $found = $true
            "${Name}=${Value}"
        } else {
            $line
        }
    }

    if (-not $found) {
        if ($newLines) {
            $newLines += "${Name}=${Value}"
        } else {
            $newLines = @("${Name}=${Value}")
        }
    }

    Set-Content -Path $Path -Value $newLines -Encoding UTF8
}

function Ensure-EnvFileFromExample {
    param(
        [string]$Target,
        [string]$Example
    )

    if (Test-Path $Target) { return }

    if (Test-Path $Example) {
        Copy-Item $Example $Target
        Write-Ok "Created ${Target} from example"
    } else {
        $dir = Split-Path -Parent $Target
        if ($dir -and -not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        New-Item -ItemType File -Path $Target -Force | Out-Null
        Write-Ok "Created empty ${Target}"
    }
}

function Get-BackendSupabaseUrl {
    param([string]$ApiUrl)

    if ($ApiUrl -match '^https?://(127\.0\.0\.1|localhost)(:[0-9]+)?') {
        if ($ApiUrl -match '127\.0\.0\.1') {
            return $ApiUrl.Replace('127.0.0.1', 'host.docker.internal')
        }
        return $ApiUrl.Replace('localhost', 'host.docker.internal')
    }
    return $ApiUrl
}

function Get-SupabaseCliSource {
    if (Test-CommandAvailable "supabase") {
        $script:SupabaseCliSource = "supabase"
    } elseif (Test-CommandAvailable "npx") {
        $null = npx --yes supabase --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $script:SupabaseCliSource = "npx"
        } else {
            $script:SupabaseCliSource = ""
        }
    } else {
        $script:SupabaseCliSource = ""
    }
}

function Invoke-Supabase {
    [CmdletBinding()]
    param(
        [switch]$ShowProgress,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$CommandArgs
    )

    Get-SupabaseCliSource
    if (-not $script:SupabaseCliSource) {
        $script:LastSupabaseExitCode = 1
        return $false
    }

    if ($ShowProgress) {
        Write-Host ""
        Write-Hint "Streaming Docker / Supabase progress below (first run can take several minutes)..."
        Write-Host ""
    }

    if ($script:SupabaseCliSource -eq "supabase") {
        & supabase @CommandArgs
    } else {
        & npx --yes supabase @CommandArgs
    }
    $script:LastSupabaseExitCode = $LASTEXITCODE
    return ($script:LastSupabaseExitCode -eq 0)
}

function Get-SupabaseStatusVars {
    $script:ApiUrl = ""
    $script:AnonKey = ""
    $script:ServiceRoleKey = ""

    Get-SupabaseCliSource
    if (-not $script:SupabaseCliSource) { return $false }

    $tmp = New-TemporaryFile
    try {
        if ($script:SupabaseCliSource -eq "supabase") {
            & supabase status -o env *> $tmp.FullName
        } else {
            & npx --yes supabase status -o env *> $tmp.FullName
        }
        if ($LASTEXITCODE -ne 0) { return $false }

        foreach ($statusLine in Get-Content $tmp.FullName -ErrorAction SilentlyContinue) {
            if ($statusLine -notmatch '^([^=]+)=(.*)$') { continue }
            $key = $Matches[1]
            $value = $Matches[2].Trim().Trim('"').Trim("'")
            switch ($key) {
                "API_URL" { $script:ApiUrl = $value }
                "ANON_KEY" { $script:AnonKey = $value }
                "SERVICE_ROLE_KEY" { $script:ServiceRoleKey = $value }
            }
        }
    } finally {
        Remove-Item $tmp.FullName -Force -ErrorAction SilentlyContinue
    }

    return (
        -not [string]::IsNullOrWhiteSpace($script:ApiUrl) -and
        -not [string]::IsNullOrWhiteSpace($script:AnonKey) -and
        -not [string]::IsNullOrWhiteSpace($script:ServiceRoleKey)
    )
}

function Wait-ForSupabaseStatusVars {
    param([int]$Timeout = 0)

    if ($Timeout -le 0) {
        $Timeout = if ($script:DockerJustInstalled) { 180 } else { 90 }
    }

    $elapsed = 0
    $lastMessage = 0
    while ($elapsed -lt $Timeout) {
        if (Get-SupabaseStatusVars) { return $true }
        if (($elapsed - $lastMessage) -ge 15) {
            Write-Info "Still waiting for Supabase to become ready... (${elapsed}s elapsed, up to ${Timeout}s)"
            $lastMessage = $elapsed
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    Write-Fail "Supabase did not become ready within ${Timeout} seconds"
    Write-Hint "Check Docker is running, then try:  npx supabase start"
    Write-Hint "Or re-run this script - it is safe to run again."
    return $false
}

function Disable-SupabaseAnalyticsOnWindows {
    $config = Join-Path $RepoRoot "supabase\config.toml"
    if (-not (Test-Path $config)) { return }

    $lines = Get-Content $config
    $inAnalytics = $false
    $changed = $false
    $newLines = foreach ($line in $lines) {
        if ($line -match '^\[analytics\]') {
            $inAnalytics = $true
            $line
        } elseif ($line -match '^\[') {
            $inAnalytics = $false
            $line
        } elseif ($inAnalytics -and $line -match '^enabled\s*=\s*true') {
            $changed = $true
            'enabled = false'
        } else {
            $line
        }
    }

    if ($changed) {
        Set-Content -Path $config -Value $newLines -Encoding UTF8
        Write-Info "Disabled Supabase analytics for Windows local dev"
    }
}

function Get-LocalSupabaseEnv {
    Get-SupabaseCliSource
    if (-not $script:SupabaseCliSource) {
        Write-Warn "Supabase CLI not found (tried global supabase and npx supabase)."
        Write-Hint "Install Node.js/npm so the script can run: npx --yes supabase ..."
        return $false
    }

    Write-Info "Using Supabase CLI via: $($script:SupabaseCliSource)"

    $configPath = Join-Path $RepoRoot "supabase\config.toml"
    if (-not (Test-Path $configPath)) {
        Write-Info "Initializing local Supabase project..."
        $null = Invoke-Supabase -CommandArgs @('init', '--yes')
        if (-not (Test-Path $configPath)) {
            Write-Warn "Could not initialize Supabase project automatically."
            return $false
        }
        Write-Ok "Local Supabase project initialized"
    } else {
        Write-Ok "Local Supabase project already initialized"
    }

    Disable-SupabaseAnalyticsOnWindows

    if (Get-SupabaseStatusVars) {
        Write-Ok "Local Supabase is already running"
        return $true
    }

    Write-Info "Starting local Supabase stack (first run can take several minutes while images download)..."
    $null = Invoke-Supabase -ShowProgress -CommandArgs @('start')

    if (Wait-ForSupabaseStatusVars -Timeout 90) {
        if ($script:LastSupabaseExitCode -ne 0) {
            Write-Warn "Supabase start returned a non-zero exit code, but the local stack is running."
        }
        Write-Ok "Local Supabase stack started"
        return $true
    }

    Write-Warn "Could not start Supabase local stack automatically."
    return $false
}

function Test-IsLocalSupabaseUrl {
    param([string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) { return $false }
    return ($Url -match '127\.0\.0\.1|localhost|host\.docker\.internal')
}

function Test-NeedsFrontendEnvUpdate {
    param([string]$File)

    if (-not (Test-Path $File)) { return $true }
    $url = Read-EnvValue -File $File -Var "VITE_SUPABASE_URL"
    $key = Read-EnvValue -File $File -Var "VITE_SUPABASE_ANON_KEY"
    if ((Test-IsPlaceholder $url) -or (Test-IsPlaceholder $key)) { return $true }
    # Force rewrite if still pointing at a hosted Databasepad/Supabase project
    if (-not (Test-IsLocalSupabaseUrl $url)) { return $true }
    return $false
}

function Test-NeedsBackendEnvUpdate {
    param([string]$File)

    if (-not (Test-Path $File)) { return $true }
    $url = Read-EnvValue -File $File -Var "SUPABASE_URL"
    $anon = Read-EnvValue -File $File -Var "SUPABASE_ANON_KEY"
    $service = Read-EnvValue -File $File -Var "SUPABASE_SERVICE_ROLE_KEY"
    if (
        (Test-IsPlaceholder $url) -or
        (Test-IsPlaceholder $anon) -or
        (Test-IsPlaceholder $service)
    ) { return $true }
    if (-not (Test-IsLocalSupabaseUrl $url)) { return $true }
    return $false
}

function Ensure-LocalEnvFiles {
    param(
        [string]$FrontendEnv,
        [string]$BackendEnv
    )

    # Always prefer a running local Supabase stack over any existing hosted values.
    if (-not (Get-LocalSupabaseEnv)) {
        $needsFrontend = Test-NeedsFrontendEnvUpdate -File $FrontendEnv
        $needsBackend = Test-NeedsBackendEnvUpdate -File $BackendEnv
        if (-not $needsFrontend -and -not $needsBackend) {
            Write-Warn "Could not refresh local Supabase - keeping existing env files"
            return $true
        }
        Write-Fail "Local Supabase is required but could not be started"
        Write-Hint "Open Docker Desktop, then re-run this script."
        return $false
    }

    Set-EnvFileValue -Path $FrontendEnv -Name "VITE_SUPABASE_URL" -Value $script:ApiUrl
    Set-EnvFileValue -Path $FrontendEnv -Name "VITE_SUPABASE_ANON_KEY" -Value $script:AnonKey
    Write-Ok "Wrote local Supabase values to ${FrontendEnv}  ($($script:ApiUrl))"

    $backendUrl = Get-BackendSupabaseUrl -ApiUrl $script:ApiUrl
    Set-EnvFileValue -Path $BackendEnv -Name "SUPABASE_URL" -Value $backendUrl
    Set-EnvFileValue -Path $BackendEnv -Name "SUPABASE_ANON_KEY" -Value $script:AnonKey
    Set-EnvFileValue -Path $BackendEnv -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $script:ServiceRoleKey
    Write-Ok "Wrote local Supabase values to ${BackendEnv}  ($backendUrl)"
    if ($backendUrl -ne $script:ApiUrl) {
        Write-Info "Backend uses host.docker.internal so the API container can reach local Supabase"
    }

    return $true
}

function Test-EnvVar {
    param(
        [string]$File,
        [string]$Var,
        [string]$HintText
    )

    $value = Read-EnvValue -File $File -Var $Var
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Fail "${Var}  is missing"
        Write-Hint "Add this line to the file:  ${Var}=<${HintText}>"
        return $false
    }
    if (Test-IsPlaceholder $value) {
        Write-Fail "${Var}  is still a placeholder:  '${value}'"
        Write-Hint "Replace it with:  ${HintText}"
        return $false
    }
    Write-Ok $Var
    return $true
}

function Test-DockerDaemonRunning {
    $null = docker info 2>&1
    return ($LASTEXITCODE -eq 0)
}

function Wait-DockerDaemon {
    param([int]$Timeout = 0)

    if ($Timeout -le 0) {
        $Timeout = if ($script:DockerJustInstalled) { 600 } else { 180 }
    }

    $elapsed = 0
    $lastMessage = 0
    while ($elapsed -lt $Timeout) {
        if (Test-DockerDaemonRunning) { return $true }
        if (($elapsed - $lastMessage) -ge 15) {
            if ($script:DockerJustInstalled) {
                Write-Info "Waiting for Docker daemon (first launch)... ($($Timeout - $elapsed)s remaining)"
                Write-Hint "If Docker Desktop opened, accept any license/terms prompts - the script keeps waiting."
            } else {
                Write-Info "Waiting for Docker daemon... ($($Timeout - $elapsed)s remaining)"
            }
            $lastMessage = $elapsed
        }
        Start-Sleep -Seconds 3
        $elapsed += 3
    }
    return $false
}

function Get-DockerDesktopPath {
    $candidates = @(
        "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }
    return $null
}

function Start-DockerDesktop {
    $dockerDesktop = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    $dockerBackend = Get-Process -Name "com.docker.backend" -ErrorAction SilentlyContinue
    if ($dockerDesktop -or $dockerBackend) {
        Write-Info "Docker Desktop is already starting - waiting for daemon..."
        return $true
    }

    $path = Get-DockerDesktopPath
    if (-not $path) { return $false }

    Write-Info "Starting Docker Desktop..."
    Start-Process -FilePath $path
    return $true
}

function Test-PortInUse {
    param([int]$Port)

    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return [bool]$conn
    } catch {
        $matches = netstat -ano 2>$null | Select-String ":$Port\s"
        return [bool]$matches
    }
}

function Test-PortFree {
    param(
        [int]$Port,
        [string]$Service
    )

    $inUse = Test-PortInUse -Port $Port
    if ($inUse) {
        Write-Warn "Port ${Port} is still in use - stopping listener  (${Service})"
        Stop-PortListeners -Port $Port
        Start-Sleep -Seconds 1
        $inUse = Test-PortInUse -Port $Port
    }

    if ($inUse) {
        Write-Fail "Port ${Port} is still in use  (needed by ${Service})"
        Write-Hint "To see what's using it:  netstat -ano | findstr :${Port}"
    } else {
        Write-Ok "Port ${Port} is free  (${Service})"
    }
}

function Write-FailureExit {
    param([string]$Title, [string[]]$NextSteps)

    Write-Host ""
    Write-Host "  [!!]  $Title" -ForegroundColor Red
    Write-Host ""
    Write-Host "  What to do next:" -ForegroundColor White
    $i = 1
    foreach ($step in $NextSteps) {
        Write-Host "    $i. $step"
        $i++
    }
    Write-Host ""
    Write-Host "  You can re-run this script after fixing the issue - it will pick up where it left off."
    Write-Host ""
    exit 1
}
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

Write-Host ""
Write-Host "+===========================================+" -ForegroundColor Cyan
Write-Host "|   Singularity - Environment Startup       |" -ForegroundColor Cyan
Write-Host "+===========================================+" -ForegroundColor Cyan
Write-Host ""

Write-StartupIntro

Write-Step 1 7 "Prerequisites"
if (Test-NeedsPrerequisitesInstall) {
    Install-PrerequisitesWindows
} else {
    Write-SkippedPrerequisites
}
Ensure-ToolsReady

Write-Step 2 7 "Repository"
if (Test-NeedsRepositorySync) {
    Sync-DevelopBranch
} elseif (Test-Path ".git") {
    Write-Ok "Already on latest develop  ($(git rev-parse --short HEAD))"
} else {
    Write-Ok "Repository ready"
}

Write-Step 3 7 "Cleanup"
if (Test-NeedsCleanup) {
    Stop-ExistingEnvironment
} else {
    Write-Ok "No running instances found - skipping cleanup"
}

Write-Step 4 7 "Docker"

Ensure-ToolsReady
if (-not (Test-CommandAvailable "docker")) {
    Write-Info "Docker CLI not in PATH yet - waiting for it to become available..."
    $null = Wait-ForCommand -Name "docker" -TimeoutSeconds 300
}

if (-not (Test-CommandAvailable "docker")) {
    Write-FailureExit "Docker is not available after install" @(
        "Check that Docker Desktop finished installing"
        "Open Docker Desktop manually and wait until the engine is running"
        "Contact support if this persists - include the output above"
    )
}
Write-Ok "Docker found  ($(docker --version 2>&1))"

if (-not (Test-DockerDaemonRunning)) {
    Write-Warn "Docker daemon is not running"
    if (-not (Start-DockerDesktop)) {
        Initialize-ToolPaths
        $dockerPath = Get-DockerDesktopPath
        if ($dockerPath) { Start-Process -FilePath $dockerPath | Out-Null }
    }
    if (-not (Wait-DockerDaemon)) {
        Write-FailureExit "Docker did not start in time" @(
            "Open Docker Desktop and wait until it says the engine is running"
            "On first launch, accept any license/terms prompts"
            "Contact support if this persists - include the output above"
        )
    }
}
Write-Ok "Docker daemon is running"

$null = docker compose version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Ok "Docker Compose v2  ($(docker compose version 2>&1))"
    $ComposeCmd = "docker compose"
} elseif (Test-CommandAvailable "docker-compose") {
    Write-Warn "Using legacy docker-compose v1 - upgrade Docker Desktop to get Compose v2"
    $ComposeCmd = "docker-compose"
} else {
    Write-FailureExit "Docker Compose not found" @(
        "Docker Desktop may still be starting - wait until it is fully running"
        "Contact support if this persists - include the output above"
    )
}

Write-Step 5 7 "Environment variables"

$FrontendEnv = "frontend\.env"
$BackendEnv = "backend\.env"

if (-not (Test-CommandAvailable "node")) {
    Write-Fail "Node.js is not installed (required for local Supabase via npx)"
    Write-Hint "Install Node.js LTS: https://nodejs.org/"
} elseif (-not (Test-CommandAvailable "npm")) {
    Write-Fail "npm is not installed (required for local Supabase via npx)"
} else {
    Write-Ok "Node.js found  ($(node --version 2>&1))"
}

Ensure-EnvFileFromExample -Target $BackendEnv -Example "backend\.env.example"
if (-not (Ensure-LocalEnvFiles -FrontendEnv $FrontendEnv -BackendEnv $BackendEnv)) {
    Write-Fail "Could not configure local Supabase env files"
}

if (Test-Path $FrontendEnv) {
    Write-Ok "frontend\.env exists"
    $null = Test-EnvVar -File $FrontendEnv -Var "VITE_SUPABASE_URL" -HintText "local Supabase API URL (e.g. http://127.0.0.1:54321)"
    $null = Test-EnvVar -File $FrontendEnv -Var "VITE_SUPABASE_ANON_KEY" -HintText "anon key from: npx supabase status -o env"
} else {
    Write-Fail "frontend\.env  not found"
    Write-Hint "The script should create this automatically when Supabase local starts."
    Write-Hint "Ensure Node.js and Docker are installed, then re-run this script."
    $script:ErrorCount += 2
}

if (Test-Path $BackendEnv) {
    Write-Ok "backend\.env exists"
    $null = Test-EnvVar -File $BackendEnv -Var "SUPABASE_URL" -HintText "local Supabase URL via host.docker.internal (e.g. http://host.docker.internal:54321)"
    $null = Test-EnvVar -File $BackendEnv -Var "SUPABASE_ANON_KEY" -HintText "anon key from: npx supabase status -o env"
    $null = Test-EnvVar -File $BackendEnv -Var "SUPABASE_SERVICE_ROLE_KEY" -HintText "service_role key from: npx supabase status -o env"
} else {
    Write-Fail "backend\.env  not found"
    Write-Hint "The script should create this automatically from backend\.env.example."
    $script:ErrorCount += 3
}

Write-Step 6 7 "Port availability"

Test-PortFree -Port 8080 -Service "frontend"
Test-PortFree -Port 8000 -Service "backend API"

Write-Step 7 7 "Starting application"

if ($script:ErrorCount -gt 0) {
    Write-FailureExit "Found $($script:ErrorCount) issue(s) during setup" @(
        "Read the [!!] messages above - each one explains what failed"
        "Fix the issue (often Docker not running, or a missing tool)"
        "Re-run:  .\start.ps1"
    )
}

if (Test-Path $FrontendEnv) {
    Get-Content $FrontendEnv | ForEach-Object {
        $line = $_.Trim()
        if ($line -and $line -notmatch '^#' -and $line -match '^([^=]+)=(.*)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "env:$key" -Value $val
        }
    }
}

Write-Info "Building images and starting containers..."
Write-Info "Docker will show download/build progress below. First run may take 5-10 minutes."
Write-Info "If this step looks idle, it is usually still downloading in the background."
Write-Host ""

Invoke-Expression "$ComposeCmd up --build -d"

if ($LASTEXITCODE -ne 0) {
    Write-FailureExit "docker compose failed to start the app" @(
        "Check Docker has enough memory: Docker Desktop -> Settings -> Resources"
        "Stop any old run:  $ComposeCmd down"
        "See full logs:  $ComposeCmd logs"
        "Re-run:  .\start.ps1"
    )
}

Write-Host ""
Write-Host "  [OK]  All services are up!"
Write-Host ""
Write-Host "  URLs"
Write-Host "  Frontend   ->  http://localhost:8080"
Write-Host "  Backend    ->  http://localhost:8000"
Write-Host "  API docs   ->  http://localhost:8000/docs"
Write-Host ""
Write-Host "  Useful commands"
Write-Host "  $ComposeCmd logs -f              # stream all logs"
Write-Host "  $ComposeCmd logs -f backend      # backend logs only"
Write-Host "  $ComposeCmd logs -f frontend     # frontend logs only"
Write-Host "  $ComposeCmd down                 # stop all containers"
Write-Host "  $ComposeCmd build --no-cache     # force a clean rebuild"
Write-Host ""
