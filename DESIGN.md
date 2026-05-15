
When implementing UI from this DESIGN.md, the agent should infer the correct design choices from the project context instead of asking the user to specify every detail.

The agent must read, in order:

1. Existing project files.
2. Existing UI code.
3. Existing route, scene, or component names.
4. Existing screenshots, mockups, assets, or style files.
5. Project documentation.
6. This DESIGN.md file.

The agent should treat this file as the design constitution, not a screen-by-screen specification.

### Inference Rules

When a direct design instruction is missing, infer from context using this priority order:

1. Preserve existing architecture and component structure.
2. Match the current project type.
3. Use the closest existing component token.
4. Use the Markdown design rationale to decide layout, hierarchy, and tone.
5. Create the smallest new design pattern needed.
6. Update DESIGN.md only if the new pattern is reusable.

The agent should not stop for clarification unless the missing information would cause one of the following:

- destructive data loss
- irreversible architecture changes
- conflicting requirements
- inaccessible or unreadable UI
- a security or privacy risk
- a major product-direction decision

Otherwise, the agent should make a stated assumption and proceed.

### Project-Type Inference

If the project appears to be a game, prioritize:

- game HUD panel rules
- readable status values
- consistent command zones
- current actor, target, and confirmation clarity
- controller or keyboard navigability

If the project appears to be a developer tool, prioritize:

- dense but readable layout
- visible process state
- monospaced logs, commands, paths, and IDs
- safe separation of destructive actions
- clear error and warning states

If the project appears to be a documentation site, prioritize:

- readable text width
- strong headings
- restrained links and callouts
- minimal decorative UI
- stable navigation

If the project appears to be an agent dashboard, prioritize:

- current task state
- input/output/log separation
- queue, blocked, running, complete, and failed states
- compact telemetry
- auditability

If the project appears to be a storefront or marketing page, prioritize:

- clear visual hierarchy
- strong product imagery
- obvious primary actions
- restrained use of accent color
- fast scanning

### Classification Requirement

Before making design changes, classify each major decision as one of:

- `recovered`: directly found in the project or DESIGN.md
- `inferred`: logically chosen from project context
- `proposed`: new pattern created because no existing pattern fit

The agent should prefer `recovered` over `inferred`, and `inferred` over `proposed`.

### Implementation Rule

The agent may create missing UI components, layout structures, style files, or token mappings when needed, but must follow this order:

1. Reuse existing components.
2. Extend existing components.
3. Create a new component only when reuse would make the code worse.
4. Add a new token only when the value will recur.
5. Update DESIGN.md when adding a reusable visual rule.

Do not introduce one-off styles unless the local context genuinely requires them.

### Validation Rule

After implementation, the agent should verify:

- design tokens were used instead of hardcoded values where practical
- spacing follows the DESIGN.md scale
- typography follows the DESIGN.md roles
- interactive controls have visible focus states
- color is not the only state indicator
- destructive actions are visually distinct
- the UI matches the project type inferred from context
- no existing architecture was unnecessarily replaced

If the `@google/design.md` CLI is available, run:

