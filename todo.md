
## Feature: User Management Panel (Standalone Admin)
- [x] Backend: admin.listUsers procedure — returns all users with role, createdAt, lastLogin, active status
- [x] Backend: admin.updateUser procedure — promote/demote role, deactivate/reactivate account
- [x] Backend: admin.createInvite procedure — generate single-use invite link with optional expiry
- [x] Backend: admin.listInvites procedure — show active invite links with usage status
- [x] Backend: admin.revokeInvite procedure — invalidate an invite link
- [x] Backend: admin.resetPassword procedure — admin sets a new password for any user
- [x] DB: add active (boolean) and lastLogin (timestamp) columns to users table
- [x] DB: add invites table (id, code, createdBy, usedBy, expiresAt, usedAt)
- [x] Frontend: AdminSettings — add Users tab with user list, role badge, deactivate toggle, reset password button
- [x] Frontend: AdminSettings — add Invites tab with generate invite button, active invite list, revoke button
- [ ] Frontend: Register page — accept invite code in URL (?invite=xxx) and validate before allowing registration

## Feature: Theme System (Standalone)
- [x] Backend: game.config.ts — define ThemeConfig interface with all flavor strings (settingName, factionName, operatorLabel, incidentLabel, sessionLabel, supervisorLabel, xpLabel, skillLabel, tagline, welcomeMessage)
- [x] Backend: 4 preset themes — Facility 404, The Realm (fantasy), Dusty Trails (western), Blank
- [x] Backend: settings table — persist active theme config as JSON
- [x] Backend: admin.getTheme / admin.updateTheme / admin.applyPreset procedures
- [x] Backend: theme context endpoint — public procedure returning current theme for frontend
- [x] Frontend: ThemeContext — React context providing theme strings to all components
- [x] Frontend: Replace all hardcoded Facility 404 strings with theme context values
- [x] Frontend: AdminSettings — add Theme tab with preset picker, live editable fields, save button
- [ ] GitHub: create template branch from standalone with blank theme as default

## Feature: Invite URL param on Register page
- [x] Frontend: Register page reads ?invite= from URL and pre-fills the invite code field
- [x] Frontend: Show a banner/badge when arriving via invite link ("You were invited — code pre-filled")
- [x] Backend: Add validateInvite public procedure — checks code exists, not used, not expired
- [x] Frontend: Validate invite code on blur/before submit and show inline error if invalid

## Feature: Apply DESIGN.md Visual System

- [x] Copy DESIGN.md from origin/main into repo root
- [x] Update index.css with DESIGN.md color tokens, typography (Inter + JetBrains Mono), spacing scale
- [x] Update nav bar to use DESIGN.md nav-item-active/idle tokens and primary color
- [x] Update cards/panels to use DESIGN.md surface/card tokens
- [x] Update buttons to use DESIGN.md button-primary/secondary/accent/danger tokens
- [x] Update inputs to use DESIGN.md input tokens
- [x] Update status chips to use DESIGN.md status-success/warning/error/info/neutral tokens
- [x] Update game HUD panels (session view, GM panel) to use game-hud-panel and game-stat tokens
- [x] Ensure focus rings are visible on all interactive controls
- [x] Verify readable contrast throughout (no invisible text)
