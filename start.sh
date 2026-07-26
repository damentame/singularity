#!/usr/bin/env bash
# Bootstraps prerequisites, syncs develop, and starts Singularity via Docker Compose.
# Works on macOS and Linux. Run from any directory (including a fresh machine).

set -uo pipefail

if [ -t 1 ]; then
    RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m'
    CYAN='\033[0;36m' BOLD='\033[1m' RESET='\033[0m'
else
    RED='' GREEN='' YELLOW='' CYAN='' BOLD='' RESET=''
fi

ERRORS=0
SUPABASE_CLI_SOURCE=""
LAST_SUPABASE_EXIT_CODE=0
DOCKER_JUST_INSTALLED=0

ok()     { printf "${GREEN}  [OK]  %s${RESET}\n" "$1"; }
fail()   { printf "${RED}  [!!]  %s${RESET}\n" "$1"; ERRORS=$((ERRORS + 1)); }
warn()   { printf "${YELLOW}  [>>]  %s${RESET}\n" "$1"; }
info()   { printf "${CYAN}  [->]  %s${RESET}\n" "$1"; }
hint()   { printf "          %s\n" "$1"; }
header() { printf "\n${BOLD}%s${RESET}\n" "$1"; }
step()   { header "Step $1/$2: $3"; }

startup_intro() {
    printf "  This script sets up everything and starts Singularity in one run.\n"
    printf "  First run may take 15-30 minutes (downloads tools, images, and code).\n"
    printf "  Later runs are usually much faster.\n\n"
    printf "  Status legend:  [OK] done   [->] working   [>>] note   [!!] problem\n\n"
}

failure_exit() {
    local title="$1"
    shift
    local i=1 step_text
    printf "\n  [!!]  %s\n\n" "$title"
    printf "  What to do next:\n"
    for step_text in "$@"; do
        printf "    %d. %s\n" "$i" "$step_text"
        i=$((i + 1))
    done
    printf "\n  You can re-run this script after fixing the issue - it will pick up where it left off.\n\n"
    exit 1
}

DEFAULT_REPO_URL="${DEFAULT_REPO_URL:-https://github.com/damentame/singularity.git}"

refresh_path() {
    if [[ "$(uname)" == "Darwin" ]]; then
        if [[ -x /opt/homebrew/bin/brew ]]; then
            # shellcheck disable=SC1091
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -x /usr/local/bin/brew ]]; then
            # shellcheck disable=SC1091
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        export PATH="/Applications/Docker.app/Contents/Resources/bin:/usr/local/bin:/opt/homebrew/bin:${PATH}"
    fi
}

initialize_tool_paths() {
    refresh_path
}

wait_for_command() {
    local name="$1" timeout="${2:-300}" elapsed=0 last_message=0
    while (( elapsed < timeout )); do
        initialize_tool_paths
        command -v "$name" &>/dev/null && return 0
        if (( elapsed - last_message >= 15 )); then
            info "Waiting for ${name} to become available after install... ($((timeout - elapsed))s remaining)"
            last_message=$elapsed
        fi
        sleep 3
        elapsed=$((elapsed + 3))
    done
    return 1
}

ensure_tools_ready() {
    local tool
    initialize_tool_paths
    for tool in git node docker; do
        command -v "$tool" &>/dev/null || wait_for_command "$tool" 300 || true
    done
}

needs_prerequisites_install() {
    command -v git &>/dev/null || return 0
    command -v node &>/dev/null || return 0
    command -v docker &>/dev/null || return 0
    return 1
}

ensure_homebrew() {
    if command -v brew &>/dev/null; then
        ok "Homebrew found"
        return 0
    fi

    if [[ "$(uname)" != "Darwin" ]]; then
        warn "Homebrew is only auto-installed on macOS"
        return 1
    fi

    info "Installing Homebrew..."
    hint "This may take 5-10 minutes. Your Mac may ask for your password."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || return 1
    refresh_path
    command -v brew &>/dev/null
}

ensure_brew_package() {
    local cmd="$1" formula="$2"
    refresh_path
    if command -v "$cmd" &>/dev/null; then
        return 0
    fi
    ensure_homebrew || return 1
    info "Installing ${formula} (may take a few minutes)..."
    brew install "$formula"
    refresh_path
    command -v "$cmd" &>/dev/null
}