```bash
npx @google/design.md lint DESIGN.md

---
version: alpha
name: Whovencroft's Foundation
description: A reusable base DESIGN.md for Roll for Uptime and its setting adaptations. Defines the core visual system — typography, color tokens, spacing, and component rules — plus named per-theme overrides for Facility 404, The Realm, Dusty Trails, and the Blank template. The system favors clarity, readable density, strong hierarchy, and durable implementation tokens.
colors:
  primary: "#0F172A"
  primary-muted: "#1E293B"
  secondary: "#334155"
  tertiary: "#7C3AED"
  accent: "#F59E0B"
  neutral: "#F8FAFC"
  surface: "#FFFFFF"
  surface-muted: "#F1F5F9"
  surface-raised: "#E2E8F0"
  surface-inverse: "#020617"
  on-primary: "#F8FAFC"
  on-accent: "#111827"
  on-surface: "#0F172A"
  on-muted: "#475569"
  on-inverse: "#E2E8F0"
  success: "#166534"
  warning: "#B45309"
  error: "#B91C1C"
  info: "#2563EB"
  focus: "#2563EB"
  border-subtle: "#CBD5E1"
  border-strong: "#64748B"
theme-overrides:
  facility404:
    accent: "#14b8a6"
    accent-dark: "#0d9488"
    tertiary: "#14b8a6"
    description: "Cyberpunk SOC. Teal accent replaces violet. Surface-inverse HUD panels read as terminal screens."
  theRealm:
    accent: "#a855f7"
    accent-dark: "#9333ea"
    tertiary: "#a855f7"
    description: "High fantasy. Purple accent replaces violet (shifted warmer). Amber is used for active quest prompts."
  dustyTrails:
    accent: "#d97706"
    accent-dark: "#b45309"
    tertiary: "#d97706"
    description: "Western frontier. Amber-orange accent. Surface-inverse HUD reads as campfire-lit scoreboards."
  blank:
    accent: "#6366f1"
    accent-dark: "#4f46e5"
    tertiary: "#6366f1"
    description: "Generic template. Indigo accent. Neutral vocabulary. Starting point for new settings."
typography:
  display-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: -0.03em
  headline-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 650
    lineHeight: 1.18
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: -0.01em
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  label-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: 0.02em
  label-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: 0.05em
  label-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0.08em
  code-md:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.01em
  code-sm:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: -0.01em
  stat-lg:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.02em
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  panel: 20px
  full: 9999px
spacing:
  none: 0px
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px
  page: 96px
  gutter: 24px
  content-max: 1200px
  reading-max: 760px
  touch-target-min: 44px
  grid-columns: 12
components:
  page-background:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    padding: "{spacing.lg}"
  app-shell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.panel}"
    padding: "{spacing.lg}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-muted:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  panel-inverse:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.on-inverse}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: "{spacing.touch-target-min}"
  button-primary-hover:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: "{spacing.touch-target-min}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: "{spacing.touch-target-min}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: "{spacing.touch-target-min}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: "{spacing.touch-target-min}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: "{spacing.touch-target-min}"
  nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 10px
  nav-item-idle:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-muted}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 10px
  link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tertiary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 0px
  status-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  status-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  status-neutral:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  code-block:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.on-inverse}"
    typography: "{typography.code-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  data-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-muted}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  game-hud-panel:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.on-inverse}"
    typography: "{typography.body-md}"
    rounded: "{rounded.panel}"
    padding: "{spacing.md}"
  game-stat:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.on-primary}"
    typography: "{typography.stat-lg}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  focus-ring:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 4px
---

# Whovencroft Foundation DESIGN.md

## Overview

This file defines the visual system for **Roll for Uptime** and its setting adaptations. It is the design constitution for all four built-in themes and for any new settings created from the Blank template.

The core style is **structured, readable, quiet, and technical**. Interfaces should feel like a useful control surface: grounded, legible, and ready to be extended. The system avoids visual noise, excessive animation, decorative clutter, and fake depth.

The base layer is intentionally setting-neutral. Each theme adaptation changes the smallest useful set of tokens — primarily `accent` and `tertiary` — while preserving the full typography system, spacing scale, component behavior, and accessibility requirements. This means a new setting can be created by writing a `ThemeConfig` object and choosing an accent color, without touching layout or component code.

The default emotional target is:

- **calm**, not sterile
- **precise**, not cold
- **dense**, but still readable
- **game-capable**, without looking like a generic fantasy UI
- **developer-friendly**, without feeling like raw admin chrome

Project-specific adaptation rule:

1. Keep the typography and spacing scale unless the project has a strong reason to diverge.
2. Change `accent` and `tertiary` first when establishing a new setting identity.
3. Change component behavior prose before inventing new component tokens.
4. Keep accessibility, focus states, and readable contrast as hard requirements.
5. Treat this file as the design source of truth for agents, contributors, and future refactors.

---

## Colors

The palette is built around a deep slate foundation, high-readability surfaces, and restrained accent colors. It works for both application UI and game-adjacent interfaces.

- **Primary (#0F172A):** Deep slate used for primary actions, navigation anchors, important headers, and strong UI structure. Shared across all themes.
- **Primary Muted (#1E293B):** A softer dark slate for hover states, HUD blocks, sidebars, and dense panels.
- **Secondary (#334155):** Utility slate for secondary hierarchy, neutral statuses, quiet controls, and supporting structure.
- **Tertiary (#7C3AED):** Violet used for links, selected states, and identity accents. **Overridden per theme** — see the RFU Theme Adaptations section.
- **Accent (#F59E0B):** Amber used sparingly for calls to attention, special actions, active highlights, and warnings that are not errors. **Overridden per theme.**
- **Neutral (#F8FAFC):** Default page background. Near-white but softer than pure white.
- **Surface (#FFFFFF):** Primary card and form surface.
- **Surface Muted (#F1F5F9):** Secondary surface for grouped controls, subtle panels, and inactive navigation.
- **Surface Raised (#E2E8F0):** Raised or pressed utility surface, especially for secondary buttons.
- **Surface Inverse (#020617):** Dark surface for code blocks, game HUD panels, terminal-like views, and high-contrast inspection panels. In session view, this is the chat area background — it should read as a distinct operational space regardless of the active theme.
- **On colors:** `on-primary`, `on-accent`, `on-surface`, `on-muted`, and `on-inverse` define readable text over their paired backgrounds.
- **Status colors:** `success`, `warning`, `error`, and `info` are reserved for state communication, not branding.
- **Focus (#2563EB):** Used for keyboard focus, active outline behavior, and accessibility-visible selection. Shared across all themes.

Application rule:

- A normal screen should use `neutral` as the page background, `surface` for main cards, `primary` for the main action, and `on-surface` for text.
- A dense tool screen may use `surface-muted` as the outer shell and `surface` for individual panels.
- The session chat area uses `surface-inverse`, `primary-muted`, and the theme `accent`. Text must remain readable.
- Never use `error`, `warning`, or `success` as decorative brand colors.
- Do not allow more than one high-saturation accent to compete for attention in the same region.

---

## RFU Theme Adaptations

Roll for Uptime ships with four named themes. Each theme overrides `accent` and `tertiary` and defines a complete vocabulary of game labels. The core typography, spacing, shape, and component structure remain unchanged across all themes.

When the active theme changes, the following update site-wide: all flavor labels (operator, incident, session, supervisor, etc.), the `accentColor` CSS variable, and the AI GM name and description. The structural design tokens (`primary`, `surface`, `neutral`, etc.) do not change.

### Facility 404 — Cyberpunk SOC

**Accent:** Teal `#14b8a6` / `#0d9488`

