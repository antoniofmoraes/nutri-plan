# CLAUDE.md — Instructions for Claude Code

You (Claude Code) have been handed a design redesign. **Read `README.md` first** — it contains the complete design spec.

## What this folder is

A high-fidelity redesign of the meal-planning app, originally produced as an HTML prototype. The prototype lives in `reference/` for visual reference only. **Do not copy the JSX from `reference/` directly into the codebase** — it's vanilla React via Babel-standalone, not the app's stack.

## What to do

1. **Read `README.md` end-to-end** before writing any code. Pay special attention to:
   - §3 Design Tokens (colors, type, spacing, radii, shadows)
   - §5 Component Library (button variants, etc.)
   - §6 Screens (per-screen layouts)
   - §11 shadcn/ui mapping suggestions
   - §14 Out of scope (the app is a **tool**, not a coach — no tracking, no streaks, no water counter)

2. **Adapt to the existing codebase.** The app is described as React + Tailwind + shadcn/ui. Use those existing primitives — don't re-implement what shadcn already provides. Override styles with the design tokens from §3.

3. **Open `reference/index.html` in a browser** to see the design in motion. The prototype is fully interactive — try the day-view editing, the meal-card variants, the week views, the meal selector tree, etc. Behavior shown there is the source of truth for interactions.

4. **Implement in phases** if the redesign is large. Suggested order:
   1. Tokens + typography + global CSS variables → install Google Fonts (Space Grotesk, JetBrains Mono, Instrument Serif)
   2. Layout shell: sidebar + mobile drawer + main container
   3. Component primitives: Button, Card, Input, Badge, Chip, Tabs, Day tabs, Dialog, Toast
   4. Macro visualization components (Ring + Bars + Numerals)
   5. Auth screens
   6. Dashboard
   7. Plans list + Plan detail (day view first, then week views)
   8. Foods
   9. Presets
   10. Shopping lists + detail

5. **Match every micro-detail.** Numbers always in mono with `tabular-nums`. Eyebrows are uppercase mono. The accent dot in `PORTIO.` is `--accent`. The active sidebar item is **solid `--ink`** background, never the accent color. Cheat meals get the full `--accent` background badge. Etc. — see README §3 and §7.

6. **Don't add new content.** If a screen feels empty, that's a design choice — solve with composition, not by inventing copy, charts, or sections that aren't in the spec. The previous version felt utilitarian *because* it had too much; less is the goal.

7. **Keep Portuguese copy verbatim.** Don't paraphrase. If the codebase uses i18n keys, extract the exact strings.

8. **Variations** — the prototype exposes three viz/layout variants per surface (macro viz, meal cards, week view). These are author-facing decisions for the user to make later. **Default to: ring (macros) / list (meals) / table (week)**. Don't ship a viz switcher in production unless asked.

## What NOT to do

- ❌ Don't pull the prototype's `reference/*.jsx` files into the app — they're for reference only.
- ❌ Don't reinstate the old tracking features (weight, water, streaks, achievements).
- ❌ Don't introduce new colors. The macro palette (`--m-cal/pro/carb/fat`) is **only** for data-viz, never for UI chrome.
- ❌ Don't use the `tweaks-panel.jsx` — that's an authoring tool, not part of the product.
- ❌ Don't add motivational copy, badges, gamification, or coachy nudges. Tool, not coach.

## Questions to ask the user upfront

Before starting implementation, confirm:

1. Is shadcn/ui already installed, and which version? (Components have evolved.)
2. Is dark mode wired (e.g. via `next-themes`)? The design supports it — see README §3.2.
3. Are the Google Fonts already loaded somewhere, or should I add the link in the root layout?
4. Should the alternate palettes (Moss / Cobalt / Ink) be configurable by users at runtime, or is Ember the only one to ship?
5. Should the macro-viz / meal-card / week-view variants be configurable in settings, or am I picking one default each?
6. Is there an existing i18n setup, or should I keep strings inline as Portuguese literals for now?