ensure_docker_mac() {
    refresh_path
    if command -v docker &>/dev/null; then
        return 0
    fi
    ensure_homebrew || return 1
    DOCKER_JUST_INSTALLED=1
    info "Installing Docker Desktop (may take several minutes)..."
    hint "Docker Desktop will open after install - accept the license if prompted."
    brew install --cask docker
    refresh_path
    if [[ "$(uname)" == "Darwin" && -d "/Applications/Docker.app" ]]; then
        info "Opening Docker Desktop for first-time setup..."
        open -a Docker 2>/dev/null || true
    fi
    wait_for_command docker 300
}

install_prerequisites_unix() {
    if [[ "$(uname)" == "Darwin" ]]; then
        info "Detected OS: macOS"
        info "Checking for Git, Node.js, and Docker - installing anything that is missing."
        ensure_brew_package git git && ok "Git found  ($(git --version 2>&1 | head -1))" || fail "Git is required but could not be installed automatically"
        ensure_brew_package node node && ok "Node.js found  ($(node --version 2>&1))" || fail "Node.js is required but could not be installed automatically"
        ensure_docker_mac && ok "Docker CLI found  ($(docker --version 2>&1 | head -1))" || fail "Docker is required but could not be installed automatically"
        ensure_tools_ready
        return 0
    fi

    info "Detected OS: Linux"
    if command -v apt-get &>/dev/null; then
        info "Installing packages via apt..."
        sudo apt-get update -y
        sudo apt-get install -y git curl ca-certificates
        command -v node &>/dev/null || sudo apt-get install -y nodejs npm
        command -v docker &>/dev/null || sudo apt-get install -y docker.io docker-compose-plugin
    elif command -v dnf &>/dev/null; then
        info "Installing packages via dnf..."
        sudo dnf install -y git curl ca-certificates nodejs npm docker docker-compose-plugin
    else
        warn "Unsupported Linux package manager - install git, node, and docker manually"
    fi

    command -v git &>/dev/null && ok "Git found  ($(git --version 2>&1 | head -1))" || fail "Git is required"
    command -v node &>/dev/null && ok "Node.js found  ($(node --version 2>&1))" || fail "Node.js is required"
    command -v docker &>/dev/null && ok "Docker CLI found  ($(docker --version 2>&1 | head -1))" || fail "Docker is required"
    ensure_tools_ready
}

skipped_prerequisites() {
    ok "Git, Node.js, and Docker already installed - skipping"
    ok "Git found  ($(git --version 2>&1 | head -1))"
    ok "Node.js found  ($(node --version 2>&1))"
    ok "Docker CLI found  ($(docker --version 2>&1 | head -1))"
}