Facility 404 is the default theme. The setting is a cyberpunk security operations center. Players are security analysts clocking in for shifts. The Shift Supervisor narrates and adjudicates. The AI GM is ARIA (Automated Response & Incident AI).

The teal accent replaces the base violet. Surface-inverse HUD panels should read as terminal screens or monitoring dashboards. Monospaced typography for callsigns, IDs, and roll results reinforces the operational register.

| Label field | Value |
|---|---|
| Game name | Roll for Uptime |
| Setting | Facility 404 / F-404 |
| Player | Operator / Operators |
| GM | Shift Supervisor |
| Skills | Skills |
| XP | XP |
| Incident | Incident / Incidents |
| Session | Session / Sessions |
| Join / Leave | Clock In / Clock Out |
| Status | On Shift / Off Shift |
| Commendation | Commendation |
| AI GM | ARIA |
| Default job title | Security Analyst |

Design notes for this theme: prefer compact, information-dense panels over decorative layouts. Status chips should lean toward the operational vocabulary — "Active Incident", "On Shift", "Resolved". The teal accent is the only warm color on most screens; use it for active states, roll results, and the AI GM label. Avoid purple or amber in this theme unless they carry a specific meaning.

### The Realm — High Fantasy

**Accent:** Purple `#a855f7` / `#9333ea`

