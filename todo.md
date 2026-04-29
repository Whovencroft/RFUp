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