needs_repository_sync() {
    command -v git &>/dev/null || return 0
    [[ -d .git ]] || return 0
    [[ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" == "develop" ]] || return 0
    git rev-parse origin/develop &>/dev/null || return 0
    (( $(git rev-list --count HEAD..origin/develop 2>/dev/null || echo 1) > 0 )) && return 0
    return 1
}

sync_develop_branch() {
    local repo_url="${1:-$DEFAULT_REPO_URL}"

    command -v git &>/dev/null || { fail "Git is not available - cannot sync repository"; return 1; }

    if [[ ! -d .git ]]; then
        info "No git repository here - cloning ${repo_url}..."
        hint "Downloading the project from GitHub - this may take a minute."
        if [[ -n "$(find . -mindepth 1 -maxdepth 1 ! -name 'start.sh' ! -name 'start.ps1' 2>/dev/null)" ]]; then
            warn "Directory is not empty and not a git repo."
            hint "Clone manually: git clone ${repo_url}"
            fail "Cannot auto-clone into a non-empty folder"
            return 1
        fi
        git clone --branch develop "$repo_url" . || {
            fail "git clone failed"
            hint "Check your internet connection and that you can access GitHub."
            hint "Try manually:  git clone --branch develop ${repo_url} ."
            return 1
        }
        ok "Repository cloned to develop"
        return 0
    fi

    info "Fetching latest code from origin..."
    hint "Downloading updates from GitHub - this is usually quick."
    git fetch origin || { fail "git fetch failed"; return 1; }

    git checkout develop 2>/dev/null || git checkout -B develop origin/develop || { fail "Could not checkout develop branch"; return 1; }

    if ! git pull --ff-only origin develop; then
        if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
            warn "Local changes blocked fast-forward - stashing, pulling, then restoring"
            git stash push -m "singularity-start-autostash" || true
            git pull --ff-only origin develop || git reset --hard origin/develop
            git stash pop 2>/dev/null || true
        else
            warn "Fast-forward pull failed - resetting to origin/develop"
            git reset --hard origin/develop || { fail "Could not reset to origin/develop"; return 1; }
        fi
    fi

    ok "On latest develop  ($(git rev-parse --short HEAD))"
}

stop_port_listeners() {
    local port="$1"
    if command -v lsof &>/dev/null; then
        local pids
        pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
        if [[ -n "$pids" ]]; then
            info "Stopping process(es) on port ${port}"
            # shellcheck disable=SC2086
            kill -9 $pids 2>/dev/null || true
        fi
    elif command -v fuser &>/dev/null; then
        fuser -k "${port}/tcp" 2>/dev/null || true
    fi
}

needs_cleanup() {
    local port
    for port in 8080 8000; do
        if command -v lsof &>/dev/null; then
            lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null 2>&1 && return 0
        elif command -v ss &>/dev/null; then
            ss -tln | grep -q ":${port} " && return 0
        elif command -v netstat &>/dev/null; then
            netstat -an 2>/dev/null | grep -qE "[.:]${port}[[:space:]]" && return 0
        fi
    done

    if command -v docker &>/dev/null && [[ -f docker-compose.yml ]] && docker info &>/dev/null 2>&1; then
        [[ -n "$(docker compose ps -q 2>/dev/null || true)" ]] && return 0
    fi

    return 1
}

stop_existing_environment() {
    info "Stopping existing Singularity containers..."
    if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
        if [[ -f docker-compose.yml ]]; then
            docker compose down --remove-orphans 2>/dev/null || true
        fi
        if command -v supabase &>/dev/null; then
            supabase stop 2>/dev/null || true
        elif command -v npx &>/dev/null; then
            npx --yes supabase stop 2>/dev/null || true
        fi
    fi

    local port
    for port in 8080 8000 54321 54322 54323 54324; do
        stop_port_listeners "$port"
    done

    ok "Cleanup complete"
}

is_placeholder() {
    local value="$1"
    [[ -z "$value" || "$value" == *'<'*'>'* || "$value" == your-* || "$value" == your_* ]]
}

read_env_value() {
    local file="$1" var="$2"
    local line value
    line="$(grep -E "^${var}=" "$file" 2>/dev/null | head -1 || true)"
    [[ -z "$line" ]] && return 1
    value="${line#*=}"
    value="${value%\"}" ; value="${value#\"}"
    value="${value%\'}" ; value="${value#\'}"
    printf '%s' "$value"
}

sed_inplace() {
    local expression="$1" file="$2"
    if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "$expression" "$file"
    else
        sed -i "$expression" "$file"
    fi
}

set_env_file_value() {
    local path="$1" name="$2" value="$3"
    local dir
    dir="$(dirname "$path")"
    mkdir -p "$dir"
    touch "$path"

    if grep -qE "^${name}=" "$path"; then
        sed_inplace "s|^${name}=.*|${name}=${value}|" "$path"
    else
        printf '%s=%s\n' "$name" "$value" >>"$path"
    fi
}

ensure_env_file_from_example() {
    local target="$1" example="$2"
    [[ -f "$target" ]] && return 0
    if [[ -f "$example" ]]; then
        cp "$example" "$target"
        ok "Created ${target} from example"
    else
        mkdir -p "$(dirname "$target")"
        : >"$target"
        ok "Created empty ${target}"
    fi
}

get_backend_supabase_url() {
    local api_url="$1"
    if [[ "$api_url" == *127.0.0.1* ]]; then
        printf '%s' "${api_url/127.0.0.1/host.docker.internal}"
        return
    fi
    if [[ "$api_url" == *localhost* ]]; then
        printf '%s' "${api_url/localhost/host.docker.internal}"
        return
    fi
    printf '%s' "$api_url"
}

get_supabase_cli_source() {
    if command -v supabase &>/dev/null; then
        SUPABASE_CLI_SOURCE="supabase"
    elif npx --yes supabase --version &>/dev/null; then
        SUPABASE_CLI_SOURCE="npx"
    else
        SUPABASE_CLI_SOURCE=""
    fi
}

invoke_supabase() {
    local show_progress=false
    local -a args=()
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --show-progress) show_progress=true; shift ;;
            *) args+=("$1"); shift ;;
        esac
    done

    get_supabase_cli_source
    if [[ -z "$SUPABASE_CLI_SOURCE" ]]; then
        LAST_SUPABASE_EXIT_CODE=1
        return 1
    fi

    if $show_progress; then
        printf '\n'
        hint "Streaming Docker / Supabase progress below (first run can take several minutes)..."
        printf '\n'
        if [[ "$SUPABASE_CLI_SOURCE" == "supabase" ]]; then
            supabase "${args[@]}"
        else
            npx --yes supabase "${args[@]}"
        fi
        LAST_SUPABASE_EXIT_CODE=$?
        return $LAST_SUPABASE_EXIT_CODE
    fi

    if [[ "$SUPABASE_CLI_SOURCE" == "supabase" ]]; then
        supabase "${args[@]}"
    else
        npx --yes supabase "${args[@]}"
    fi
    LAST_SUPABASE_EXIT_CODE=$?
    return $LAST_SUPABASE_EXIT_CODE
}

