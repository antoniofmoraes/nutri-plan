# PORTIO — Design Handoff

A complete UI redesign of a weekly meal-planning web app, ready to implement in your existing **React + Tailwind + shadcn/ui** codebase.

> ⚠️ **About these files**: The `.html` / `.jsx` files in `reference/` are **design references** built as a working HTML prototype. They are **not** production code to copy line-by-line. Your task is to recreate this design in your existing stack, using your established components (shadcn/ui), state management, routing, i18n and form patterns. Treat the prototype as a visual + behavioral spec.

---

## 1. Fidelity

**High-fidelity.** Exact colors, typography, spacing, radii, shadows, and interactions are all specified below and demonstrated in the prototype. Implement pixel-close while adapting to shadcn/ui primitives.

---

## 2. Brand & Identity

| | |
|---|---|
| **Name**          | **PORTIO** (Latin for *portion / ration*) |
| **Wordmark style**| Bold, all-caps, tight letter-spacing (`-0.02em`), with a single accent dot — `PORTIO.` (the `.` is rendered in `--accent`) |
| **Mark icon**     | Geometric circle with a wedge (a "portion" cut from a disc) — see `reference/icons.jsx` → `case "logo"` |
| **Tagline**       | *"Sua nutrição, em proporções exatas."* (Italic serif used as accent on the auth side) |
| **Tone**          | Precise · Confident · Minimal. Sober and tool-like. Never coachy, never gamified. |
| **Personality red lines** | No streaks, no badges, no motivational copy, no progress celebrations, no water-tracker UI. PORTIO is a *tool*, not a coach. |

---

## 3. Design Tokens

All tokens live as CSS custom properties in `reference/index.html` under `:root` and theme variants. Mirror these in your `tailwind.config` extension or a CSS layer.

### 3.1 Colors — Light mode (Ember palette, default)

```
--bg:          #f7f4ec   /* page background, warm off-white */
--paper:       #ffffff   /* sidebar, dialog, auth-form pane  */
--surface:     #ffffff   /* card surface                     */
--surface-alt: #efeadf   /* hover, table header, chip bg     */
--surface-2:   #f1ede2   /* alternate row tint               */
--ink:         #15140f   /* primary text                     */
--ink-2:       #2a281f   /* secondary text                   */
--muted:       #7a766a   /* muted/meta text                  */
--muted-2:     #a7a297   /* placeholder, disabled            */
--line:        #e2dccd   /* default borders                  */
--line-2:      #d6cfbd   /* stronger borders                 */
--accent:      #ff4d2e   /* signal orange-red                */
--accent-ink:  #ffffff   /* text on accent                   */
--accent-soft: #ffe6df   /* accent tint background           */
--good:        #2f7a3a
--warn:        #c08b1a
--danger:      #c4341c
```

### 3.2 Colors — Dark mode

```
--bg:          #0e0d0a
--paper:       #16140f
--surface:     #1a1813
--surface-alt: #221f18
--surface-2:   #1e1c15
--ink:         #f1ede2
--ink-2:       #d7d3c5
--muted:       #8a8576
--muted-2:     #5d5a4f
--line:        #2a2720
--line-2:      #3a362c
--accent:      #ff4d2e   /* unchanged */
--accent-soft: #2b1a13   /* dark tint */
```

### 3.3 Macro data-viz colors (NEVER used in UI chrome — only in charts/numerals)

```
--m-cal:  #ff4d2e   /* calories — orange   */
--m-pro:  #4a3df0   /* protein  — violet   */
--m-carb: #e6b22b   /* carbs    — amber    */
--m-fat:  #1f9b8f   /* fat      — teal     */
--m-fib:  #7a766a   /* fiber    — neutral  */
```

### 3.4 Alternate palettes

User-selectable via tweaks panel — the only thing that changes is `--accent` (and the soft tint). Keep these available:

| ID       | Accent      | Use case |
|----------|-------------|----------|
| `ember`  | `#ff4d2e`   | Default — bold, confident |
| `moss`   | `#2d6a3a`   | Calmer, more food-coded |
| `cobalt` | `#1a3df0`   | Technical, cool |
| `ink`    | `#15140f`   | Monochrome — no chromatic accent |

### 3.5 Typography