The Realm is a high fantasy setting. Players are adventurers on quests. The Game Master narrates. The AI GM is The Oracle (Ancient voice of fate and story).

The purple accent shifts the base violet slightly warmer and more saturated. Surface-inverse HUD panels should read as ancient stone or arcane interfaces, not modern terminals. Amber (`#F59E0B`) is available for active quest prompts, selected abilities, and turn indicators — it pairs well with the purple without competing.

| Label field | Value |
|---|---|
| Game name | Roll for the Realm |
| Setting | The Realm / Realm |
| Player | Adventurer / Adventurers |
| GM | Game Master |
| Skills | Ability / Abilities |
| XP | XP |
| Incident | Quest / Quests |
| Session | Adventure / Adventures |
| Join / Leave | Join the Party / Return to Town |
| Status | In the Field / At the Inn |
| Commendation | Honor / Honors |
| AI GM | The Oracle |
| Default job title | Wandering Adventurer |

Design notes for this theme: the purple accent is close to the base tertiary, so the visual shift from the base system is subtle. The key differentiation is vocabulary and the warmer saturation of the accent. Avoid teal entirely in this theme. The amber base accent token can be used for active turn prompts and quest-like calls to action without overriding the theme accent.

### Dusty Trails — Western Frontier

**Accent:** Amber-orange `#d97706` / `#b45309`

Dusty Trails is a western frontier setting. Players are gunslingers riding jobs. The Marshal narrates. The AI GM is The Narrator (Voice of the frontier).

The amber-orange accent is the warmest of the four themes. It replaces both the base violet tertiary and the base amber accent with a single unified warm tone. Surface-inverse HUD panels should read as weathered scoreboards, wanted posters, or campfire-lit ledgers. Monospaced typography for reputation values and draw results reinforces the frontier register.

| Label field | Value |
|---|---|
| Game name | Roll for Dusty Trails |
| Setting | The Frontier / Frontier |
| Player | Gunslinger / Gunslingers |
| GM | Marshal |
| Skills | Trade / Trades |
| XP | Rep (Reputation) |
| Incident | Job / Jobs |
| Session | Ride / Rides |
| Action | Move |
| Roll | Draw |
| Join / Leave | Ride Out / Head Back |
| Status | On the Trail / In Town |
| Commendation | Badge / Badges |
| AI GM | The Narrator |
| Default job title | Drifter |

Design notes for this theme: the amber-orange accent is strong enough to carry the identity on its own. Do not add a second accent color. Status chips should use the standard semantic tokens (success, warning, error) rather than trying to match the frontier palette — the semantic meaning must remain clear. The `Rep` label replaces XP in all stat displays; use `game-stat` typography for reputation values.

### Blank — Generic Template

**Accent:** Indigo `#6366f1` / `#4f46e5`

Blank is the starting point for new settings. It uses neutral vocabulary throughout. The Game Master narrates. The AI GM is The GM (Your game master).

The indigo accent is close to the base violet but slightly more blue-shifted, giving it a clean, uncommitted feel. This theme is intentionally underdressed — it should not look like any specific genre. When a new setting is being built from Blank, the first design decision is always the accent color, which should be chosen to match the genre and tone of the new setting.

| Label field | Value |
|---|---|
| Game name | Roll for It |
| Setting | The Setting / Setting |
| Player | Character / Characters |
| GM | Game Master |
| Skills | Skill / Skills |
| XP | XP |
| Incident | Event / Events |
| Session | Session / Sessions |
| Join / Leave | Join / Leave |
| Status | Active / Inactive |
| Commendation | Award / Awards |
| AI GM | The GM |
| Default job title | Adventurer |

