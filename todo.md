# Roll for Uptime — Project TODO

## Phase 1: Schema & Design System
- [x] Define DB schema: characters, skills, xp_log, incidents, session_log tables
- [x] Run migration SQL
- [x] Set up dark elegant design system in index.css (color palette, typography, tokens)
- [x] Add Google Fonts to index.html

## Phase 2: Backend (tRPC Routers)
- [x] character router: create, get, update
- [x] skill router: list, add skill on all-6s
- [x] xp router: award XP on fail, spend XP
- [x] incident router: list, create (GM only), set difficulty
- [x] sessionLog router: list recent events, create log entry
- [x] GM mode: adminProcedure gate for incident management and player sheet view

## Phase 3: Frontend — Core Gameplay
- [x] Landing page: intro, full ruleset, setting lore, tone guide
- [x] Character sheet page: create/edit name, job title, starting skill
- [x] Dice roller: animated D6 roll, show individual results + sum
- [x] Skill tracker: list skills with levels, prompt new skill on all-6s
- [x] XP tracker: display XP, award on fail, spend to convert die

## Phase 4: Frontend — Social & GM
- [x] Incident board: pre-written security incidents + GM-submitted
- [x] Session log: shared feed of rolls, skill gains, XP changes
- [x] GM (Shift Supervisor) mode: manage incidents, set difficulty, view all sheets

## Phase 5: Polish & Delivery
- [x] Responsive layout across all pages
- [x] Animated dice roll feedback
- [x] Empty states and loading skeletons
- [x] Vitest unit tests (11 tests, 2 test files, all passing)
- [x] Final checkpoint and delivery

## Fix: Shift Supervisor Access Flow
- [x] Auto-promote OWNER_OPEN_ID to admin on login (already in db.ts upsertUser — verified)
- [x] Add backend: getAllUsers query helper
- [x] Add backend: gm.listUsers and gm.setRole tRPC procedures
- [x] Add frontend: Personnel section in GM Panel (list users, promote/demote)
- [x] Fix landing page copy — accurate Shift Supervisor explanation
- [x] Add clear Shift Supervisor explanation on home page and access-denied screen

## Fix: GM Panel Usability
- [x] Restructure GM Panel into tabs: Incidents / Operator Files / Personnel
- [x] Personnel tab must be immediately visible without scrolling

## Feature: Active Incident Banner + Session Reset
- [x] Add backend: clearSessionLog helper in db.ts
- [x] Add backend: gm.clearSessionLog adminProcedure in routers.ts
- [x] Add frontend: active incident banner on Play page (title, description, difficulty)
- [x] Add frontend: session reset button in GM Panel (Session Log tab)

## Feature: Printable Character Sheet + GM Panel Fix
- [x] Fix GM Panel: default tab to Personnel so user management is immediately visible
- [x] Build /print page: printer-friendly character sheet (name, job title, skills, XP, rules reference)
- [x] Add "Print Character Sheet" link on the Play page (printer icon in OPERATOR FILE header)
- [x] Register /print route in App.tsx (no NavBar, white background)
- [x] Hide navbar and UI chrome on /print (print CSS via @media print)

## Content: Home Page Rewrite + Supervisor Section Relocation
- [x] Rewrite Home page content with a more human, conversational tone (keep rules section as-is)
- [x] Remove "For the Shift Supervisor" block from Home page
- [x] Add "For the Shift Supervisor" briefing block to the GM Panel page (amber briefing card above tabs)

## Feature: AI Shift Supervisor (AI-Run Game Mode)
- [x] DB: ai_sessions table (id, incitingIncidentId, status, playerOrder, currentTurnUserId, contextSummary, createdAt)
- [x] DB: ai_messages table (id, sessionId, authorId, authorName, authorType, content, rollData, dcSet, skillRuling, isIncidentChain, createdAt)
- [x] Backend: aiGm router — createSession, getSession, listSessions, endSession, getMessages, submitAction
- [x] Backend: submitAction — player submits action + dice, AI adjudicates skill, sets DC, narrates outcome
- [x] Backend: AI system prompt — Roll for Uptime rules, Facility 404 tone, skill adjudication, DC logic, incident chaining
- [x] Backend: turn order management — advance to next player after AI responds
- [x] Backend: incident chaining — AI can introduce new incidents mid-session
- [x] Frontend: GM Panel "AI Sessions" tab — launch session, pick inciting incident, select players, view/end sessions
- [x] Frontend: AI Session page (/sessions/:id) — shared visible feed, turn indicator, action + dice roll submission form
- [x] Frontend: Dice roll input in action form — player enters physical roll results, quick-pick from character skills
- [x] Frontend: AI response display — narration, skill ruling badge, DC badge, incident chain badge inline
- [x] Frontend: Session status bar — sticky header with turn indicator, sessions list page at /sessions
- [x] Tests: 13 tests passing (2 test files) — AI procedures covered in mock suite