```
--font-sans:  "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
--font-mono:  "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
--font-serif: "Instrument Serif", ui-serif, Georgia, serif;
```

Google Fonts imports:
- Space Grotesk: 300, 400, 500, 600, 700
- JetBrains Mono: 400, 500, 600
- Instrument Serif: 400, 400 italic (used **only** for auth-page accent phrase)
- IBM Plex Sans + IBM Plex Mono (alternate type pairing — for tweaks panel)

**Type rules — non-negotiable:**
- All UI uses `--font-sans`.
- **Every number** (kcal, grams, percentages, times, dates, counters, IDs) uses `--font-mono` with `font-variant-numeric: tabular-nums`. This is the "technical/precise" signature of the brand.
- Eyebrows / micro-labels / table headers use `--font-mono`, uppercase, `letter-spacing: 0.06–0.08em`, 11–12px, weight 500, color `--muted`.
- Serif is reserved for the single italic emphasis on the auth side. Do not introduce it elsewhere.

**Type scale:**

| Token | Size | Weight | Line | Letter | Usage |
|-------|------|--------|------|--------|-------|
| `h1`  | 32px | 700    | 1.1  | -0.02em| Page titles |
| `h2`  | 22px | 600    | 1.25 | -0.01em| Card titles |
| `h3`  | 16px | 600    | 1.3  | 0      | Inline section |
| body  | 14px | 400    | 1.45 | 0      | Default |
| small | 13px | 400    | 1.4  | 0      | Secondary |
| meta  | 11.5px | 500  | 1.4  | 0      | mono — labels, captions |
| eyebrow | 11px | 500  | 1    | 0.1em  | mono uppercase |

### 3.6 Spacing scale (use 4-px grid)

`4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 28, 32, 40, 56, 80`

### 3.7 Border radii

```
--r-sm:  6px   /* badges, small chips         */
--r-md: 10px   /* buttons, inputs, selects    */
--r-lg: 14px   /* cards, dialogs              */
--r-xl: 22px   /* phone-bezel screen, rare    */
```

Inputs/buttons share `10px`; cards always `14px`. Avoid 4-corner pills (`9999px`) except for badges (uppercase mono tags) and progress bar tracks.

### 3.8 Shadows / elevation

```
--shadow-1: 0 1px 0 rgba(20,18,12,.04), 0 1px 2px rgba(20,18,12,.04);
            /* default — cards at rest          */
--shadow-2: 0 1px 0 rgba(20,18,12,.04), 0 8px 24px -10px rgba(20,18,12,.12);
            /* hover                            */
--shadow-3: 0 1px 0 rgba(20,18,12,.04), 0 18px 40px -16px rgba(20,18,12,.18);
            /* dialog, popover, toast           */
```

Dark mode replaces these with darker, less subtle shadows (`rgba(0,0,0,.5)` / `.7`).

### 3.9 Motion

- **Hover** on cards/buttons: `transition: background .12s, border-color .12s, color .12s`
- **Active press**: `transform: translateY(0.5px)` on `:active`
- **Dialog enter**: 150ms `cubic-bezier(.3,.7,.4,1)` — fade + scale `.97 → 1`
- **Toast**: 180ms — fade + translateY 8→0
- **Drawer slide**: 180ms `cubic-bezier(.3,.7,.4,1)`
- **Bar/ring fills**: 300–350ms ease

Keep motion **purposeful**. No bouncing, no spring physics, no decorative animations.

---

## 4. Layout System

### 4.1 App shell

- Fixed left sidebar `256px`, full-height, sticky, `border-right: 1px solid var(--line)`, `background: var(--paper)`.
- Main area: flex-1, `max-width: 1152px` container, padding `32px 40px 80px`.
- **Mobile (≤900px):** sidebar hides, top bar appears (`56px`, hamburger left + wordmark), drawer slides in from left with backdrop.
- Page sections separated by `28px` vertical gap.

### 4.2 Sidebar internals