Design notes for this theme: the Blank template is intentionally minimal. When building a new setting from it, update the accent color first, then the vocabulary. Do not add decorative visual elements until the setting identity is established. The typography, spacing, and component tokens should remain unchanged from the base system until the new setting has a clear reason to diverge.

### Adding a New Theme

To add a fifth theme:

1. Add a new `ThemeConfig` entry to `server/theme.ts` with a complete vocabulary.
2. Choose an accent color that is visually distinct from the existing four: teal (Facility 404), purple (The Realm), amber-orange (Dusty Trails), and indigo (Blank).
3. Add a `theme-overrides` entry to this DESIGN.md YAML front matter with the new accent and a one-line description.
4. Add a named section to this RFU Theme Adaptations section with the vocabulary table and design notes.
5. Apply the accent color to the admin theme panel preset card.

The accent color is the primary identity signal for a theme. Everything else — typography, spacing, layout, component structure, and semantic status colors — should remain shared.

---

## Typography

Typography should be practical before expressive. The system uses a sans-serif family for most UI and a monospaced family for code, stats, logs, telemetry, and structured values.

Primary text uses **Inter** or the nearest available system sans. Code and numeric readouts use **JetBrains Mono** or the nearest available monospaced font.

Hierarchy:

- **Display and headline tokens** are for landing pages, major views, game menu titles, and document headers.
- **Body tokens** are for normal UI copy, descriptions, labels with explanation, help text, and readable documentation.
- **Label tokens** are for buttons, tabs, navigation, chips, badges, and compact controls.
- **Code tokens** are for code blocks, logs, configuration examples, command snippets, IDs, and structured data.
- **Stat tokens** are for game stats, counters, resource values, timers, and dashboards where numbers need immediate recognition.

Rules:

- Use `body-md` as the default reading size.
- Use `body-sm` only for supporting information, not for core instructions.
- Use `label-md` or `label-sm` for metadata, status chips, and compact UI.
- Use uppercase labels only when the text is short.
- Do not use more than two font families in a project unless the project has a strong brand reason.
- Do not mix too many weights in one screen. Most screens should rely on 400, 650, and 700.
- For game menus, favor clear labels over decorative fantasy type.
- For coding and agent tools, preserve monospaced typography for commands, logs, paths, IDs, metrics, and diffs.
- Callsigns, roll results, XP/Rep values, and operator IDs should always use `code-sm` or `stat-lg` regardless of the active theme.

Implementation notes:

- If Inter is unavailable, use `system-ui` or the platform default.
- If JetBrains Mono is unavailable, use `ui-monospace`.
- Preserve line height. The typography tokens are designed to support long reading and dense UI without crowding.

---

## Layout

The layout system uses an 8px base rhythm, with a 4px half-step and a 2px micro-step for fine alignment. Most project layouts should be grid-based, panel-based, or card-based.

Base layout principles:

- Use `spacing.md` as the standard internal padding for compact components.
- Use `spacing.lg` as the standard padding for cards and panels.
- Use `spacing.xl` between major groups on standard screens.
- Use `spacing.section` between large content sections.
- Use `spacing.reading-max` for long-form text.
- Use `spacing.content-max` for dashboards, landing pages, and app shells.
- Use `spacing.touch-target-min` as the minimum interactive target height.

Desktop layout:

- Prefer a maximum content width of `content-max`.
- Use 12 columns for complex dashboards and landing pages.
- Keep dense tools aligned to clear vertical and horizontal axes.
- Use sidebars for persistent navigation only when the project has enough sections to justify them.
- Avoid full-width text lines. Long text should use `reading-max`.

Mobile layout:

- Collapse multi-column layouts into one column.
- Preserve the same component order unless the project requires a mobile-specific flow.
- Use larger tap areas and avoid dense horizontal controls.
- Keep the primary action visible but not intrusive.

Game UI layout:

