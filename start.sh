#!/usr/bin/env bash
# Starts the full Singularity environment via Docker Compose.
# Works on macOS and Linux. Run from any directory — the script finds the repo root.

set -uo pipefail

# ── Colour helpers (disabled when not writing to a terminal) ──────────────────
if [ -t 1 ]; then
    RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m'
    CYAN='\033[0;36m' BOLD='\033[1m' RESET='\033[0m'
else
    RED='' GREEN='' YELLOW='' CYAN='' BOLD='' RESET=''
fi

ok()     { printf "${GREEN}  ✓${RESET}  %s\n"  "$1"; }
fail()   { printf "${RED}  ✗${RESET}  %s\n"  "$1"; ERRORS=$((ERRORS + 1)); }
warn()   { printf "${YELLOW}  ⚠${RESET}  %s\n"  "$1"; }
info()   { printf "${CYAN}  →${RESET}  %s\n"  "$1"; }
hint()   { printf "        %s\n" "$1"; }
header() { printf "\n${BOLD}%s${RESET}\n" "$1"; }

ERRORS=0

# Always run from the repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

printf "\n${BOLD}${CYAN}"
printf "╔═══════════════════════════════════════════╗\n"
printf "║   Singularity — Environment Startup       ║\n"
printf "╚═══════════════════════════════════════════╝\n"
printf "${RESET}\n"

# ── 1. Docker ─────────────────────────────────────────────────────────────────
header "1. Docker"

if ! command -v docker &>/dev/null; then
    fail "Docker is not installed"
    hint "Download Docker Desktop: https://www.docker.com/products/docker-desktop/"
    printf "\n${RED}${BOLD}Cannot continue without Docker.${RESET}\n\n"
    exit 1
fi
ok "Docker found  ($(docker --version 2>&1 | head -1))"

if ! docker info &>/dev/null 2>&1; then
    fail "Docker daemon is not running"
    hint "Open Docker Desktop and wait for it to finish starting, then re-run this script."
    printf "\n${RED}${BOLD}Cannot continue — Docker is not running.${RESET}\n\n"
    exit 1
fi
ok "Docker daemon is running"

if docker compose version &>/dev/null 2>&1; then
    ok "Docker Compose v2 ($(docker compose version 2>&1))"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    warn "Using legacy docker-compose v1 — upgrade Docker Desktop to get Compose v2"
    COMPOSE_CMD="docker-compose"
else
    fail "Docker Compose not found"
    hint "Re-install Docker Desktop — Compose is bundled with it."
    printf "\n${RED}${BOLD}Cannot continue without Docker Compose.${RESET}\n\n"
    exit 1
fi

# ── 2. Git branch ─────────────────────────────────────────────────────────────
header "2. Git branch"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" = "develop" ]; then
    ok "On branch: develop"
else
    warn "Current branch is '${CURRENT_BRANCH}', not 'develop'"
    hint "Switch with:  git checkout develop  (then re-run this script)"
    hint "Continuing on '${CURRENT_BRANCH}' anyway…"
fi

# ── 3. Environment files ──────────────────────────────────────────────────────
header "3. Environment variables"

# Checks that a variable is present in a file and not a placeholder value.
# Usage: check_var <file> <VAR_NAME> <human-readable hint>
check_var() {
    local file="$1" var="$2" hint="$3"

    if ! grep -qE "^${var}[[:space:]]*=" "$file" 2>/dev/null; then
        fail "${var}  missing from  ${file}"
        hint "Add this line:  ${var}=<${hint}>"
        return 1
    fi

    local value
    value="$(grep -E "^${var}[[:space:]]*=" "$file" | head -1 | sed 's/^[^=]*=//')"
    # Trim surrounding quotes if present
    value="${value%\"}" ; value="${value#\"}" ; value="${value%\'}" ; value="${value#\'}"

    if [[ -z "$value" || "$value" == *'<'*'>'* || "$value" == "your-"* || "$value" == "your_"* ]]; then
        fail "${var}  in  ${file}  is still a placeholder:  '${value}'"
        hint "Replace the placeholder with:  ${hint}"
        return 1
    fi

    ok "${var}"
}

# ── frontend/.env ─────────────────────────────────────────────────────────────
FRONTEND_ENV="frontend/.env"

if [ -f "$FRONTEND_ENV" ]; then
    ok "frontend/.env exists"
    check_var "$FRONTEND_ENV" "VITE_SUPABASE_URL"      "your Supabase project URL (e.g. https://xxxx.databasepad.com)"
    check_var "$FRONTEND_ENV" "VITE_SUPABASE_ANON_KEY" "anon key from your Supabase / Databasepad dashboard → Settings → API"