```
┌─────────────────────────────┐
│ [logo] PORTIO.       [v0.1] │  ← 22px padding, border-bottom
├─────────────────────────────┤
│  PLANEJAMENTO ← micro label │
│  [icon] Dashboard           │  ← nav items
│  [icon] Planos alimentares 3│     (active state: bg=--ink, fg=--bg)
│  [icon] Alimentos        24 │
│  [icon] Refeições prontas   │
│  [icon] Listas de compras   │
├─────────────────────────────┤
│ [DV] Daniel Vieira    [out] │  ← user row, border-top
│      daniel@portio.app      │
└─────────────────────────────┘
```

- Nav items: `padding: 10px 12px`, `border-radius: 10px`, gap `11px` between icon (18px) and label.
- Active state is solid `--ink` background, **not** an accent color. Hover is `--surface-alt`.
- Avatar is `36px` square (border-radius `10px`), `--ink` background, `--bg` text, mono initials.

---

## 5. Component Library

Map these to shadcn/ui primitives. Override styles to match tokens.

### 5.1 Button

| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| `pri`   | `--ink`         | `--bg`         | none           | Primary action in dialogs |
| `acc`   | `--accent`      | `--accent-ink` | none           | Page CTAs, "Criar/Novo" |
| `sec`   | `--surface`     | `--ink`        | `--line`       | Secondary, "Editar refeições" |
| `ghost` | transparent     | `--ink`        | none           | Icon buttons, menus |
| `danger`| transparent     | `--danger`     | `--line`       | Destructive secondary |

Sizes: `lg=44px`, default=`36px`, `sm=30px`, `xs=26px`. Border radius scales `10 / 10 / 8 / 6`. Gap between icon and label: 8/6/4px.

### 5.2 Card

`background: --surface; border: 1px solid --line; border-radius: 14px; padding: 22px` (or `16px` for `card-pad-sm`). Shadow `--shadow-1` at rest, `--shadow-2` on interactive hover. Cards are **never** colored — only the *content* inside is.

### 5.3 Input

`height: 40px; padding: 0 12px; border: 1px solid --line; border-radius: 10px; background: --surface`. Focus: `border-color: --ink` (no glow, no ring). Icon prefix: `padding-left: 38px`, icon at `left: 12px`, color `--muted`.

Label above input: `.label` class → mono, uppercase, 12px, `--muted`, `letter-spacing: 0.06em`, `margin-bottom: 6px`.

### 5.4 Badge / Chip

- **Badge** (status tag): mono, uppercase, 10.5px, weight 500, `letter-spacing: 0.08em`, `padding: 4px 8px`, `border-radius: 999px`. Variants: outlined (default), `solid`, `accent` (uses `--accent-soft` bg), `good`, `warn`, `cheat` (full `--accent` background).
- **Chip** (food tag): sans, 12.5px, `padding: 5px 9px 5px 10px`, `border-radius: 8px`, bg `--surface-alt`, border `--line`. Quantity in nested `.q` span: mono, 11px, `--muted`.

### 5.5 Tabs (segmented control)

Container `background: --surface-alt`, border `--line`, padding `3px`, gap `2px`. Active tab: `background: --surface`, shadow `--shadow-1`. Inactive: `color: --muted`, hover → `--ink`.

### 5.6 Day tabs (week selector)

7-column grid, gap `6px`. Each tab is its own card-like button (`border: 1px solid --line, background: --surface, radius: 10px, padding: 10px 8px`). Active state inverts: solid `--ink` bg, `--bg` fg. Date number rendered in mono below the day name.

### 5.7 Dialog

Backdrop `rgba(20,18,12,.45)`, padding `24px` viewport. Dialog `max-width: 480px` (or `640px` for `.lg`), border `--line`, radius `14px`, shadow `--shadow-3`. Three regions: header (title + description), body (gap `14px`), footer (border-top, `--surface` tint, `justify-content: flex-end`, gap `8px`).

### 5.8 Toast

Bottom-right, `gap: 10px` stack. Dark `--ink` background, `--bg` text, padding `12px 16px`, radius `10px`. Auto-dismiss 2.8s. Icon prefix tints green (`good`) or red-orange (`error`).

### 5.9 Avatar

Round `32px` (or `40px` `av-lg`). `background: --surface-alt`, border `1px solid --line`, mono initials, 11px, weight 600. Stacked avatars in list cards overlap by `-6px` with a `2px solid --surface-alt` border.

### 5.10 Macro Ring

