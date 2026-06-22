# Divsigner UI Revamp — Design Spec

**Date:** 2026-06-22
**Status:** Approved for planning

## 1. Purpose & Goals

Re-skin and re-architect the Divsigner editor UI to:

1. Adopt the **Divsigner Design System** (claude.ai/design project `cffb6e7e…`) for all
   visual styling — dark, glassy, purple-forward, tactile.
2. Restructure the editor chrome to the **wireframe architecture**: a top nav, a
   Photoshop-style collapsible right pane, and a chip-based prompt area.

**Sources of truth (do not mix them up):**

- **Visual style / appearance of every element** → the Divsigner Design System (tokens
  + component CSS).
- **Layout, position, and panel behavior** → the wireframes in `wireframes/`.

**Non-goal:** No changes to the generation engine, providers, history persistence,
export pipeline, styles/backgrounds catalogs, or any other behavior. This is a
chrome reskin + restructure only. All existing features are preserved.

## 2. Visual Language (from the Design System)

Port the design-system tokens into `src/index.css`, replacing the current
orange / sharp-corner theme.

| Token group | Replaces today's | New value |
|---|---|---|
| Page floor | `--color-bg: #0A0A0A` | `--bg-app: #07060C` (ink-0) |
| Surfaces | flat `surface-*` | glass surfaces `--glass-1/2/3` + blur |
| Accent | orange `#FF7605` / `#6B57EE` | purple `#7D3CFF` (purple-500) with glow |
| Radii | `0 / 2 / 4 / 6px` (sharp) | `6 / 10 / 14 / 18 / 24 / 32 / pill` (rounded) |
| UI font | Archivo / Inter | **Space Grotesk** |
| Mono font | JetBrains Mono | **JetBrains Mono** (unchanged) — used for buttons, labels, chips, code |
| Buttons | flat accent-fill | tactile **emboss** primary, neutral-emboss secondary, ghost |
| Focus | thin ring | purple focus glow (`--ring` + accent soft) |

Space Grotesk and JetBrains Mono are already self-hosted in `index.css`; no new font
loading. The signature page atmosphere (`.ds-canvas` radial purple aurora over ink)
is applied to the app root.

The full token set to port: `tokens/colors.css`, `tokens/typography.css`,
`tokens/spacing.css`, `tokens/effects.css`, `tokens/base.css`. The Google-Fonts
`@import` from `tokens/fonts.css` is **not** ported (fonts are self-hosted).

### 2.1 Design-System Primitives

Build a small set of TS/React primitives in `src/components/ui/` that reproduce the
design-system component CSS exactly (porting the `.dvg-*` CSS into one shared
stylesheet, with typed wrappers):

`Button` (primary/secondary/ghost/danger, sm/md/lg, iconLeft/iconRight, loading,
fullWidth), `IconButton` (neutral/ghost/accent, sm/md/lg), `Input`, `Select`,
`Textarea`, `Switch`, `Tag`, `Badge`, `Card`, `Dialog`.

Existing panes (StylesPane, BackgroundsPane, SettingsPanel, HistoryList, CodeEditor)
are reskinned to use these primitives and the new tokens; their internal logic is
unchanged.

## 3. Layout Architecture (from the wireframes)

Three regions: **top nav**, **canvas + right pane** (middle row), **prompt area**
(bottom). Root carries the `.ds-canvas` atmosphere.

### 3.1 Top Nav (glass bar, `--nav-h` 64px)

- **Left:** logo mark (`assets/logo-mark.svg`, purple gradient rounded square) ·
  **New** · **Import** · **Settings**
- **Right:** **History** · **Export**
- Error toasts/inline error remain available (reskinned).

Nav action mapping:

| Item | Behavior (existing handler) |
|---|---|
| New | Reset focus to the "new" slide / fresh canvas (`setFocus({kind:"new"})`, switch to full view) |
| Import | Import an existing HTML poster via file picker (`onImportHtml`) |
| Settings | Toggle the Settings panel (`showSettings`) |
| History | Switch the center region to the list/grid view (`view = "list"`, `HistoryList`) |
| Export | Export the focused design — small menu: PNG (`handleExport`) / HTML (`handleDownload`); disabled when no focused design |