get_supabase_status_vars() {
    local tmp status_line key value
    tmp="$(mktemp)"
    if ! invoke_supabase status -o env >"$tmp" 2>/dev/null; then
        rm -f "$tmp"
        return 1
    fi

    API_URL="" ANON_KEY="" SERVICE_ROLE_KEY=""
    while IFS= read -r status_line || [[ -n "$status_line" ]]; do
        [[ "$status_line" =~ ^([^=]+)=(.*)$ ]] || continue
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        value="${value%\"}" ; value="${value#\"}"
        value="${value%\'}" ; value="${value#\'}"
        case "$key" in
            API_URL) API_URL="$value" ;;
            ANON_KEY) ANON_KEY="$value" ;;
            SERVICE_ROLE_KEY) SERVICE_ROLE_KEY="$value" ;;
        esac
    done <"$tmp"
    rm -f "$tmp"

    [[ -n "$API_URL" && -n "$ANON_KEY" && -n "$SERVICE_ROLE_KEY" ]]
}

wait_for_supabase_status_vars() {
    local timeout="${1:-0}" elapsed=0 last_message=0
    if (( timeout <= 0 )); then
        if (( DOCKER_JUST_INSTALLED )); then
            timeout=180
        else
            timeout=90
        fi
    fi
    while (( elapsed < timeout )); do
        if get_supabase_status_vars; then
            return 0
        fi
        if (( elapsed - last_message >= 15 )); then
            info "Still waiting for Supabase to become ready... (${elapsed}s elapsed, up to ${timeout}s)"
            last_message=$elapsed
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    fail "Supabase did not become ready within ${timeout} seconds"
    hint "Check Docker is running, then try:  npx supabase start"
    hint "Or re-run this script - it is safe to run again."
    return 1
}

disable_supabase_analytics_on_windows() {
    local config="supabase/config.toml"
    [[ "$(uname)" != "MINGW"* && "$OSTYPE" != *msys* && "$OSTYPE" != *cygwin* ]] && return 0
    [[ ! -f "$config" ]] && return 0
    if grep -qE '^\[analytics\]' "$config" && grep -A1 '^\[analytics\]' "$config" | grep -q 'enabled = true'; then
        sed_inplace 's/^enabled = true$/enabled = false/' "$config"
        info "Disabled Supabase analytics for Windows local dev"
    fi
}

