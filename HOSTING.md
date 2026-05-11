# Roll for Uptime — Self-Hosting Guide

This document covers every supported way to run Roll for Uptime on your own infrastructure, from a laptop on your home network to a production VPS behind a reverse proxy. No cloud accounts are required. No external services are required beyond an optional LLM API key if you want the AI Game Master.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Get the Code](#2-get-the-code)
3. [Option A — Local / Development Mode](#3-option-a--local--development-mode)
4. [Option B — Plain Node.js (Production Build)](#4-option-b--plain-nodejs-production-build)
5. [Option C — Docker (Recommended for Servers)](#5-option-c--docker-recommended-for-servers)
6. [Option D — VPS with Nginx Reverse Proxy](#6-option-d--vps-with-nginx-reverse-proxy)
7. [Option E — Railway (One-Click Cloud)](#7-option-e--railway-one-click-cloud)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [First-Run Admin Setup](#9-first-run-admin-setup)
10. [Admin Panel Walkthrough](#10-admin-panel-walkthrough)
11. [Backups and Data Persistence](#11-backups-and-data-persistence)
12. [Updating to a New Version](#12-updating-to-a-new-version)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| Node.js | 20 LTS | 22 LTS recommended. [nodejs.org](https://nodejs.org) |
| npm | 9+ | Comes with Node |
| Git | Any recent | For cloning the repo |
| Docker + Docker Compose | 24+ / 2.20+ | Only needed for Option C/D |

The app uses **SQLite** via `@libsql/client`. No separate database server is required. All data lives in a single file on disk.

---

## 2. Get the Code

```bash
# Facility 404 theme (default)
git clone https://github.com/Whovencroft/RFUp.git rfu
cd rfu

# — OR — blank template (generic labels, ready to customize)
git clone -b template https://github.com/Whovencroft/RFUp.git rfu
cd rfu
```

The `master` branch ships with the **Facility 404** cyberpunk SOC theme pre-loaded. The `template` branch ships with neutral labels ("Character", "Event", "Session") so you can configure your own setting from the admin panel without overwriting anything first.

---

## 3. Option A — Local / Development Mode

This runs the Vite dev server (hot reload) alongside the Express backend. Use this when you are developing or testing locally.

```bash
# Install dependencies
npm install

# Copy the example config
cp .env.example .env.development.local
# Open .env.development.local in any editor and set JWT_SECRET at minimum

# Start both servers in parallel (Vite on :5173, Express on :3000)
npm run dev
```

Open `http://localhost:5173` in your browser. The first account you register becomes the admin.

> **Note:** In dev mode the frontend runs on port 5173 and proxies API calls to port 3000. Do not share the 5173 URL with other players — use Option B or C for multiplayer.

---

## 4. Option B — Plain Node.js (Production Build)

Use this when you want to run the app directly on a machine without Docker. The build compiles the React frontend and TypeScript server into plain JavaScript, then serves everything from a single Express process.

```bash
# 1. Install all dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    Open .env and set at minimum:
#      JWT_SECRET=<any long random string>
#    Optionally set LLM_PROVIDER, LLM_API_KEY, etc.

# 3. Build
npm run build
#    This runs build:client (Vite) and build:server (tsc) in sequence.
#    Output goes to client/dist/ and dist/server/

# 4. Start
npm start
#    Runs: node dist/server/index.js
#    The server auto-creates the SQLite database and runs migrations on first start.

# Open http://localhost:3000
```

To keep the process running after you close the terminal, use a process manager:

```bash
# Using PM2
npm install -g pm2
pm2 start dist/server/index.js --name rfu
pm2 save
pm2 startup   # follow the printed instructions to auto-start on reboot
```

---

## 5. Option C — Docker (Recommended for Servers)

Docker is the easiest way to run the app on a VPS or home server. It handles the build, bundles all dependencies, and keeps the database in a named volume that survives container restarts and upgrades.

### 5a. Quick start

```bash
# Clone the repo
git clone https://github.com/Whovencroft/RFUp.git rfu
cd rfu

# Build and start (detached)
docker compose up -d --build

# Open http://localhost:3000
```

On first start the container builds the app (~2–3 minutes), creates the database, and runs migrations automatically. Subsequent starts are instant.

### 5b. Setting environment variables

Open `docker-compose.yml` and edit the `environment:` block before running `docker compose up`:

```yaml
environment:
  NODE_ENV: production
  PORT: 3000
  JWT_SECRET: "replace-with-a-long-random-string"   # REQUIRED
  # LLM_PROVIDER: openai
  # LLM_API_KEY: sk-...
  # LLM_MODEL: gpt-4o
```

Alternatively, create a `.env` file in the same directory as `docker-compose.yml` and Docker Compose will pick it up automatically:

```bash
# .env (next to docker-compose.yml)
JWT_SECRET=my-super-secret-key-at-least-32-chars
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

### 5c. Useful Docker commands

```bash
# View live logs
docker compose logs -f rfu

# Stop the app
docker compose down

# Rebuild after a git pull
git pull && docker compose up -d --build

# Open a shell inside the running container
docker compose exec rfu sh
```

---

## 6. Option D — VPS with Nginx Reverse Proxy

This is the recommended production setup. The app runs in Docker on port 3000 (not exposed to the internet), and Nginx sits in front handling HTTPS and routing.

### 6a. Server setup (Ubuntu 22.04 / Debian 12)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Clone the repo
git clone https://github.com/Whovencroft/RFUp.git /opt/rfu
cd /opt/rfu
```

### 6b. Configure and start the app

```bash
# Create your .env file
cat > /opt/rfu/.env << 'EOF'
JWT_SECRET=replace-with-a-long-random-string-32-plus-chars
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
EOF

# Start the container (port 3000 is only accessible locally)
docker compose up -d --build
```

Edit `docker-compose.yml` so the port binding is `127.0.0.1:3000:3000` instead of `3000:3000`. This prevents direct external access to port 3000 — all traffic must go through Nginx.

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

### 6c. Configure Nginx

Replace `yourdomain.com` with your actual domain name.

```bash
sudo nano /etc/nginx/sites-available/rfu
```

Paste the following:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Proxy all requests to the Node app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Required for Socket.io WebSockets
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for long-running AI responses
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

Enable the site and test:

```bash
sudo ln -s /etc/nginx/sites-available/rfu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6d. Enable HTTPS with Let's Encrypt

```bash
# Point your domain's A record to your server's IP first, then:
sudo certbot --nginx -d yourdomain.com

# Certbot will modify the Nginx config automatically and set up auto-renewal.
# Verify renewal works:
sudo certbot renew --dry-run
```

After this step your site is live at `https://yourdomain.com`.

### 6e. DNS

In your domain registrar's DNS settings, add an **A record** pointing your domain to your server's public IP address. If you do not have a domain, you can access the app directly via IP (`http://YOUR_SERVER_IP:3000`) as long as port 3000 is open in your firewall.

```bash
# Open port 3000 directly (only needed if not using Nginx)
sudo ufw allow 3000/tcp

# Or, if using Nginx, only open 80 and 443
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 7. Option E — Railway (One-Click Cloud)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?repo=https://github.com/Whovencroft/RFUp&branch=master)

1. Click the button above (or go to [railway.app/new](https://railway.app/new) and point it at the `master` branch of `Whovencroft/RFUp`).
2. In the Railway dashboard, set these environment variables under **Variables**:
   - `JWT_SECRET` — any long random string (required)
   - `LLM_PROVIDER` / `LLM_API_KEY` / `LLM_MODEL` — optional, enables AI GM
3. Railway detects the `Dockerfile` and builds automatically. The app is live in ~3 minutes.
4. Open the generated `.railway.app` URL. The first account registered becomes the admin.

Railway provides a persistent volume automatically. Your database survives redeploys.

---

## 8. Environment Variables Reference

All variables go in `.env` (local) or the `environment:` block in `docker-compose.yml` (Docker) or the Railway/Render dashboard (cloud).

### Required

| Variable | Description |
|---|---|
| `JWT_SECRET` | Signs session tokens. Use any random string of 32+ characters. Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `NODE_ENV` | `development` | Set to `production` for production builds |
| `DATABASE_PATH` | `./data/rfu.db` | Path to the SQLite database file. Created automatically. |
| `UPLOADS_DIR` | `./uploads` | Directory for uploaded portrait images |

### LLM / AI Game Master (optional)

Leave these unset to run in **supervisor-only mode** — the Shift Supervisor narrates all sessions manually. Players still roll dice and submit actions normally.

| Variable | Description | Example |
|---|---|---|
| `LLM_PROVIDER` | `openai`, `anthropic`, `ollama`, or `custom` | `openai` |
| `LLM_API_KEY` | API key for the chosen provider | `sk-...` |
| `LLM_MODEL` | Model name (uses provider default if omitted) | `gpt-4o-mini` |
| `LLM_BASE_URL` | Base URL for Ollama or any OpenAI-compatible endpoint | `http://localhost:11434/v1` |

**Provider examples:**

```bash
# OpenAI
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini          # cheapest good option

# Anthropic
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-3-haiku-20240307

# Ollama (local, no API key needed)
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2

# Groq (fast, generous free tier)
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=gsk_...
LLM_MODEL=llama-3.1-70b-versatile

# LM Studio (local GUI)
LLM_PROVIDER=custom
LLM_BASE_URL=http://localhost:1234/v1
LLM_MODEL=your-loaded-model-name
```

### Image Generation (optional)

Enables AI portrait generation for operator/character files.

| Variable | Description |
|---|---|
| `IMAGE_PROVIDER` | `openai` (DALL-E 3) or `stability` (Stable Diffusion) |
| `IMAGE_API_KEY` | API key for the chosen provider |

### Security

| Variable | Default | Description |
|---|---|---|
| `REQUIRE_INVITE` | `false` | Set to `"true"` to require an invite code for all new registrations. Invite codes are generated from the admin panel. |

---

## 9. First-Run Admin Setup

The database is created automatically on first start. No manual migration step is required.

**The first account registered on a fresh database is automatically granted admin (Shift Supervisor) privileges.** Subsequent registrations create regular user accounts.

1. Open the app URL in your browser.
2. Click **Create Account** and register your admin account.
3. You will be redirected to your Operator File. The nav bar will show a **Shift Supervisor** link.
4. Click **Shift Supervisor** to access the GM Panel and Admin Settings.

If you want to lock down registration after setup, go to **Admin Settings → AI & LLM → Security** and enable **Require invite code for new registrations**. From that point on, new players can only register if you generate an invite link for them from the **Invites** tab.

---

## 10. Admin Panel Walkthrough

The admin panel is accessible at `/gm` (the **Shift Supervisor** nav link). It has the following tabs:

### Users tab

Lists all registered accounts. From here you can promote or demote users to/from admin, enable or disable accounts, and reset passwords.

### Invites tab

Generates registration invite links. Each link contains a one-time code that pre-fills the registration form when clicked. You can set an expiry (in hours) and revoke any unused link. Share the full URL with the person you want to invite — they do not need to know the code separately.

### AI & LLM tab

Configures the AI Game Master. You can change the LLM provider, API key, and model here without restarting the server or editing environment variables. Changes take effect on the next AI response. The **Test Connection** button sends a short ping to verify the API key and model are working.

This tab also contains the **Security** section where you toggle invite-only registration.

### Game Theme tab

This is where you customize the game's flavor text to fit your setting. Four presets are available:

| Preset | Setting | Player label | Incident label |
|---|---|---|---|
| Facility 404 | Cyberpunk SOC | Operator | Incident |
| The Realm | Fantasy | Adventurer | Quest |
| Dusty Trails | Western | Rider | Trouble |
| Blank | Generic | Character | Event |

Click a preset to load all its labels into the fields below, then customize any individual field and click **Save Theme**. Changes apply site-wide immediately — the nav bar, session pages, and operator files all update without a page reload.

---

## 11. Backups and Data Persistence

All persistent data lives in two locations:

| Location | Contents |
|---|---|
| `data/rfu.db` (or `DATABASE_PATH`) | All game data: users, characters, sessions, messages, settings |
| `uploads/` (or `UPLOADS_DIR`) | Uploaded portrait images |

**Docker:** Both directories are inside the `rfu_data` named volume. To back up:

```bash
# Create a timestamped archive
docker run --rm \
  -v rfu_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/rfu-backup-$(date +%Y%m%d-%H%M).tar.gz /data

# Restore from backup
docker run --rm \
  -v rfu_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/rfu-backup-20250101-1200.tar.gz -C /
```

**Plain Node.js:** Back up the `data/` and `uploads/` directories directly.

```bash
tar czf rfu-backup-$(date +%Y%m%d).tar.gz data/ uploads/
```

A weekly cron job is a reasonable backup cadence for most groups:

```bash
# Add to crontab (crontab -e)
0 3 * * 0  cd /opt/rfu && docker run --rm -v rfu_data:/data -v /opt/backups:/backup alpine tar czf /backup/rfu-$(date +\%Y\%m\%d).tar.gz /data
```

---

## 12. Updating to a New Version

```bash
cd /opt/rfu   # or wherever you cloned the repo

# Pull latest changes
git pull origin master

# Rebuild and restart (Docker)
docker compose up -d --build

# — OR — rebuild and restart (plain Node.js)
npm install
npm run build
pm2 restart rfu
```

Database migrations run automatically on startup. You do not need to run any migration commands manually.

---

## 13. Troubleshooting

**The app starts but I see a blank page or 404.**
Run `npm run build` first. The production server (`npm start`) serves the pre-built frontend from `client/dist/`. If that directory does not exist, the server has nothing to serve.

**WebSocket connections are failing / real-time updates not working.**
If you are using Nginx, make sure the `Upgrade` and `Connection` headers are set in your proxy config (see Section 6c). Without these, Socket.io falls back to long-polling and some features may behave oddly.

**I forgot to set `JWT_SECRET` and now sessions are broken.**
Stop the server, set `JWT_SECRET` in your `.env` or `docker-compose.yml`, and restart. All existing sessions will be invalidated (users will need to log in again), but no data is lost.

**The first account I registered is not an admin.**
This happens if the database already had a user in it when you registered. Check whether a previous test account exists. You can promote any user to admin by running:

```bash
# Docker
docker compose exec rfu node -e "
const {createClient} = require('@libsql/client');
const db = createClient({url:'file:/data/db/rfu.db'});
db.execute(\"UPDATE users SET role='admin' WHERE username='YOUR_USERNAME'\").then(()=>process.exit(0));
"

# Plain Node.js
node -e "
const {createClient} = require('@libsql/client');
const db = createClient({url:'file:data/rfu.db'});
db.execute(\"UPDATE users SET role='admin' WHERE username='YOUR_USERNAME'\").then(()=>process.exit(0));
"
```

**Port 3000 is already in use.**
Set `PORT=3001` (or any free port) in your `.env` file and restart.

**Docker build fails with "no space left on device".**
Clean up unused Docker images and volumes: `docker system prune -af --volumes`. Note that `--volumes` removes all unused volumes — make sure your data volume is in use by a running or stopped container before running this.

**I want to run on a home network without a domain.**
Set `PORT=3000`, open port 3000 in your router/firewall, and share your public IP with players (`http://YOUR_PUBLIC_IP:3000`). For a more stable setup, use a free dynamic DNS service (DuckDNS, No-IP) to get a hostname that follows your IP if it changes.