else
    fail "frontend/.env  not found"
    hint "Create it from the repo-root example:"
    hint "  cp .env.example frontend/.env"
    hint "Then open frontend/.env and set:"
    hint "  VITE_SUPABASE_URL=https://qdgjitmgoruiyajojjcr.databasepad.com"
    hint "  VITE_SUPABASE_ANON_KEY=<your anon key>"
    hint ""
    hint "Note: VITE_ vars are baked into the frontend bundle at build time."
    ERRORS=$((ERRORS + 2))
fi

# ── backend/.env ──────────────────────────────────────────────────────────────
BACKEND_ENV="backend/.env"

if [ -f "$BACKEND_ENV" ]; then
    ok "backend/.env exists"
    check_var "$BACKEND_ENV" "SUPABASE_URL"             "your Supabase project URL (e.g. https://xxxx.databasepad.com)"
    check_var "$BACKEND_ENV" "SUPABASE_ANON_KEY"        "anon key from your Supabase / Databasepad dashboard → Settings → API"
    check_var "$BACKEND_ENV" "SUPABASE_SERVICE_ROLE_KEY" "service_role key — Databasepad dashboard → Settings → API (keep this secret!)"
else
    fail "backend/.env  not found"
    hint "Create it from the example:"
    hint "  cp backend/.env.example backend/.env"
    hint "Then open backend/.env and fill in the three Supabase values:"
    hint "  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
    hint ""
    hint "The service role key bypasses Row Level Security — never commit it."
    ERRORS=$((ERRORS + 3))
fi

# ── 4. Port availability ──────────────────────────────────────────────────────
header "4. Port availability"

check_port() {
    local port="$1" service="$2"
    local in_use=false

    if command -v lsof &>/dev/null; then
        lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null 2>&1 && in_use=true
    elif command -v ss &>/dev/null; then
        ss -tlnp | grep -q ":${port} " && in_use=true
    elif command -v netstat &>/dev/null; then
        netstat -tlnp 2>/dev/null | grep -q ":${port} " && in_use=true
    fi

    if $in_use; then
        warn "Port ${port} is already in use  (needed by ${service})"
        command -v lsof &>/dev/null && hint "See what's using it:  lsof -i :${port}"
        hint "Or stop existing containers:  ${COMPOSE_CMD} down"
    else
        ok "Port ${port} is free  (${service})"
    fi
}

check_port 8080 "frontend"
check_port 8000 "backend API"

# ── 5. Launch ─────────────────────────────────────────────────────────────────
header "5. Starting"

if [ "$ERRORS" -gt 0 ]; then
    printf "\n${RED}${BOLD}  ✗  Found %d issue(s) above — fix them then re-run this script.${RESET}\n\n" "$ERRORS"
    exit 1
fi

# Export VITE_ vars into the shell environment so docker compose can forward
# them as build args to the frontend image (see docker-compose.yml build.args).
set -a
# shellcheck disable=SC1090
source "$FRONTEND_ENV"
set +a

info "Building images and starting containers…"
info "(First build downloads base images and may take 3–5 minutes)"
printf "\n"

if ! $COMPOSE_CMD up --build -d; then
    printf "\n${RED}${BOLD}  ✗  docker compose failed.${RESET}\n\n"
    printf "${BOLD}  Common causes:${RESET}\n"
    hint "• Out of Docker memory — increase it: Docker Desktop → Settings → Resources → Memory"
    hint "• Port conflict from a previous run — stop it:  ${COMPOSE_CMD} down"
    hint "• Stale build cache — force a clean rebuild:  ${COMPOSE_CMD} build --no-cache"
    hint "• Network issue pulling base images — check your internet connection"
    hint ""
    hint "Run  ${COMPOSE_CMD} logs  to see the full error output."
    exit 1
fi

printf "\n${GREEN}${BOLD}  ✓  All services are up!${RESET}\n\n"
printf "${BOLD}  URLs${RESET}\n"
printf "  ${CYAN}Frontend${RESET}   →  http://localhost:8080\n"
printf "  ${CYAN}Backend${RESET}    →  http://localhost:8000\n"
printf "  ${CYAN}API docs${RESET}   →  http://localhost:8000/docs\n"
printf "\n${BOLD}  Useful commands${RESET}\n"
printf "  ${COMPOSE_CMD} logs -f              # stream all logs\n"
printf "  ${COMPOSE_CMD} logs -f backend      # backend logs only\n"
printf "  ${COMPOSE_CMD} logs -f frontend     # frontend logs only\n"
printf "  ${COMPOSE_CMD} down                 # stop all containers\n"
printf "  ${COMPOSE_CMD} build --no-cache     # force a clean rebuild\n"
printf "\n"
