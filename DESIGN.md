## Contextual Autonomy Protocol

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
description: A reusable base DESIGN.md for software tools, game interfaces, dashboards, documentation sites, and agent-facing project UIs. It favors clarity, readable density, strong hierarchy, and durable implementation tokens.
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

This file defines a reusable base visual system for projects that need a clear, durable interface rather than a novelty skin. It is intended for:

- software tools and dashboards
- Godot game UI and RPG menus
- agent control panels and internal utilities
- documentation sites and knowledge systems
- project prototypes that need consistent visual direction before custom branding exists

The core style is **structured, readable, quiet, and technical**. Interfaces should feel like a useful control surface: grounded, legible, and ready to be extended. The system should avoid visual noise, excessive animation, decorative clutter, and fake depth.

Use this as the first-pass design layer for a project. When a project develops its own identity, fork this file and change the smallest number of tokens needed to create that identity.

The default emotional target is:

- **calm**, not sterile
- **precise**, not cold
- **dense**, but still readable
- **game-capable**, without looking like a generic fantasy UI
- **developer-friendly**, without feeling like raw admin chrome

Project-specific adaptation rule:

1. Keep the typography and spacing scale unless the project has a strong reason to diverge.
2. Change `primary`, `tertiary`, and `accent` first when changing identity.
3. Change component behavior prose before inventing new component tokens.
4. Keep accessibility, focus states, and readable contrast as hard requirements.
5. Treat this file as the design source of truth for agents, contributors, and future refactors.

## Colors

The palette is built around a deep slate foundation, high-readability surfaces, and restrained accent colors. It should work for both application UI and game-adjacent interfaces.