Donut, default `220×220`. Stroke width `18px`, track `--surface-alt`. Three segments by kcal share: protein (`--m-pro`) → carb (`--m-carb`) → fat (`--m-fat`), in that order. Center stack: eyebrow "Calorias", then large mono number (30px, weight 600, `-0.02em`), then mono `de {target} kcal` (11px, `--muted`). Legend below: colored 8×8px square + label + grams (mono, `--muted`) + percent (mono, `--muted`, right-aligned 36px).

### 5.11 Macro Bars

Top: large kcal headline (32px mono) + percent right-aligned, with a 14px stacked horizontal bar (three segments) below, border `--line`, radius `8px`. Legend chips in mono, 11px, with 7×7 color squares. Then per-macro rows: label + value/target (mono) + 6px-height progress bar.

### 5.12 Macro Numerals

Minimal. Each macro = eyebrow (label) + huge mono numeral (30px) + tiny meta (percent + meta target) + 2px underline progress bar tinted by macro color. Separated by 1px `--line` divider, 16px padding.

---

## 6. Screens

Detailed in route order. The prototype is fully navigable in `reference/index.html` — open it for the source of truth on every screen.

### 6.1 `/login` — Login

- **Desktop:** Split, 1:1 grid. **Left:** form pane (max-width form `380px`, centered vertically, `56px 24px` outer padding). **Right:** dark `--ink` side panel with PORTIO mark top, headline mid (`44px h1` with italic serif accent on second line), nav micro-tags bottom. Large faint mono numeral `2200` decoration top-right (4% alpha, no purpose other than density).
- **Mobile:** form only, no side panel.
- **Fields:** Email (mail icon prefix), Password (lock icon prefix), Primary CTA "Entrar" (acc variant, 44px tall). Loading state: replaces label with `<spinner /> Entrando…`.
- **Footer link:** "Não tem conta? Cadastre-se" → `/register`.

### 6.2 `/register` — Register

Mirror of login — side panel on **left**, form on **right**. Fields: Nome (user icon), Email (mail), Senha (lock, hint *"Mínimo 6 caracteres."*), CTA "Criar conta". Footer "Já tem conta? Entrar".

### 6.3 `/` — Dashboard

**Header**:
- Eyebrow: `{weekday} · {date}` (mono uppercase).
- `h1`: "Olá, {firstName}." then sub-line "Aqui está sua semana." (18px, weight 500, `--muted`).
- Right: meal-plan dropdown (`.dd` select, mono not required).

**Day tabs** — 7-column grid (see §5.6). On mobile, abbreviate to single letters (`S T Q Q S S D`) and drop date number.

**Macros section** — single card, padding `0`. Header bar (border-bottom `--line`, `padding: 16px 22px`): left = eyebrow "Macros · {day}" + meta line; right = **viz selector** segmented tabs (`Anel | Barras | Números`). Body padding `22px`.

| Selection | Layout |
|-----------|--------|
| Anel      | 2-col grid: macro ring 240px left, 2×2 macro cards right |
| Barras    | Full-width stacked bar + per-macro progress rows |
| Números   | 2-col: numerals left, calorie distribution panel (`--surface-alt`) right |

Below 780px viewport → all collapse to single column.

**Meals section** — `h2` "Refeições de {day}" + meta count, right side = meal-card variant selector (`Lista | Timeline | Compacto`) + Editar CTA.

| Variant | Layout |
|---------|--------|
| Lista   | Stacked cards (each `card-pad-sm`). Header row: name + time + cheat badge + macro line; body: food chips wrapped (gap `6px`) |
| Timeline| Two-column with time rail (78px) on left: dot at time, vertical line connector. Card sits to the right. |
| Compacto| Single card, internal rows divided by `--line`. Per row: time (48px right-aligned, mono), name + comma-joined food list, kcal right-aligned. |

**Cheat meal** ("Refeição livre"): full `--accent` badge, body text "Refeição livre · macros não contabilizados.", no chips.

### 6.4 `/planos` — Plans List

**Header**: eyebrow "Coleção" + h1 + description (≤56ch, `--muted`) + accent CTA "Novo plano".

**Plan card** — 3-col responsive grid (`auto-fill, minmax(280px, 1fr)`, gap `14px`). Each card: padding `0`, two regions divided by `--line`.