"Full page" view is the default canvas; **History is the former "list" view** (there is
no separate Full/List toggle — History is the list).

### 3.2 Right Pane (Photoshop-style collapsible inspector)

Anchored to the right edge of the middle row. Sections, in order:

1. **Edit HTML** — the CodeEditor for the focused design.
2. **Properties** — Batch (variant count), Resolution (aspect ratio), Background Color
   (color + opacity).
3. **Styles** — StylesPane (browse/select/import styles).
4. **Assets** — manage assets attached for the current prompt.
5. **BG** — BackgroundsPane (animated background catalog).
6. **Info** — generation prompt/preferences + the model's live thinking/output.

**States (per wireframes):**

- **Collapsed (default):** a narrow vertical **icon rail** on the far right. Each
  section is an icon. A bottom toggle button switches Expand/Collapse.
- **Collapsed + hovered:** hovering the rail reveals a floating labeled menu listing
  the section names (and the Expand button) beside the rail.
- **Collapsed + section open:** clicking a rail icon opens an **overlay panel to the
  left of the rail** with a header (section title + ✕ close). The icon rail stays
  visible on the right edge; the panel floats over the canvas. Only one section open
  at a time; the active icon is highlighted.
- **Expanded:** the pane docks as a wider column that **resizes the canvas** (canvas
  shrinks). Sections render as an **accordion list** with `+`/`−` toggles that expand
  inline; a **Collapse** button at the bottom returns to the collapsed rail.

Icon set (Lucide-style, matching wireframes): terminal (Edit HTML), pencil-in-square
(Properties), aperture (Styles), inbox (Assets), image (BG), info (Info), panel
toggle (Expand/Collapse).

Default state on load: **collapsed**, no section open.

### 3.3 Section content detail

- **Edit HTML:** existing CodeEditor bound to the focused design's HTML
  (`editorValue` / `handleEditorChange`). When no design is focused, show the existing
  empty-state message.
- **Properties:**
  - *Batch* → `Select` bound to `count` (1–4).
  - *Resolution* → `Select` bound to `aspectRatio`, labeled like `1:1 (1080 x 1080)`
    using `ASPECT_RATIOS`.
  - *Background Color* → color swatch + hex `Input` + opacity `Input` (e.g. `FFFFFF`
    / `100%`). **Wired** (see §4.1).
- **Styles:** existing StylesPane, reskinned, with selection closing back as today.
- **Assets:** lists assets currently attached to the prompt (`pendingAssets`) with
  remove; an "Add asset" control opening the file picker (reusing
  `onAttachAsset`). (Vision references stay attachable from the prompt `+` menu.)
- **BG:** existing BackgroundsPane, reskinned; only meaningful when a design is
  focused (same guard as today).
- **Info:** **Wired** (see §4.2).

### 3.4 Prompt Area (bottom)

Reworked `PromptBar`:

- **Textarea** — prompt input. Placeholder switches by mode (new vs iterate). Enter
  (no shift) triggers generate/iterate when valid (unchanged).
- **`+` attach** — existing attach menu (vision reference / asset).
- **Chips** (mono, design-system `Tag`/chip styling), each opens its control:
  - *ratio* chip → aspect-ratio dropdown (mirrors Properties → Resolution)
  - *batch* chip → count dropdown (mirrors Properties → Batch)
  - *style* chip → opens the Styles section/pane
  - *background* chip → opens the BG section/pane
- **Bottom-right cluster:** **Enhance** · **Model dropdown** · **Generate**.
  - *Enhance* — existing `onEnhancePrompt` (disabled until prompt + API key).
  - *Model dropdown* — selects `config.model` (and persists via `updateConfig`);
    options from the active provider's model list.
  - *Generate* — the existing contextual primary action: Generate / Iterate / Stop /
    Retry, styled as the tactile primary (Stop = danger, Retry = warning).