- **Primary (#0F172A):** Deep slate used for primary actions, navigation anchors, important headers, and strong UI structure.
- **Primary Muted (#1E293B):** A softer dark slate for hover states, HUD blocks, sidebars, and dense panels.
- **Secondary (#334155):** Utility slate used for secondary hierarchy, neutral statuses, quiet controls, and supporting structure.
- **Tertiary (#7C3AED):** Violet used for links, magical or unusual affordances, selected states, and project-specific identity accents.
- **Accent (#F59E0B):** Amber used sparingly for calls to attention, special actions, quest-like prompts, warnings that are not errors, and active highlights.
- **Neutral (#F8FAFC):** Default page background. It is near-white but softer than pure white.
- **Surface (#FFFFFF):** Primary card and form surface.
- **Surface Muted (#F1F5F9):** Secondary surface for grouped controls, subtle panels, and inactive navigation.
- **Surface Raised (#E2E8F0):** Raised or pressed utility surface, especially for secondary buttons and grouped affordances.
- **Surface Inverse (#020617):** Dark surface for code blocks, game HUD panels, terminal-like views, and high-contrast inspection panels.
- **On colors:** `on-primary`, `on-accent`, `on-surface`, `on-muted`, and `on-inverse` define readable text over their paired backgrounds.
- **Status colors:** `success`, `warning`, `error`, and `info` should be reserved for state communication, not branding.
- **Focus (#2563EB):** Used for keyboard focus, active outline behavior, and accessibility-visible selection.

Application rule:

- A normal screen should usually use `neutral` as the page background, `surface` for main cards, `primary` for the main action, and `on-surface` for text.
- A dense tool screen may use `surface-muted` as the outer shell and `surface` for individual panels.
- A game HUD screen may use `surface-inverse`, `primary-muted`, and `accent`, but text must remain readable.
- Never use `error`, `warning`, or `success` as decorative brand colors.
- Do not allow more than one high-saturation accent to compete for attention in the same region.

Project adaptation examples:

- **JRPG or fantasy interface:** Shift `tertiary` toward a world-specific magic color and use `accent` for active turn or selected ability states.
- **Agent dashboard:** Keep `primary` and `secondary` stable; use `info`, `warning`, and `success` to communicate process state.
- **Documentation site:** Reduce `tertiary` use to links and callouts; prioritize `on-surface` text and wide reading margins.
- **E-commerce or marketing UI:** Keep the palette but make `accent` the product highlight only when it has enough contrast.

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

Implementation notes:

- If Inter is unavailable, use `system-ui` or the platform default.
- If JetBrains Mono is unavailable, use `ui-monospace`.
- Preserve line height. The typography tokens are designed to support long reading and dense UI without crowding.

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

Agent and tool layout:

- Separate input, current state, output, and logs.
- Keep destructive actions visually separated from normal actions.
- Use status chips and compact telemetry only where they reduce ambiguity.
- Give long-running processes a visible state region rather than burying state in logs.

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

## Components

Components should be boring in the best way: predictable, legible, and hard to misuse. Use the component tokens as defaults, then extend them only when the project has a recurring need.

### Page Background

Use `page-background` for normal app screens, docs pages, and general project views. It should establish a soft base and keep text readable.

### App Shell

Use `app-shell` for the outer frame of web apps, dashboards, and agent tools. It should contain navigation, current context, and primary content.

### Cards and Panels

Use `card` for the main readable content unit.

Use `card-muted` for secondary groups, inactive states, filters, side information, and supporting controls.

Use `panel-inverse` for terminal-style areas, code review regions, inspection views, game HUD blocks, and high-contrast overlays.

Card rules:

- A card should represent one coherent concept.
- Do not nest cards more than two levels deep.
- Prefer clear headings over decorative card art.
- Put the most important value or action near the top-left in left-to-right layouts.

### Buttons

Use `button-primary` for the most important action on the screen.

Use `button-secondary` for normal actions that are not the main commitment.

Use `button-accent` for special actions, active turn prompts, quest-like affordances, or high-attention but non-dangerous actions.

Use `button-danger` only for destructive actions.

Button rules:

- A screen should normally have one primary action.
- Use clear verbs: Save, Continue, Equip, Attack, Cast, Generate, Run, Stop.
- Avoid vague verbs like Submit when a more precise action exists.
- Destructive buttons should not sit immediately beside safe primary actions without spacing or confirmation.
- Hover states should increase clarity, not introduce a new visual identity.

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
- In agent and developer tools, navigation should reflect workflow, not marketing categories.

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

Use `game-hud-panel` for RPG command menus, actor status blocks, enemy info windows, tactical panels, dialogue overlays, and combat helper text.

Game HUD rules:

- Keep player actions visually grouped.
- Keep actor stats visible when they affect the current decision.
- Avoid decorative frames that reduce available reading area.
- Target selection should be obvious and reversible.
- Confirmation prompts should be visually distinct from normal action lists.
- Timeline markers should preserve ordering and current actor emphasis.

### Game Stat

Use `game-stat` for HP, MP, TP, SP, turn count, cooldown, resource pools, and tactical values.

Game stat rules:

- Use consistent stat abbreviations.
- Place current value before max value unless the game genre convention requires otherwise.
- Use color only as a reinforcement, not as the only meaning.
- Large changing values should not cause layout shift.

### Focus Ring

Use `focus-ring` to represent visible keyboard focus, selected object outline, timeline focus, target reticle emphasis, and accessibility focus.

Focus rules:

- Focus must be visible on all interactive controls.
- Do not remove focus outlines without replacing them.
- Focus and selection can be related, but they are not the same state.
- In game UI, focus should show what will activate if the player confirms.

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
- Do adapt the palette per project by changing `primary`, `tertiary`, and `accent` first.
- Do define new component tokens only when a pattern appears repeatedly.
- Do keep project-specific rules in this file when they affect visual implementation.

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

### Validation and Maintenance

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
4. Change only the smallest useful set of color tokens.
5. Add or remove component prose based on actual project UI.
6. Run the linter.
7. Use this file as required context for any coding agent, designer, or contributor working on UI.

For agent-driven implementation, give the agent this instruction:

```text
Read DESIGN.md before changing UI. Use the YAML front matter for exact token values. Use the Markdown sections for layout, component behavior, and project-specific intent. Do not introduce one-off styles unless the design file lacks a needed pattern. When a new recurring pattern is needed, update DESIGN.md first.
```