- **Top region** (`padding: 22px`): row of [goal badge (tinted bg per goal) | star icon (filled `--accent` if main, ghost otherwise)]. Then plan name (h2 18px), then mono meta "`~{cal} kcal/dia · {N} refeições`".
- **Bottom region** (`background: --surface-alt; padding: 10px 14px`): mono macros chips left ("P · 165  C · 240  G · 70"), edit/delete ghost icon buttons right.
- Hover: shadow `--shadow-2`, cursor pointer (whole card opens detail).

**Goal badge tint colors** (transparent overlays at 14%):
- Manutenção → `--m-pro` (violet)
- Emagrecimento → `--m-cal` (orange)
- Ganho de Massa → `--m-fat` (teal)

**New plan dialog**: name, goal select, calories, then 3-col grid of P/C/G g inputs.

### 6.5 `/planos/:id` — Plan Detail

**Header**: back link "← PLANOS" (mono micro), h1 with optional gold-star, goal badge + mono meta line. Right side: `Semana | Dia` view toggle + "Editar refeições" secondary button.

**View = Dia**
- Day tabs.
- **Day totals card** (`card-pad-sm`): left = eyebrow + macro line; right = 4 mini-stats (kcal, P, C, G) each with eyebrow, big mono number, 60×3 progress bar tinted per macro.
- Then **EditMealCard** per slot — header row (name + time + cheat badge + macro line + "more" menu), body = editable food rows divided by `--line`, plus "Adicionar alimento" secondary CTA. Food row: name + macro meta + quantity input (90px, mono right-aligned, "g" suffix) + kcal calc (64px, mono) + delete X.
- "More" menu (popover, `card` with shadow `--shadow-3`, min-width 200px): "Marcar/Desmarcar como livre", "Copiar para outros dias".
- Cheat meal collapses body to "Esta refeição não conta nos macros do dia. [Desmarcar]".

**View = Semana** (desktop only — mobile auto-forces Dia)
- Variant tabs: `Tabela | Quadro | Compacto`.

| Variant  | Layout |
|----------|--------|
| Tabela   | Wide table, min-width 1000px, horizontal scroll. Row headers (160px, `--surface-alt` tint) = slot name+time. Column headers = day name + day totals (mono kcal). Cells: cheat badge, or first 3 food names + "+N", or "Add" dashed-border ghost button. |
| Quadro   | Horizontal day columns (`minmax(220px, 1fr)`), one per weekday. Each is a card with day header + meta + inner per-slot mini-cards (`--surface-alt` background, slot name + kcal value, body listing comma-joined food names). |
| Compacto | Dense grid: row per slot, 160px label column + 7 day columns. Each cell: kcal + 3 colored 3px-thin progress bars (P/C/F) showing % of target. No food names. |

### 6.6 Dialogs invoked from Plan Detail

- **Slots Manager** (`lg`): "Adicionar refeição" row (name input + time input + Add button), then list of existing slots — drag handle, name input, time input, up/down/delete icon buttons. Saves on confirm.
- **Add Food** (`lg`): tabs `Alimento | Refeição pronta`. Alimento tab: search input + scrollable food list (max 240px) where each row shows name + mono macros, selection highlights with `--surface-alt`; below = quantity input + calculated kcal preview. Preset tab: warn banner (warn-tinted) + scrollable preset list.
- **Copy meal**: 6-button grid (other days), each toggles selected. Selected = solid `--ink` button with check. Footer button shows count.

### 6.7 `/alimentos` — Foods

**Header**: eyebrow "Base de dados" + h1 + description + accent CTA.

**Search bar**: 40px input with search icon prefix + result count right (mono, "{N} de {total}").

**Desktop table**: card, `padding: 0`, header row tinted `--surface-alt`, headers mono uppercase. Columns: Nome (left, sans 13.5px weight 500), Porção (mono 12px `--muted`), kcal (mono 13px weight 600, `--m-cal`), P (mono 13 `--m-pro`), C (`--m-carb`), G (`--m-fat`), Fib (`--muted`), actions (ghost icons, right).

**Mobile cards** (`≤780px`): per-food card with name + portion top, edit/delete ghost icons top-right, then 4-col grid of mini-stats (eyebrow label + colored mono value).