get_local_supabase_env() {
    get_supabase_cli_source
    if [[ -z "$SUPABASE_CLI_SOURCE" ]]; then
        warn "Supabase CLI not found (tried global supabase and npx supabase)."
        hint "Install Node.js/npm so the script can run: npx --yes supabase ..."
        return 1
    fi

    info "Using Supabase CLI via: ${SUPABASE_CLI_SOURCE}"

    if [[ ! -f "supabase/config.toml" ]]; then
        info "Initializing local Supabase project..."
        invoke_supabase init --yes || true
        if [[ ! -f "supabase/config.toml" ]]; then
            warn "Could not initialize Supabase project automatically."
            return 1
        fi
        ok "Local Supabase project initialized"
    else
        ok "Local Supabase project already initialized"
    fi

    disable_supabase_analytics_on_windows

    if get_supabase_status_vars; then
        ok "Local Supabase is already running"
        return 0
    fi

    info "Starting local Supabase stack (first run can take several minutes while images download)..."
    invoke_supabase --show-progress start || true

    if wait_for_supabase_status_vars 90; then
        if (( LAST_SUPABASE_EXIT_CODE != 0 )); then
            warn "Supabase start returned a non-zero exit code, but the local stack is running."
        fi
        ok "Local Supabase stack started"
        return 0
    fi

    warn "Could not start Supabase local stack automatically."
    return 1
}

is_local_supabase_url() {
    local url="$1"
    [[ -n "$url" && ( "$url" == *127.0.0.1* || "$url" == *localhost* || "$url" == *host.docker.internal* ) ]]
}

needs_frontend_env_update() {
    local file="$1" url key
    [[ ! -f "$file" ]] && return 0
    url="$(read_env_value "$file" "VITE_SUPABASE_URL" || true)"
    key="$(read_env_value "$file" "VITE_SUPABASE_ANON_KEY" || true)"
    is_placeholder "$url" && return 0
    is_placeholder "$key" && return 0
    is_local_supabase_url "$url" && return 1
    return 0
}

needs_backend_env_update() {
    local file="$1" url anon service
    [[ ! -f "$file" ]] && return 0
    url="$(read_env_value "$file" "SUPABASE_URL" || true)"
    anon="$(read_env_value "$file" "SUPABASE_ANON_KEY" || true)"
    service="$(read_env_value "$file" "SUPABASE_SERVICE_ROLE_KEY" || true)"
    is_placeholder "$url" && return 0
    is_placeholder "$anon" && return 0
    is_placeholder "$service" && return 0
    is_local_supabase_url "$url" && return 1
    return 0
}

ensure_local_env_files() {
    local frontend_env="$1" backend_env="$2"
    local backend_url

    # Always prefer a running local Supabase stack over any existing hosted values.
    if ! get_local_supabase_env; then
        if ! needs_frontend_env_update "$frontend_env" && ! needs_backend_env_update "$backend_env"; then
            warn "Could not refresh local Supabase - keeping existing env files"
            return 0
        fi
        fail "Local Supabase is required but could not be started"
        hint "Open Docker Desktop, then re-run this script."
        return 1
    fi

    set_env_file_value "$frontend_env" "VITE_SUPABASE_URL" "$API_URL"
    set_env_file_value "$frontend_env" "VITE_SUPABASE_ANON_KEY" "$ANON_KEY"
    ok "Wrote local Supabase values to ${frontend_env}  (${API_URL})"

    backend_url="$(get_backend_supabase_url "$API_URL")"
    set_env_file_value "$backend_env" "SUPABASE_URL" "$backend_url"
    set_env_file_value "$backend_env" "SUPABASE_ANON_KEY" "$ANON_KEY"
    set_env_file_value "$backend_env" "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE_ROLE_KEY"
    ok "Wrote local Supabase values to ${backend_env}  (${backend_url})"
    if [[ "$backend_url" != "$API_URL" ]]; then
        info "Backend uses host.docker.internal so the API container can reach local Supabase"
    fi
}

check_var() {
    local file="$1" var="$2" hint_text="$3" value
    value="$(read_env_value "$file" "$var" || true)"
    if [[ -z "$value" ]]; then
        fail "${var}  is missing"
        hint "Add this line to the file:  ${var}=<${hint_text}>"
        return 1
    fi
    if is_placeholder "$value"; then
        fail "${var}  is still a placeholder:  '${value}'"
        hint "Replace it with:  ${hint_text}"
        return 1
    fi
    ok "$var"
}

docker_daemon_running() {
    docker info &>/dev/null 2>&1
}

