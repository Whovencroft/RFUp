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

## Feature: Manual Commendations + Session History in GM Panel
- [x] DB: commendations table (id, sessionId, characterId, characterName, awardedByUserId, reason, createdAt)
- [x] Backend: commendations.create (adminProcedure) — Shift Supervisor awards commendation to a player
- [x] Backend: commendations.listByCharacter (protectedProcedure) — fetch commendations for current user's character
- [x] Backend: commendations.listBySession (adminProcedure) — fetch all commendations for a session
- [x] Backend: character.getSessionHistoryByCharId (adminProcedure) — admin views any operator's shift history
- [x] Frontend: GM Panel AI Sessions tab — add "Award Commendation" button per ended session
- [x] Frontend: Commendation dialog — select player, enter reason, submit
- [x] Frontend: Operator File dossier — commendations section shows real DB commendations
- [x] Frontend: Remove session history section from Operator File (player-facing)
- [x] Frontend: GM Panel Operator Files tab — expandable cards with skill manifest + shift history
- [x] Frontend: GM Panel — Operator Files tab has expandable cards with shift history per operator

## Feature: Supervisor-Led Sessions
- [x] DB: add gmMode field to aiSessions table ('ai' | 'supervisor'), migration applied
- [x] Backend: aiGm.createSession accepts gmMode param (default 'ai')
- [x] Backend: aiGm.submitAction skips LLM call in supervisor mode (just records player action and waits for Supervisor)
- [x] Backend: aiGm.supervisorRespond procedure — adminProcedure, posts narrative response with DC, skill ruling, optional turn advance
- [x] Backend: aiGm.getSession returns gmMode so frontend can branch rendering
- [x] Frontend: GM Panel — session creation form has AI-led / Supervisor-led toggle
- [x] Frontend: AiSession — Supervisor panel shows NARRATIVE RESPONSE section in supervisor mode
- [x] Frontend: AiSession — GM messages render with amber Shield icon and SUPERVISOR badge
- [x] Frontend: AiSession — waiting indicator says 'Waiting for Supervisor response' in supervisor mode
- [x] Frontend: Sessions list — mode badge (AI-LED / SUPERVISOR-LED) and matching icon per session card
- [x] Frontend: NavBar — renamed 'AI Sessions' to 'Sessions'

## Bug: XP Not Awarded on Failed Rolls in AI Sessions
- [x] Trace submitAction — AI was narrating XP award but never writing to DB
- [x] Fix: detect failure (rollTotal <= dcSet) and call updateCharacter to increment XP by 1
- [x] Belt-and-suspenders: also award XP if AI text explicitly mentions awarding XP
- [x] Return xpAwarded flag from submitAction so frontend can show toast
- [x] Frontend: show '+1 XP awarded for a failed roll' toast and refetch character panel
- [x] Tests: 2 new tests covering XP award on failure and no-award on success (19 total, all passing)

## Feature: XP Improvements
- [x] Backend: supervisorRespond accepts awardXp boolean — if true, increment current player's XP by 1
- [x] Frontend: AiSession left panel — XP total already shown in amber badge in operator header; refreshes after each action
- [x] Frontend: AiSession supervisor panel — "Award 1 XP to current operator" checkbox in Narrative Response section (amber, default unchecked)
- [x] Frontend: AiSession dice roll UI — XP count shown in top-right of action input area; amber when > 0, muted when 0; tooltip explains XP spend mechanic

## Feature: XP Spend Prompt, Commendation Notification, Debrief XP Summary
- [x] Frontend: AiSession — XP spend prompt before auto-submit (if player has XP and rolled non-6s, pause and show "You have N XP — spend to convert dice to 6s?" with Yes/No)
- [x] Backend: commendations.create — after inserting commendation, call notifyOwner to alert the awarded operator
- [x] DB: aiMessages.xpAwarded boolean column added (migration applied)
- [x] Backend: xp.sessionSummary — return each player's XP earned during a session (counts xpAwarded messages per player)
- [x] Backend: aiGm.submitAction — passes xpAwarded flag to addAiMessage so it's tracked in DB
- [x] Backend: aiGm.supervisorRespond — passes xpAwarded flag to addAiMessage
- [x] Frontend: Debrief page — XP EARNED THIS SHIFT section shows per-operator XP earned

## Feature: Incident Quick-Inject + Skip/Kick Player
- [x] Backend: aiGm.skipTurn (adminProcedure) — advance turn to next player, post a system message noting the skip
- [x] Backend: aiGm.kickPlayer (adminProcedure) — remove player from playerOrder, post system message, if it was their turn advance to next
- [x] Frontend: AiSession Supervisor panel — Inject Incident section gets a dropdown to pick from incident library (title + difficulty badge), pre-fills title/description/DC fields
- [x] Frontend: AiSession Supervisor panel — PLAYER MANAGEMENT section with Skip Current Turn button and per-player KICK buttons
- [x] Frontend: AiSession — Kick confirmation dialog with optional reason field and Remove Operator button

