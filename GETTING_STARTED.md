# Getting Started

A step-by-step guide to get the app running on your own computer, written so
you don't need any prior technical experience. If you get stuck on any step,
that's normal — ask in the team chat and include a screenshot of where you're
stuck.

There are two versions of this guide below: **Mac** and **Windows**. Follow
the one that matches your computer.

---

## Before you start: install these three things

You only need to do this once, ever, on this computer.

1. **Git** — lets you download ("clone") the project's code.
   - Mac: open **Terminal** (see Step 1 below) and type `git --version`. If
     it's not installed, macOS will prompt you to install it — click
     **Install**.
   - Windows: download and install **Git for Windows** from
     https://git-scm.com/download/win (accept all the default options during
     install).

2. **Docker Desktop** — runs the app's pieces (the website, the server, and
   the database) in self-contained little boxes called "containers," so you
   don't have to install any of that software directly on your computer.
   - Download from https://www.docker.com/products/docker-desktop/ and
     install it like any other application.
   - **After installing, open the Docker Desktop app and leave it running.**
     You'll know it's ready when the whale icon in your menu bar (Mac) or
     system tray (Windows) stops animating/loading.

3. **Node.js** — a small tool the startup script needs to fetch one more
   helper tool automatically. You don't need to learn it.
   - Download the version marked **LTS** from https://nodejs.org/ and
     install it like any other application.

That's it — no coding knowledge or setup beyond clicking "Install" a few
times.

---

## Mac instructions

### 1. Open Terminal

Terminal is the app you'll use to type commands. Press `Cmd + Space`, type
`Terminal`, and press Enter. A window with text will open — this is normal.

### 2. Download the project

Copy and paste this line into the Terminal window and press Enter (replace
the URL if you were given a different one):

```
git clone https://github.com/damentame/singularity.git
```

This creates a new folder on your computer with all the project's code in
it. Then move into that folder:

```
cd singularity
```

### 3. Run the startup script

Copy and paste this and press Enter:

```
./start.sh
```

The first time you run this, it will take a few minutes — it's downloading
everything it needs. You'll see a lot of text scroll by; that's expected.

**What this one command does for you automatically:**
- Checks that Docker and Git are set up correctly.
- Starts a local database on your computer.
- Creates the configuration files the app needs (you don't have to do this
  by hand).
- Builds and starts the website and the server.

If it prints any lines starting with `✗` (a red X), read the hint printed
underneath it — it tells you exactly what to fix, then re-run
`./start.sh`.

### 4. Open the app

Once you see `✓ All services are up!`, open your web browser and go to:

```
http://localhost:8080
```

That's the app, running on your own computer.

### 5. When you're done for the day

Back in Terminal, run:

```
docker compose down
```

This stops everything. Your code and data are still there — running
`./start.sh` again next time picks up right where you left off.

---

## Windows instructions

### 1. Open PowerShell

Press the **Start** button, type `PowerShell`, and press Enter. A window
with text will open — this is normal.

### 2. Download the project

Copy and paste this line and press Enter (replace the URL if you were given
a different one):

```
git clone https://github.com/damentame/singularity.git
```

Then move into the new folder:

```
cd singularity
```

### 3. Allow the script to run (one-time only)

Windows blocks scripts by default for security. Run this once:

```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

If it asks for confirmation, type `Y` and press Enter.

### 4. Run the startup script

```
.\start.ps1
```

The first time you run this, it will take a few minutes — it's downloading
everything it needs. You'll see a lot of text scroll by; that's expected.

**What this one command does for you automatically:**
- Checks that Docker and Git are set up correctly.
- Starts a local database on your computer.
- Creates the configuration files the app needs (you don't have to do this
  by hand).
- Builds and starts the website and the server.

If it prints any lines starting with `[!!]` (an error), read the hint
printed underneath it — it tells you exactly what to fix, then re-run
`.\start.ps1`.

### 5. Open the app

Once you see `[OK] All services are up!`, open your web browser and go to:

```
http://localhost:8080
```

That's the app, running on your own computer.

### 6. When you're done for the day

Back in PowerShell, run:

```
docker compose down
```

This stops everything. Your code and data are still there — running
`.\start.ps1` again next time picks up right where you left off.

---

## Quick reference (for next time)

Once you've done the one-time setup above, every time you want to work on
the app you only need to:

1. Make sure Docker Desktop is open and running.
2. Open Terminal (Mac) or PowerShell (Windows) in the project folder.
3. Run `./start.sh` (Mac) or `.\start.ps1` (Windows).
4. Go to http://localhost:8080 in your browser.
5. When finished, run `docker compose down`.

## Common hiccups

| What you see | What it means | What to do |
|---|---|---|
| "Docker daemon is not running" | Docker Desktop isn't open | Open the Docker Desktop app and wait for the whale icon to stop animating, then re-run the script |
| "Port 8080 is already in use" | Something else is already using that address | Run `docker compose down`, then re-run the script |
| The script fails partway through with a red error | It tells you exactly what's wrong underneath the error | Read the hint text right below the red line — it has the fix |
| Nothing loads at http://localhost:8080 | The build may still be running | Wait a minute and refresh; if it's been several minutes, ask for help with a screenshot of the Terminal/PowerShell window |

## Useful commands (optional, for anyone who wants a bit more control)

Run these from inside the project folder.

| Command | What it does |
|---|---|
| `docker compose logs -f` | Watch live activity/errors from the app |
| `docker compose down` | Stop everything |
| `docker compose build --no-cache` | Force a completely fresh rebuild if something seems stuck |