wait_for_docker_daemon() {
    local timeout="${1:-0}" elapsed=0 last_message=0
    if (( timeout <= 0 )); then
        if (( DOCKER_JUST_INSTALLED )); then
            timeout=600
        else
            timeout=180
        fi
    fi
    while (( elapsed < timeout )); do
        if docker_daemon_running; then
            return 0
        fi
        if (( elapsed - last_message >= 15 )); then
            if (( DOCKER_JUST_INSTALLED )); then
                info "Waiting for Docker daemon (first launch)... ($((timeout - elapsed)) s remaining)"
                hint "If Docker Desktop opened, accept any license/terms prompts - the script keeps waiting."
            else
                info "Waiting for Docker daemon... ($((timeout - elapsed)) s remaining)"
            fi
            last_message=$elapsed
        fi
        sleep 3
        elapsed=$((elapsed + 3))
    done
    return 1
}

start_docker_desktop() {
    if [[ "$(uname)" == "Darwin" && -d "/Applications/Docker.app" ]]; then
        if pgrep -f "Docker Desktop" &>/dev/null || pgrep -f "com.docker" &>/dev/null; then
            info "Docker Desktop is already starting - waiting for daemon..."
        else
            info "Starting Docker Desktop..."
            open -a Docker
        fi
        return 0
    fi

    if command -v systemctl &>/dev/null && systemctl list-unit-files docker.service &>/dev/null 2>&1; then
        info "Starting Docker service..."
        sudo systemctl start docker || true
        return 0
    fi

    return 1
}