- HUD panels should avoid covering critical play space.
- Menus should favor predictable zones: command list, target list, actor status, help text, confirmation area.
- Combat or tactical timelines should remain visually distinct from command menus.
- Use consistent spatial placement for recurring controls, especially Attack, Abilities, Items, Escape, Confirm, and Back.
- Do not move core controls between screens without a strong mechanical reason.
- The session view uses a three-zone layout: left sidebar (players), center (chat/messages), right or bottom (input and skill selector). This structure should be preserved across all themes.

Agent and tool layout:

- Separate input, current state, output, and logs.
- Keep destructive actions visually separated from normal actions.
- Use status chips and compact telemetry only where they reduce ambiguity.
- Give long-running processes a visible state region rather than burying state in logs.

---

## Elevation & Depth

Depth should be functional, not decorative. This system prefers tonal separation, border contrast, spacing, and grouping before heavy shadows.

Preferred hierarchy tools:

1. background color shift
2. border or divider
3. spacing and grouping
4. typographic weight
5. subtle shadow only when needed

Use tonal layers:

- `neutral` for page background
- `surface-muted` for grouped background regions
- `surface` for readable content cards
- `surface-raised` for controls or selected utility regions
- `surface-inverse` for code, HUD, console, and inspection panels

Depth rules:

- Cards may sit on muted or neutral backgrounds without strong shadows.
- Dense dashboards should use borders and panels instead of layered shadows.
- Game HUD panels may use dark inverse surfaces, but should avoid muddy transparency unless the underlying scene remains readable.
- Modal dialogs should clearly separate from the rest of the interface through contrast, spacing, and focus management.
- Tooltips should be visually lightweight and should never obscure the control they explain.

Avoid:

- heavy drop shadows on every card
- stacked glass effects without a readability reason
- low-contrast panels that require the user to guess boundaries
- floating buttons that compete with primary workflows
- glow effects unless they indicate focus, magic, selection, or active state

---

## Shapes

The shape language is moderately rounded and practical. Corners should soften the interface without making it toy-like.

- `rounded.none`: use for code gutters, table grid edges, pixel-aligned game elements, and strict dividers.
- `rounded.xs`: use for tiny affordances, icons in boxes, and small inline controls.
- `rounded.sm`: use for compact chips, table cells, and small cards.
- `rounded.md`: use for buttons, inputs, tabs, and most interactive controls.
- `rounded.lg`: use for cards, panels, grouped regions, and tool surfaces.
- `rounded.xl`: use for hero panels, marketing cards, and large content modules.
- `rounded.panel`: use for game HUD panels, app shells, large modals, and major containers.
- `rounded.full`: use for chips, pills, avatars, counters, timeline markers, and focus indicators.

Rules:

- Do not mix sharp and soft corners randomly in the same view.
- Interactive controls should usually use `rounded.md`.
- Large containers should usually use `rounded.lg` or `rounded.panel`.
- Circular or pill shapes should mean status, identity, count, selection, or compact action.
- Game UI may use stronger shapes, but should still map shape to function.

---

## Components

Components should be boring in the best way: predictable, legible, and hard to misuse. Use the component tokens as defaults, then extend them only when the project has a recurring need.

### Page Background

Use `page-background` for normal app screens, docs pages, and general project views. It should establish a soft base and keep text readable.

### App Shell

Use `app-shell` for the outer frame of web apps, dashboards, and agent tools. It should contain navigation, current context, and primary content.

### Cards and Panels

Use `card` for the main readable content unit.

Use `card-muted` for secondary groups, inactive states, filters, side information, and supporting controls.

Use `panel-inverse` for terminal-style areas, code review regions, inspection views, game HUD blocks, and high-contrast overlays. In the session view, the entire chat area uses `panel-inverse` regardless of the active theme.

Card rules:

- A card should represent one coherent concept.
- Do not nest cards more than two levels deep.
- Prefer clear headings over decorative card art.
- Put the most important value or action near the top-left in left-to-right layouts.

### Buttons

Use `button-primary` for the most important action on the screen.

Use `button-secondary` for normal actions that are not the main commitment.