- **Compare strip** — a thin bar **just above** the prompt area, shown only when the
  focused job has >1 variant; toggles `compare`.

Attached-asset/reference chips (image thumbnails) continue to render above the
textarea as today, reskinned.

## 4. New Wired Behavior

### 4.1 Background Color (Properties)

New app state: `bgColor` (hex string, default `#FFFFFF`) and `bgOpacity` (0–100,
default `100`). Composited as a solid color layer **behind the rendered poster** in
the canvas/preview (behind any animated BG and the poster content), so it shows
through transparent areas. It is a canvas/preview backdrop control; it does not alter
the generated HTML. Persisted alongside other editor prefs is optional (default
in-memory is acceptable for v1; document the choice in the plan).

### 4.2 Info Panel

Read-only panel for the focused job. Shows:

- **Prompt & preferences used:** the focused job's `prompt`, preset/style name,
  aspect ratio, variant count (from the focused job, via `jobs`/`focus`).
- **Model thinking / output:** the live streamed text for the focused variant. The
  generation hook (`useGeneration`) already streams; the plan must confirm exactly
  which field exposes thinking vs. raw output (e.g. `variant.rawHtml` and/or a
  thinking buffer) and surface whatever is available, updating live during streaming.

If no design/job is focused, the panel shows an empty state.

## 5. Components Touched

| File | Change |
|---|---|
| `src/index.css` | Replace theme tokens with ported design-system tokens; keep self-hosted `@font-face`; add `.ds-canvas` atmosphere; reskin shared utilities |
| `src/components/ui/*` | New DS primitives (Button, IconButton, Input, Select, Textarea, Switch, Tag, Badge, Card, Dialog) + shared `.dvg-*` stylesheet |
| `src/App.tsx` | New three-region layout; nav actions; right-pane state machine (collapsed/hover/open/expanded + active section); bgColor/bgOpacity state; Info wiring |
| `src/components/TopNav.tsx` | New — glass nav (New/Import/Settings · History/Export) |
| `src/components/RightPane.tsx` (+ section subcomponents) | New — icon rail, hover flyout, overlay panel, expanded accordion |
| `src/components/PromptBar.tsx` | Rework — textarea, chips, Compare strip, Enhance/Model/Generate cluster |
| `src/components/PropertiesPane.tsx`, `InfoPane.tsx`, `AssetsPane.tsx` | New section bodies |
| `src/components/StylesPane.tsx`, `BackgroundsPane.tsx`, `SettingsPanel.tsx`, `HistoryList.tsx`, `CodeEditor.tsx`, `PosterCanvas.tsx` | Reskin to new tokens/primitives; PosterCanvas also renders the bg-color backdrop |
| `public/` logo | Use the design-system `logo-mark.svg` (purple gradient mark) for the nav |

Logo: add the design-system `assets/logo-mark.svg` to `public/` and reference it from
the nav (replacing `/logo.png`).

## 6. Out of Scope / YAGNI

- No new generation/provider features; model dropdown only switches the existing
  `config.model`.
- No persistence redesign; history/styles/assets storage unchanged.
- No mobile/responsive redesign beyond what the desktop wireframes specify.
- Background Color persistence across reloads is optional for v1.

## 7. Success Criteria

1. App matches the design-system look (purple/glass/tactile, Space Grotesk +
   JetBrains Mono, rounded radii, glow focus).
2. Top nav, collapsible right pane (all four wireframe states), and chip prompt area
   match the wireframe layout/behavior.
3. Background Color visibly composites behind the poster; Info shows real
   prompt/preferences and live model thinking/output.
4. All pre-existing features still work (generate, iterate, stop, retry, multi-variant
   compare, styles, backgrounds, assets, import, history, export, enhance, settings,
   code edit).
5. `npm run build` (tsc + vite) and existing tests pass.