**Food dialog**: name (2fr) + portion (1fr) row, then calories full-width, then 4-col grid of P/C/G/Fib.

### 6.8 `/refeicoes-prontas` — Preset Meals

**Header**: eyebrow "Templates" + h1 + description + accent CTA.

**Preset card**: full-width stacked, accordion-style. Collapsed = name + mono meta line (count · kcal · P/C/G) + apply/edit/delete ghost buttons. Expanded = `--surface-alt` body with per-food row (name + mini-macros + quantity + kcal) + "Adicionar alimento" secondary button.

### 6.9 `/listas-compras` — Shopping Lists

**Header** as usual + accent CTA.

**List card** (responsive grid, gap 14): badge ("Proprietário" accent, or "Convidado · {name}" outlined), trash ghost icon (owner only), then list name (h2 18px) + mono meta count line. Bottom region (`--surface-alt`): stacked 24px avatars overlapping (-6 margin, 2px border).

### 6.10 `/listas-compras/:id` — List Detail

**Header**: back link, h1 + role badge underneath. Right buttons: "Selecionar refeições" secondary with count badge (filled `--ink`), then either "Convidar" primary (owner) or "Sair da lista" danger (guest).

**Layout**: 2-col grid (1fr 320px, collapses ≤780). Left = items card (header eyebrow + count + Copiar ghost button), then either empty state or item rows: checkbox (`accent-color: --accent`) + name + mono qty/unit. Right = members card: per-member row (avatar 40px + name + mono email + role mono tag).

**Meal selector dialog** (`lg`): hierarchical tree, 3 levels (plan → day → slot). Plan rows white, day rows `--surface-alt` indented 32px, slot rows indented 56px with 16px square checkbox (accent fill when selected). Mono meta on each level.

**Invite dialog**: pill row containing mono URL + Copiar primary button. Below: expiration meta + "Revogar convite" danger xs.

### 6.11 `/listas-compras/aceitar/:token` — Accept Invite

Centered card, three states:
- Loading: spinner + "Aceitando convite…"
- Success: green check + "Convite aceito!" + redirect message
- Error: red X + message + "Voltar" button

### 6.12 `/404`

Centered card. Giant mono "404" (96px+), "Página não encontrada", "Voltar ao início" link.

---

## 7. Cross-cutting Patterns

- **Empty states**: card, centered, padded `48px 32px`. Soft tinted icon circle 56×56 with `--accent-soft` bg + accent foreground icon. Title h2-ish (19px weight 600), body `--muted` max-width 360px, primary CTA below.
- **Loading**: never use skeleton screens. Replace button label with `<spinner /> {VerbingPt}…`. Spinner is `16×16, border 1.5px currentColor, top-color transparent, 0.8s linear`.
- **Toasts**: success/error/info, bottom-right, 2.8s lifetime.
- **Destructive confirmations**: native `confirm()` is fine for the prototype; use a shadcn `<AlertDialog>` in production. Pattern: "Excluir este {item}?" → Cancel + danger "Excluir".
- **Form validation**: inline message below field, 12px `--danger`, `margin-top: 6px`. Invalid inputs get `border-color: --danger`. Messages always in Portuguese.
- **Hover scaling**: never. Use shadow + background only. Press: `translateY(0.5px)`.
- **Selection (lists)**: solid `--ink` background, `--bg` text. Not accent. Reserve accent for actions and brand moments.

---

## 8. Routing

```
/                                  → Dashboard
/login                             → Login
/register                          → Register
/planos                            → Plans list
/planos/:planId                    → Plan detail
/alimentos                         → Foods
/refeicoes-prontas                 → Presets
/listas-compras                    → Shopping lists
/listas-compras/:listId            → Shopping list detail
/listas-compras/aceitar/:token     → Accept invite
*                                  → 404
```

---

## 9. State / data model (sketch)

Existing schemas should map cleanly. Key types referenced:

