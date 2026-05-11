# Roll for Uptime — Self-Hosted Edition

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?repo=https://github.com/Whovencroft/RFUp&branch=standalone)

A fully self-contained tabletop RPG for security teams. Zero external dependencies. Runs anywhere Node.js runs.

**[Full self-hosting guide → HOSTING.md](HOSTING.md)**

---

## What it is

Roll for Uptime is a lightweight RPG built around the **Roll for Shoes** system, set in a cyberpunk security operations center called **Facility 404**. Players are security analysts responding to incidents. The Shift Supervisor (GM) narrates and adjudicates — optionally assisted by an AI Game Master if you connect an LLM API.

**Six rules:**
1. Roll a number of d6 equal to your skill level. Take the highest result.
2. If the highest die beats the DC, you succeed.
3. If you fail, gain 1 XP.
4. Spend XP equal to the new level to upgrade a skill, or gain a new sub-skill at level 1.
5. If you roll all sixes, you may add a new skill related to what you just did.
6. Everyone starts with one skill: their job title, at level 1.

---

## Quick Start

### Option A — Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/Whovencroft/RFUp.git rfu-standalone
cd rfu-standalone

# Copy and edit the config
cp docker-compose.yml docker-compose.override.yml
# Edit docker-compose.override.yml and set JWT_SECRET and any LLM vars

# Build and run
docker compose up -d

# Open http://localhost:3000
# The first account you register becomes the admin (Shift Supervisor)
```

### Option B — Railway (one-click cloud deploy)

1. Click the **Deploy on Railway** button above (or go to [railway.app/new](https://railway.app/new) and point it at the `standalone` branch of this repo).
2. In the Railway dashboard, set these environment variables:
   - `JWT_SECRET` — any long random string (required)
   - `LLM_PROVIDER` / `LLM_API_KEY` / `LLM_MODEL` — optional, enables AI GM
   - `DATABASE_PATH` — Railway provides persistent volumes; set to `/data/rfu.db`
3. Click **Deploy**. Railway builds and starts the app automatically.
4. Open the generated `.railway.app` URL. The first account registered becomes the admin.

> **Tip:** After deploying, go to **Settings → LLM Configuration** in the app to update your AI provider without redeploying.

### Option C — Plain Node.js

```bash
# Prerequisites: Node.js 20+

git clone https://github.com/Whovencroft/RFUp.git rfu-standalone
cd rfu-standalone

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET

# Build
npm run build

# Run
npm start

# Open http://localhost:3000
```

### Option C — Development mode

```bash
npm install
cp .env.example .env.development.local
# Edit .env.development.local

# Run server and frontend in parallel
npm run dev
```

---

## Configuration

All configuration is done via environment variables (or a `.env` file). See `.env.example` for the full list.

### Required

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key for signing session tokens. Use a random 32+ character string. |

### LLM / AI Game Master (optional)

If not configured, the app runs in **supervisor-only mode** — the Shift Supervisor narrates all sessions manually.

| Variable | Description | Default |
|---|---|---|
| `LLM_PROVIDER` | `openai`, `anthropic`, `ollama`, or `custom` | `openai` |
| `LLM_API_KEY` | API key for the chosen provider | — |
| `LLM_MODEL` | Model name | Provider default |
| `LLM_BASE_URL` | Base URL for Ollama or custom OpenAI-compatible endpoints | — |

**Provider examples:**

```bash
# OpenAI
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o

# Anthropic
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-3-5-sonnet-20241022

# Ollama (local, no API key needed)
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2

# Any OpenAI-compatible endpoint (LM Studio, Together, Groq, etc.)
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=gsk_...
LLM_MODEL=llama-3.1-70b-versatile
```

### Image Generation (optional)

Enables AI portrait generation for operator files.

| Variable | Description |
|---|---|
| `IMAGE_PROVIDER` | `openai` (DALL-E 3) or `stability` (Stable Diffusion) |
| `IMAGE_API_KEY` | API key for the chosen provider |

### Security

| Variable | Description | Default |
|---|---|---|
| `REQUIRE_INVITE` | Set to `"true"` to require invite codes for new registrations | `false` |

---

## Architecture

```
rfu-standalone/
├── server/
│   ├── index.ts          ← Express + Socket.io entry point
│   ├── trpc.ts           ← tRPC context + procedure builders
│   ├── auth.ts           ← bcrypt + JWT session auth
│   ├── llm.ts            ← Multi-provider LLM client
│   ├── realtime.ts       ← Socket.io rooms + event emitters
│   ├── storage.ts        ← Local filesystem portrait storage
│   ├── db/
│   │   ├── schema.ts     ← Drizzle ORM schema (SQLite)
│   │   ├── index.ts      ← Database connection (@libsql/client)
│   │   └── migrate.ts    ← Auto-migration on startup
│   └── routers/
│       ├── auth.ts       ← Register, login, logout, profile
│       ├── character.ts  ← Operator files, skills, portraits
│       ├── sessions.ts   ← Game sessions, messages, turns
│       └── incidents.ts  ← Incident board
├── client/
│   └── src/
│       ├── App.tsx       ← Routes + navigation
│       ├── pages/        ← Home, Login, Register, OperatorFile,
│       │                    Sessions, Session, GmPanel, Incidents
│       ├── contexts/     ← AuthContext
│       └── lib/
│           ├── trpc.ts   ← tRPC React client
│           └── socket.ts ← Socket.io client helpers
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Multiplayer

Players connect to the same server URL. Real-time updates (new messages, turn changes, player joins/leaves) are delivered via **Socket.io WebSockets** — no polling required.

**Invite codes:** The Shift Supervisor generates a one-time invite code from the GM Panel. Share it with players. They enter it on the session join screen. Codes expire after 24 hours by default.

**Supervisor-only sessions:** If no LLM is configured, the Shift Supervisor handles all narration by typing responses directly in the session view. Players still roll dice and submit actions normally.

---

## Hosting options

| Platform | Notes |
|---|---|
| **Docker on any VPS** | Recommended. DigitalOcean, Linode, Hetzner all work. ~$4–6/mo for a 1GB droplet. |
| **Railway** | Deploy from GitHub, auto-detects Node. Add `JWT_SECRET` and LLM vars in the Railway dashboard. |
| **Render** | Free tier has cold starts; paid tier ($7/mo) is always-on. |
| **Fly.io** | Good free tier, Docker-native. |
| **Local network** | Run on a home server or gaming PC. Players connect via your local IP or a Tailscale/ZeroTier VPN. |

---

## Data persistence

All data is stored in a single SQLite file (`data/rfu.db` by default). Portraits are stored in `uploads/`. Back up both directories to preserve your campaign data.

With Docker, both are in the `rfu_data` named volume. To back up:

```bash
docker run --rm -v rfu_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/rfu-backup-$(date +%Y%m%d).tar.gz /data
```

---

## License

MIT