Use `button-accent` for special actions, active turn prompts, quest-like affordances, or high-attention but non-dangerous actions. In themed contexts, the accent button color will reflect the active theme accent.

Use `button-danger` only for destructive actions.

Button rules:

- A screen should normally have one primary action.
- Use clear verbs: Save, Continue, Equip, Attack, Cast, Generate, Run, Stop.
- Avoid vague verbs like Submit when a more precise action exists.
- Destructive buttons should not sit immediately beside safe primary actions without spacing or confirmation.
- Hover states should increase clarity, not introduce a new visual identity.
- In game contexts, use the theme vocabulary for action buttons: "Clock In" not "Join", "Draw" not "Roll" in Dusty Trails, etc.

### Inputs

Use `input` for text fields, search boxes, command fields, and filter controls.

Input rules:

- Labels should be visible unless the field is extremely obvious.
- Helper text should clarify format or consequence, not repeat the label.
- Error states should state the fix, not only the problem.
- Search inputs should be placed before results and filters.

### Navigation

Use `nav-item-active` for the current section and `nav-item-idle` for available inactive sections.

Navigation rules:

- Active state must be visible through both color and position or shape.
- Do not rely on color alone.
- Keep navigation labels stable across sessions.
- Navigation labels should use the active theme vocabulary: "Incidents" in Facility 404, "Quests" in The Realm, "Jobs" in Dusty Trails, "Events" in Blank.

### Links

Use `link` for inline links and secondary navigation in text-heavy interfaces.

Link rules:

- Links should describe the destination or action.
- Do not style normal body text like links.
- Links should not compete with primary buttons.
- In documentation, links should remain visibly distinct from body text.

### Status Chips

Use `status-success`, `status-warning`, `status-info`, and `status-neutral` to communicate state.

Status rules:

- Use success for completed, healthy, ready, valid, or passed.
- Use warning for blocked, needs review, risky, stale, or partially complete.
- Use error for failed, invalid, destructive, missing, or unsafe.
- Use info for running, selected, queued, or informational states.
- Use neutral for idle, unknown, archived, or not applicable states.
- Status chip labels should use the active theme vocabulary: "On Shift" / "Off Shift" in Facility 404, "In the Field" / "At the Inn" in The Realm, "On the Trail" / "In Town" in Dusty Trails, "Active" / "Inactive" in Blank.

### Code Blocks

Use `code-block` for commands, logs, scripts, configuration, examples, and technical instructions.

Code block rules:

- Use monospaced typography.
- Preserve indentation.
- Avoid wrapping commands in a way that changes meaning.
- Provide copy affordances when practical.
- Keep code blocks visually distinct from prose.

### Data Cells

Use `data-cell` for metrics, compact tables, IDs, resource values, timestamps, and structured metadata.

Data rules:

- Align comparable numbers.
- Use monospaced typography for tabular values.
- Do not hide units.
- Do not use color alone for state. Pair with label, icon, or text.

### Game HUD Panel

Use `game-hud-panel` for RPG command menus, actor status blocks, enemy info windows, tactical panels, dialogue overlays, and combat helper text. In Roll for Uptime, the session chat area and player sidebar use `game-hud-panel` tokens.

Game HUD rules:

- Keep player actions visually grouped.
- Keep actor stats visible when they affect the current decision.
- Avoid decorative frames that reduce available reading area.
- Target selection should be obvious and reversible.
- Confirmation prompts should be visually distinct from normal action lists.
- Timeline markers should preserve ordering and current actor emphasis.
- The HUD area should feel like a distinct operational space from the rest of the UI, regardless of the active theme.

### Game Stat

Use `game-stat` for HP, MP, TP, SP, turn count, cooldown, resource pools, and tactical values. In Roll for Uptime, use `game-stat` for XP/Rep values, skill levels, and roll totals.

Game stat rules:

- Use consistent stat abbreviations.
- Place current value before max value unless the game genre convention requires otherwise.
- Use color only as a reinforcement, not as the only meaning.
- Large changing values should not cause layout shift.
- The XP label should reflect the active theme: XP in most themes, Rep in Dusty Trails.