check_port() {
    local port="$1" service="$2" in_use=false
    if command -v lsof &>/dev/null; then
        lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null 2>&1 && in_use=true
    elif command -v ss &>/dev/null; then
        ss -tln | grep -q ":${port} " && in_use=true
    elif command -v netstat &>/dev/null; then
        netstat -an 2>/dev/null | grep -qE "[.:]${port}[[:space:]]" && in_use=true
    fi

    if $in_use; then
        warn "Port ${port} is still in use - stopping listener  (${service})"
        stop_port_listeners "$port"
        sleep 1
        in_use=false
        if command -v lsof &>/dev/null; then
            lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null 2>&1 && in_use=true
        elif command -v ss &>/dev/null; then
            ss -tln | grep -q ":${port} " && in_use=true
        elif command -v netstat &>/dev/null; then
            netstat -an 2>/dev/null | grep -qE "[.:]${port}[[:space:]]" && in_use=true
        fi
    fi

    if $in_use; then
        fail "Port ${port} is still in use  (needed by ${service})"
        command -v lsof &>/dev/null && hint "To see what's using it:  lsof -i :${port}"
    else
        ok "Port ${port} is free  (${service})"
    fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

printf "\n${CYAN}+===========================================+${RESET}\n"
printf "${CYAN}|   Singularity - Environment Startup       |${RESET}\n"
printf "${CYAN}+===========================================+${RESET}\n\n"

startup_intro

step 1 7 "Prerequisites"
if needs_prerequisites_install; then
    install_prerequisites_unix
else
    skipped_prerequisites
fi
ensure_tools_ready

step 2 7 "Repository"
if needs_repository_sync; then
    sync_develop_branch
elif [[ -d .git ]]; then
    ok "Already on latest develop  ($(git rev-parse --short HEAD))"
else
    ok "Repository ready"
fi

step 3 7 "Cleanup"
if needs_cleanup; then
    stop_existing_environment
else
    ok "No running instances found - skipping cleanup"
fi

step 4 7 "Docker"

ensure_tools_ready
if ! command -v docker &>/dev/null; then
    info "Docker CLI not in PATH yet - waiting for it to become available..."
    wait_for_command docker 300 || true
fi

if ! command -v docker &>/dev/null; then
    failure_exit "Docker is not available after install" \
        "Check that Docker Desktop finished installing" \
        "Open Docker Desktop and wait until the engine is running" \
        "Contact support if this persists - include the output above"
fi
ok "Docker found  ($(docker --version 2>&1 | head -1))"

if ! docker_daemon_running; then
    warn "Docker daemon is not running"
    start_docker_desktop || open -a Docker 2>/dev/null || true
    if ! wait_for_docker_daemon; then
        failure_exit "Docker did not start in time" \
            "Open Docker Desktop and wait until it says the engine is running" \
            "On first launch, accept any license/terms prompts" \
            "Contact support if this persists - include the output above"
    fi
fi
ok "Docker daemon is running"

if docker compose version &>/dev/null 2>&1; then
    ok "Docker Compose v2  ($(docker compose version 2>&1 | head -1))"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    warn "Using legacy docker-compose v1 - upgrade Docker Desktop to get Compose v2"
    COMPOSE_CMD="docker-compose"
else
    failure_exit "Docker Compose not found" \
        "Docker Desktop may still be starting - wait until it is fully running" \
        "Contact support if this persists - include the output above"
fi

step 5 7 "Environment variables"

FRONTEND_ENV="frontend/.env"
BACKEND_ENV="backend/.env"

if ! command -v node &>/dev/null; then
    fail "Node.js is not installed (required for local Supabase via npx)"
    hint "Install Node.js LTS: https://nodejs.org/"
elif ! command -v npm &>/dev/null; then
    fail "npm is not installed (required for local Supabase via npx)"
else
    ok "Node.js found  ($(node --version 2>&1))"
fi

ensure_env_file_from_example "$BACKEND_ENV" "backend/.env.example"
if ! ensure_local_env_files "$FRONTEND_ENV" "$BACKEND_ENV"; then
    fail "Could not configure local Supabase env files"
fi

if [[ -f "$FRONTEND_ENV" ]]; then
    ok "frontend/.env exists"
    check_var "$FRONTEND_ENV" "VITE_SUPABASE_URL" "local Supabase API URL (e.g. http://127.0.0.1:54321)" || true
    check_var "$FRONTEND_ENV" "VITE_SUPABASE_ANON_KEY" "anon key from: npx supabase status -o env" || true
else
    fail "frontend/.env  not found"
    hint "The script should create this automatically when Supabase local starts."
    hint "Ensure Node.js and Docker are installed, then re-run this script."
    ERRORS=$((ERRORS + 2))
fi

if [[ -f "$BACKEND_ENV" ]]; then
    ok "backend/.env exists"
    check_var "$BACKEND_ENV" "SUPABASE_URL" "local Supabase URL via host.docker.internal (e.g. http://host.docker.internal:54321)" || true
    check_var "$BACKEND_ENV" "SUPABASE_ANON_KEY" "anon key from: npx supabase status -o env" || true
    check_var "$BACKEND_ENV" "SUPABASE_SERVICE_ROLE_KEY" "service_role key from: npx supabase status -o env" || true
else
    fail "backend/.env  not found"
    hint "The script should create this automatically from backend/.env.example."
    ERRORS=$((ERRORS + 3))
fi

step 6 7 "Port availability"

check_port 8080 "frontend"
check_port 8000 "backend API"

step 7 7 "Starting application"

if (( ERRORS > 0 )); then
    failure_exit "Found ${ERRORS} issue(s) during setup" \
        "Read the [!!] messages above - each one explains what failed" \
        "Fix the issue (often Docker not running, or a missing tool)" \
        "Re-run:  ./start.sh"
fi

set -a
# shellcheck disable=SC1090
source "$FRONTEND_ENV"
set +a

info "Building images and starting containers..."
info "Docker will show download/build progress below. First run may take 5-10 minutes."
info "If this step looks idle, it is usually still downloading in the background."
printf '\n'

if ! $COMPOSE_CMD up --build -d; then
    failure_exit "docker compose failed to start the app" \
        "Check Docker has enough memory: Docker Desktop -> Settings -> Resources" \
        "Stop any old run:  ${COMPOSE_CMD} down" \
        "See full logs:  ${COMPOSE_CMD} logs" \
        "Re-run:  ./start.sh"
fi

printf "\n  [OK]  All services are up!\n\n"
printf "  URLs\n"
printf "  Frontend   ->  http://localhost:8080\n"
printf "  Backend    ->  http://localhost:8000\n"
printf "  API docs   ->  http://localhost:8000/docs\n\n"
printf "  Useful commands\n"
printf "  ${COMPOSE_CMD} logs -f              # stream all logs\n"
printf "  ${COMPOSE_CMD} logs -f backend      # backend logs only\n"
printf "  ${COMPOSE_CMD} logs -f frontend     # frontend logs only\n"
printf "  ${COMPOSE_CMD} down                 # stop all containers\n"
printf "  ${COMPOSE_CMD} build --no-cache     # force a clean rebuild\n\n"
