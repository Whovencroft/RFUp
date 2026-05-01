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

## Redesign: AI Session Page Layout
- [x] Two-panel split layout: left = operator file, right = chat + dice
- [x] Left panel: operator file header (name, job title, XP), scrollable skill manifest, allies section (other players in session)
- [x] Right panel: active incident banner (top), scrollable chat log (middle), chat input bar (bottom)
- [x] Game flow: (1) player types action in chat, (2) selects skill from manifest which auto-rolls D6s with animation, (3) AI responds
- [x] Remove manual dice number entry — replaced with animated in-app roller triggered by skill selection
- [x] Skill selection in manifest highlights the chosen skill and triggers the roll inline
- [x] Chat log shows: player action messages, dice roll results, AI narration, skill rulings, DC badges

## Fix: AI Session Dice Flow
- [x] Auto-submit roll + description when skill is clicked (remove separate Submit button)
- [x] After auto-submit, if all 6s rolled OR enough XP to convert to all 6s: show skill advancement dialog
- [x] Skill advancement dialog: AI-generated default name based on action + "more specific than last skill" rule
- [x] Player can edit the suggested skill name before confirming
- [x] Move chat input buttons to left side of the input bar (buttons in dialog are left-aligned; input bar has no buttons now)

## Upgrade Batch 1 — Major Features

### 1. Mobile-Responsive UI
- [x] Mobile navbar: hamburger button + slide-out drawer with all nav links
- [x] Audit and fix Play page layout on mobile (two-column → single column)
- [x] Audit and fix AiSession page on mobile (two-panel → stacked)
- [x] Audit and fix GmPanel, Incidents, SessionLog, Sessions pages on mobile
- [x] Ensure all dialogs and modals are mobile-friendly

### 2. Real-Time Turn Notifications
- [x] Browser Notification API: request permission on login, fire when it becomes player's turn
- [x] Tab title badge: show "⚡ YOUR TURN" in document.title when it's the player's turn
- [x] Toast notification in-app when turn advances to current player

### 3. Session Invite Links (GM-sendable)
- [x] Backend: generate a signed invite token for a specific session (stored in DB)
- [x] Backend: redeem invite token → add user to session player list
- [x] Frontend: "Copy Invite Link" button in session header
- [x] Frontend: invite link copies to clipboard from session header

### 4. Skill History and Lineage Visualization
- [x] DB schema: parentSkillId added to skills table
- [x] When a new skill is added via advancement dialog, record parentSkillId
- [x] Frontend: skill lineage tree component on character sheet (Play page)

### 5. XP Spend in AI Sessions
- [x] Frontend: XP spend prompt shown after dice animate before auto-submit
- [x] Backend: XP deducted and non-6 dice converted before submitting to AI
- [x] XP mechanic bug in AI sessions fixed

### 6. GM Private Notes + GM Chat in Sessions
- [x] DB schema: gmNotes column added to ai_sessions table
- [x] Backend: gm.saveGmNotes procedure (admin only)
- [x] Backend: gm.sendGmChat procedure added
- [x] Frontend: GM notes panel in AiSession page (visible only to admin)
- [x] Frontend: GM chat input in AiSession page (sends as GM, visible to all players)

### 7. PDF Session Transcript Export
- [x] Backend: aiGm.generateDebrief procedure — LLM generates full debrief
- [x] Frontend: Debrief page at /sessions/:id/debrief with print/PDF export
- [x] Debrief page uses @media print for clean PDF export

### 8. Player Callsigns + AI-Generated Avatars
- [x] DB schema: callsign and avatarUrl columns added to characters table
- [x] Backend: character.update accepts callsign field
- [x] Backend: character.generateAvatar procedure wired to image generation
- [x] Frontend: callsign field on character sheet (Play page)
- [x] Frontend: avatar section with text prompt input + "Generate" button + preview

### 9. Recurring Shift Scheduler (GM-only)
- [x] Frontend: "Scheduler" tab in GM Panel
- [x] UI: set schedule label, cron expression, briefing message
- [x] Backend: shiftSchedules.create, list, update, delete procedures
- [x] DB schema: shift_schedules table
- [x] Scheduled task: shift schedules stored in DB, ready for scheduled task integration

### 10. Post-Session AI Debrief
- [x] Backend: aiGm.generateDebrief procedure — calls LLM with full session transcript
- [x] Debrief includes: most creative skill, most catastrophic failure, incident summary, narrative paragraph, commendation badge winner
- [x] Frontend: debrief auto-generates when session is ended
- [x] Frontend: debrief displayed at /sessions/:id/debrief

### 11. Enter the Facility Lobby (replaces direct incident link)
- [x] DB schema: session_join_requests table
- [x] Backend: aiGm.listOpenSessions procedure
- [x] Backend: aiGm.requestJoin procedure
- [x] Backend: gm.listJoinRequests procedure
- [x] Backend: gm.approveJoinRequest / gm.denyJoinRequest procedures
- [x] Frontend: "Enter the Facility" button on Home → /lobby page
- [x] Frontend: /lobby shows open sessions with title, incident, player count, "Request to Join" button
- [x] Frontend: GM Panel → Personnel tab shows pending join requests with Approve/Deny
- [x] Frontend: player sees "Request Pending" state after submitting

## Overhaul Batch 2
- [x] DB: add bio column to characters table
- [x] Backend: character.update accepts bio field
- [x] Backend: character.getSessionHistory — sessions player participated in with outcome
- [x] Backend: shiftSchedules.generateBriefing — AI generates label + briefing message from incident pool
- [x] Frontend: Operator File page — full dossier (bio, callsign, avatar, skills + lineage, session history, commendations)
- [x] Frontend: Remove dice roller from Operator File page (rolling only in sessions)
- [x] Frontend: Session Log — hide from nav and page for non-admin users
- [x] Frontend: Incident Board — show only active/posted incidents (not the full library)
- [x] Frontend: Shift Scheduler — add "Generate Briefing" button that calls AI and fills label + message fields