### Focus Ring

Use `focus-ring` to represent visible keyboard focus, selected object outline, timeline focus, target reticle emphasis, and accessibility focus.

Focus rules:

- Focus must be visible on all interactive controls.
- Do not remove focus outlines without replacing them.
- Focus and selection can be related, but they are not the same state.
- In game UI, focus should show what will activate if the player confirms.

---

## Do's and Don'ts

### Do

- Do keep this file in the project root as `DESIGN.md`.
- Do treat the YAML front matter as the source of exact implementation values.
- Do treat the Markdown sections as the source of design intent and usage rules.
- Do change tokens deliberately instead of scattering one-off styles through the project.
- Do preserve readable contrast for body text, buttons, chips, and HUD elements.
- Do keep controls large enough to use comfortably.
- Do use a single visual hierarchy for a screen before adding decorative styling.
- Do give game UI the same accessibility care as web UI.
- Do keep logs, code, stats, and IDs monospaced.
- Do use status colors only for state.
- Do make destructive actions visually distinct and harder to trigger accidentally.
- Do adapt the palette per theme by changing `accent` and `tertiary` first.
- Do define new component tokens only when a pattern appears repeatedly.
- Do keep project-specific rules in this file when they affect visual implementation.
- Do use the active theme vocabulary in all labels, buttons, and status chips.
- Do add a new section to the RFU Theme Adaptations section when adding a new theme.

### Don't

- Don't use placeholder colors in implementation code when this file defines a token.
- Don't invent new spacing values for every screen.
- Don't let animation compensate for unclear layout.
- Don't use tiny text for important instructions.
- Don't use color as the only indicator of state.
- Don't overuse `accent`.
- Don't use `error` for anything except real error or destructive state.
- Don't mix unrelated visual metaphors in the same project.
- Don't make game HUD frames so ornate that they harm readability.
- Don't make dashboards look like raw spreadsheets unless that is the actual product goal.
- Don't hide critical process state inside logs only.
- Don't create multiple competing primary actions on one screen.
- Don't add shadows, glows, glass effects, or gradients unless they communicate hierarchy or state.
- Don't duplicate this file into variants without naming the variant and explaining the reason.
- Don't hardcode Facility 404 vocabulary in shared components. All flavor text must come from the active theme context.
- Don't change `primary`, `neutral`, `surface`, or `surface-inverse` between themes. These are structural tokens shared by all settings.

---

## Validation and Maintenance

Run a structural check after editing this file:

```bash
npx @google/design.md lint DESIGN.md
```

Export Tailwind v3 tokens when the project uses Tailwind v3:

```bash
npx @google/design.md export --format json-tailwind DESIGN.md > tailwind.theme.json
```

Export Tailwind v4 theme variables when the project uses Tailwind v4:

```bash
npx @google/design.md export --format css-tailwind DESIGN.md > theme.css
```

Compare two versions before accepting a design-system change:

```bash
npx @google/design.md diff DESIGN.md DESIGN-v2.md
```

Suggested project workflow:

1. Copy this file to the project root as `DESIGN.md`.
2. Rename `name` to the project identity.
3. Rewrite the Overview for the specific project.
4. Change only the smallest useful set of color tokens (start with `accent` and `tertiary`).
5. Add or remove component prose based on actual project UI.
6. Run the linter.
7. Use this file as required context for any coding agent, designer, or contributor working on UI.

For agent-driven implementation, give the agent this instruction:

```text
Read DESIGN.md before changing UI. Use the YAML front matter for exact token values. Use the Markdown sections for layout, component behavior, and project-specific intent. Do not introduce one-off styles unless the design file lacks a needed pattern. When a new recurring pattern is needed, update DESIGN.md first. When working on Roll for Uptime, read the RFU Theme Adaptations section before touching any label, color, or vocabulary in the UI.
```