## Feature: Skip/Kick 24h Soft Warning
- [x] Backend: aiGm.getPlayerActivity — return each player's last action timestamp for the session so frontend can compute inactivity duration
- [x] Frontend: AiSession PLAYER MANAGEMENT — show "ACTIVE" amber badge next to player name if they acted within 24h; skip/kick always available
- [x] Frontend: AiSession kick dialog — show amber WARNING banner if the player was active within 24h

## Feature: Kick Coaching Notification + Turn Timeout Alert
- [x] Backend: kickPlayer procedure — sends coaching-style notification (via notifyOwner) with session name, reason, and a coaching message encouraging the operator to review the debrief and re-engage
- [x] Backend: /api/scheduled/check-turn-timeouts — POST endpoint checks all active sessions for current-turn players who haven't acted in 24h and notifies the Shift Supervisor with session name and hours elapsed
- [x] Scheduled task: hourly cron (every hour) calls the endpoint; requires site to be deployed to fire
- [x] DB: turnStartedAt column on aiSessions — written on every turn advance, used for accurate 24h detection
- [x] DB: lastTimeoutAlertUserId column on aiSessions — dedup: only one alert per player per stalled turn; reset to null on turn advance
- [x] Backend: all three turn-advance paths write turnStartedAt + reset lastTimeoutAlertUserId to null

## Bug: Turn Timeout Scheduled Task Spamming
- [x] Change scheduled task from hourly to once-daily (run at 9am)
- [x] Batch all timeout alerts into a single notifyOwner call per run (not one per stalled player)
- [x] Removed unused imports from the endpoint (aiMessages, and, eq, desc)

## Feature: Portrait Lightbox
- [x] Frontend: Play page — add ZoomIn button on portrait thumbnail (bottom-right corner)
- [x] Frontend: Play page — lightbox overlay shows full-size portrait with name, callsign, job title and close button
- [x] Frontend: Play page — Sparkles re-generate hint on hover (top-right corner) when portrait exists

## Improvement: crypto.randomInt for Fair Dice
- [x] Backend: Replace Math.random() in rollDice() with Node.js crypto.randomInt(1,7) — eliminates modulo bias for cryptographically fair d6 rolls

## Improvement: react-markdown for AI GM Responses
- [x] Frontend: Install react-markdown + remark-gfm
- [x] Frontend: AI and GM messages in AiSession rendered as formatted markdown (bold, lists, blockquotes, code, headings) — player messages remain plain text

## Feature: ID Card Portrait Format
- [x] Backend: generateAvatar prompt updated to enforce ID card format — operator photo in upper two-thirds, footer bar with name and job title in white monospace font, retro sci-fi institutional badge style

## Feature: Supervisor Notifications Feed
- [x] DB: supervisorNotifications table (id, sessionId, sessionTitle, supervisorUserId, type, playerName, message, isRead, createdAt)
- [x] Backend: addSupervisorNotification helper in db.ts
- [x] Backend: supervisorNotifications.list procedure — returns unread + recent read notifications for the current supervisor's sessions
- [x] Backend: supervisorNotifications.markRead procedure — mark one or all as read
- [x] Backend: write "player_acted" notification when a player submits an action in submitAction
- [x] Backend: write "turn_waiting" notification when turn advances to next player (after AI/Supervisor responds)
- [x] Backend: write "player_inactive" notification from the scheduled check-turn-timeouts endpoint instead of calling notifyOwner
- [x] Backend: write "player_kicked" and "turn_skipped" notifications in kickPlayer and skipTurn procedures
- [x] Frontend: GM Panel — add Notifications tab with unread badge count
- [x] Frontend: Notifications tab — live feed (poll every 30s), with type icons and relative timestamps
- [x] Frontend: Notifications tab — Mark all as read button + click-to-read on individual notifications
- [x] Frontend: Remove notifyOwner calls from turn-timeout endpoint (replaced by in-app notifications)

## Feature: ID Card Awards & AI Session Panel
- [x] Backend: add cardDesign and cardAwards columns to characters table, migration applied
- [x] Backend: character.update accepts cardDesign and cardAwards fields
- [x] Frontend: CssIdCard — add awards prop (up to 3 Award objects with emoji/label) shown on all 4 designs
- [x] Frontend: Play page lightbox — award selector (pick up to 3 from earned commendations), saves to character
- [x] Frontend: AiSession left panel — show each player's CssIdCard thumbnail with their awards
- [x] Standalone: port awards support to CssIdCard.tsx and OperatorFile.tsx

## Feature: Persist Card Design + GM Panel Card Thumbnails
- [x] Frontend: Play page — save cardDesign to DB via character.update when player changes design in lightbox
- [x] Frontend: Play page — load cardDesign from character data on mount (pre-select the saved design)
- [x] Frontend: GM Panel Operator Files tab — show CssIdCard thumbnail in each operator's expandable card