```ts
type Food = { id; name; portion; cal; p; c; f; fib };
type MealItem = { foodId; qty };       // qty in grams
type Meal = { cheat: boolean; items: MealItem[] };
type Slot = { id; name; time };        // time as "HH:MM"
type Plan = {
  id; name;
  goal: "Emagrecimento" | "Manutenção" | "Ganho de Massa";
  target: { cal; p; c; f };
  main: boolean;
  slots: Slot[];
  week: Record<dayIdx 0..6, Record<slotId, Meal>>;
};
type Preset = { id; name; items: MealItem[] };
type ShoppingList = {
  id; name; ownerSelf;
  invitedBy?;
  selectedMeals; // count
  members: { name; email; role; initials }[];
  items: { name; qty; unit }[];   // aggregated
};
```

The prototype computes macros by `scaleFood(foodId, qty)` (linear scale off the 100g baseline) and `sumMacros(items)` — see `reference/data.jsx`.

---

## 10. i18n

All UI copy is Portuguese (pt-BR). Match exact phrasing from the prototype. If the existing codebase uses i18n keys, extract verbatim — translations are part of the design.

---

## 11. shadcn/ui mapping suggestions

| Prototype element | shadcn/ui |
|---|---|
| `Button` (variants) | `<Button>` with custom variants in `class-variance-authority` |
| `Card` | `<Card>` / `<CardContent>` — drop default padding, apply `card-pad-sm` (16px) on dense layouts |
| `Input` | `<Input>` — override focus ring to single border-color change |
| `Dialog` | `<Dialog>` — keep transitions but reduce duration to 150ms |
| `Tabs` (segmented) | `<Tabs>` styled as segmented; replace built-in indicator with bg-swap |
| `Toast` | `sonner` works — restyle to dark `--ink` background |
| Day tabs | Build as a `<ToggleGroup>` variant with grid layout |
| Macro Ring | Custom SVG component (do **not** pull in Chart.js / Recharts — the donut is 30 lines) |
| Macro Bars / Numerals | Plain divs + Tailwind |
| Tree (meal selector) | Hand-rolled accordion list; lucide-react `ChevronRight/Down` |
| Popover ("Mais" menu) | `<DropdownMenu>` |

---

## 12. Assets

- **No image assets** required. The design is entirely typographic + color + SVG-icon-based.
- **Icons**: 24-line custom stroke icons in `reference/icons.jsx` (1.6px stroke, 18px default). You may replace with `lucide-react` equivalents — they're visually very close (Lucide is 24×24, 2px stroke; tighten to 1.5px for parity). Map:
  - `dashboard` → LayoutDashboard
  - `plans` → BookOpen or CalendarRange
  - `foods` → Wheat or Utensils
  - `presets` → ListChecks
  - `shopping` → ShoppingCart
  - `flame, bolt, leaf, drop` (macro icons) → Flame, Zap, Wheat/Sprout, Droplet
  - All others have obvious Lucide matches.
- **Fonts**: Google Fonts — see §3.5.

---

## 13. Reference files

Open `reference/index.html` in a browser to see everything in motion. Browse the source in:

```
reference/
  index.html              ← entry, all CSS tokens + theme variants
  app.jsx                 ← root, routing, tweaks wiring
  data.jsx                ← mock data + macro helpers (scaleFood, sumMacros)
  ui.jsx                  ← atoms: Button, Card, Input, Dialog, Toast, Sidebar, etc.
  icons.jsx               ← custom icon set
  macro-viz.jsx           ← MacroRing / MacroBars / MacroNumerals / MacroCards
  screen-auth.jsx         ← Login + Register
  screen-dashboard.jsx    ← Dashboard + meal-card variants
  screen-plans.jsx        ← Plans list + new plan dialog
  screen-plan-detail.jsx  ← Plan detail (day + week views), all dialogs
  screen-foods.jsx        ← Foods table + form dialog
  screen-presets.jsx      ← Presets accordion
  screen-shopping.jsx     ← Shopping list + detail + meal selector tree
  tweaks-panel.jsx        ← Author-facing controls only — do NOT ship
```

The prototype uses React 18 inline JSX via Babel-standalone purely so it can run as a single static page. Your implementation should be a normal React app.

---

## 14. Out of scope (do not implement)

The brief explicitly excludes:
- Daily water tracker
- Weight / body metric tracking
- Progress streaks, achievements, gamification
- Coach-style suggestions, notifications, nudges
- Any feature that turns the app from a *tool* into a *coach*

If a future feature is proposed that crosses this line, push back.
