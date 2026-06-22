# Divsigner UI Revamp Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin Divsigner onto the Divsigner Design System (dark/glassy/purple/tactile) and restructure the editor into the wireframe architecture: top nav, a Photoshop-style collapsible right pane, and a chip-based prompt area — with no change to the generation engine.

**Architecture:** Port the design-system CSS tokens into `src/index.css`; build a set of design-system primitives in `src/components/ui/ds/` that reproduce the `.dvg-*` component CSS; then rebuild `App.tsx`'s three regions (TopNav, Canvas+RightPane, PromptBar) on those primitives. Existing panes (Styles/Backgrounds/Settings/History/Code) are reskinned in place; their logic is untouched. New wired behavior: Background Color edits the focused poster HTML; the Info panel surfaces the focused job's prompt/preferences + live `variant.thinking`/`variant.rawHtml`.

**Tech Stack:** React 19 + TypeScript, Vite 8, Tailwind v4 (`@theme` tokens in `index.css`), Vitest, self-hosted Space Grotesk + JetBrains Mono fonts.

**Spec:** `docs/superpowers/specs/2026-06-22-divsigner-ui-revamp-design.md`

**Sources of truth:** Visual styling = the Divsigner Design System (project `cffb6e7e-a3b6-449e-8a9d-be95430c371b`, read via DesignSync MCP — see the spec for exact token/component values, already captured below where needed). Layout/behavior = the PNGs in `wireframes/`.

---

## Conventions for every task

- Work on branch `ui-revamp-design-system` (already created).
- After each task: run `npm run build` (this is `tsc -b && vite build` — catches type + build errors) and `npm test` (vitest). Both must pass before commit.
- Commit at the end of each task with the message shown.
- Keep all existing behavior. If a reskin would change behavior, stop and flag it.
- Tailwind v4 reads color/font/radius tokens from the `@theme` block in `index.css`. Renaming a token (e.g. `--color-accent`) updates every `text-accent`/`bg-accent` utility automatically, so prefer updating tokens over editing every class.

---

## File Structure

**New files:**
- `src/components/ui/ds/ds.css` — all `.dvg-*` component CSS, ported verbatim from the design system, imported once.
- `src/components/ui/ds/Button.tsx`, `IconButton.tsx`, `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Switch.tsx`, `Tag.tsx`, `Badge.tsx`, `Card.tsx`, `Dialog.tsx` — typed React wrappers (no per-component `injectStyle`; CSS lives in `ds.css`).
- `src/components/ui/ds/index.ts` — barrel re-export.
- `src/components/TopNav.tsx` — glass top nav.
- `src/components/RightPane.tsx` — icon rail + hover flyout + overlay/expanded state machine; renders section bodies.
- `src/components/panes/PropertiesPane.tsx`, `InfoPane.tsx`, `AssetsPane.tsx` — new section bodies.
- `src/utils/bgColor.ts` — read/write a poster's background color+opacity in its HTML (pure, unit-tested).
- `src/utils/bgColor.test.ts` — unit tests for the above.
- `src/hooks/useModelList.ts` — extracted `/models` fetch+fallback (shared by SettingsPanel and the prompt-bar model dropdown).
- `public/logo-mark.svg` — design-system mark for the nav.

**Modified files:**
- `src/index.css` — replace `@theme`/`:root` tokens with ported design-system tokens; keep self-hosted `@font-face`; add `.ds-canvas`.
- `src/App.tsx` — new three-region layout; nav actions; right-pane state; bgColor wiring; Info data.
- `src/components/PromptBar.tsx` — textarea + chips + Compare strip + Enhance/Model/Generate.
- `src/components/ui/icons.tsx` — add rail/nav icons.
- `src/components/SettingsPanel.tsx` — consume `useModelList` (dedupe).
- `src/components/StylesPane.tsx`, `BackgroundsPane.tsx`, `SettingsPanel.tsx`, `HistoryList.tsx`, `CodeEditor.tsx`, `PosterCanvas.tsx` — reskin to tokens/primitives.

---

## Task 1: Port design-system tokens into `index.css`

**Files:**
- Modify: `src/index.css` (the `@theme` block ~110-143 and `:root` ~145-160; keep `@font-face` 1-104)
- Create: `public/logo-mark.svg`

The design system's source tokens (already retrieved) are the authority. Map them into Tailwind v4's `@theme` so utilities like `bg-bg`, `text-accent`, `rounded-lg` pick them up, and keep a `:root` for the raw scales/effects used by `ds.css` and inline styles.

- [ ] **Step 1: Replace the `@theme` block** in `src/index.css` with design-system-derived tokens:

```css
@theme {
  /* Surfaces / ink */
  --color-bg: #07060C;            /* ink-0 page floor */
  --color-surface: #110F1C;       /* ink-2 elevated */
  --color-surface-2: #181425;     /* ink-3 */
  --color-surface-3: #211C30;     /* ink-4 */
  --color-border: rgba(255,255,255,0.10);
  --color-border-strong: rgba(255,255,255,0.16);

  /* Accent (purple) */
  --color-accent: #7D3CFF;
  --color-accent-hover: #9456FF;
  --color-accent-soft: #AE7DFF;   /* light accent for text/labels */
  --color-secondary: #5BE1FF;     /* cyan info accent (was orange) */
  --color-secondary-hover: #22C3EA;

  /* Text */
  --color-text: #F5F3FB;
  --color-text-muted: #BEB8CF;
  --color-text-faint: #847E99;
  --color-success: #22D38A;
  --color-danger: #F23E63;
  --color-warning: #F5A623;
  --color-info: #9456FF;

  /* Rounded radii (design system) */
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;

  /* Fonts — Space Grotesk UI, JetBrains Mono mono */
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-sans: "Space Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

- [ ] **Step 2: Replace the `:root` block** with the design-system raw scales + effects that `ds.css` and inline styles consume. Paste the full token sets from the spec sources — i.e. the contents of `tokens/colors.css` (`--purple-*`, `--ink-*`, `--fg-*`, semantic accents, `--glass-*`, `--border-*`, `--accent-*`), `tokens/spacing.css` (`--space-*`, `--control-*`, `--nav-h`), `tokens/effects.css` (`--radius-*` incl. `--radius-xs/2xl/pill`, `--blur-*`, `--shadow-*`, `--glow-*`, `--glass-edge/shadow`, `--emboss-*`, `--ring`, `--grad-accent/glass`, transitions, `--ease-out-back`), and `tokens/typography.css` (`--text-*`, `--leading-*`, `--weight-*`, `--tracking-*`). Keep the existing `--ease-out-expo`, `--duration-*` aliases (still referenced by current utilities) — or map them onto the new ones.

> Retrieve exact values with the DesignSync MCP (`get_file` on `tokens/colors.css`, `tokens/spacing.css`, `tokens/effects.css`, `tokens/typography.css`, `tokens/base.css`) so nothing is transcribed by hand. They are reproduced in the brainstorming transcript / spec if the MCP is unavailable.

- [ ] **Step 3: Add the `.ds-canvas` atmosphere** (from `tokens/base.css`) and update `body` font to `var(--font-sans)` (already set). Add:

```css
.ds-canvas {
  min-height: 100%;
  background:
    radial-gradient(120% 80% at 15% -10%, rgba(125,60,255,0.18) 0%, rgba(125,60,255,0) 55%),
    radial-gradient(90% 70% at 100% 0%, rgba(91,225,255,0.07) 0%, rgba(91,225,255,0) 50%),
    var(--color-bg);
}
.eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--color-text-faint);
}
```

Keep the existing `.section-label`, `.scroll-thin`, `.focus-glow`, `.panel-enter`, `.menu-enter`, `.btn-tactile`, keyframes, etc. (they still work; visuals shift via tokens). Update `.accent-fill`/`--gradient-accent` to `--grad-accent` (the design-system gradient).

- [ ] **Step 4: Create `public/logo-mark.svg`** = the design system's `assets/logo-mark.svg` (purple-gradient rounded mark). Retrieve via DesignSync `get_file` `assets/logo-mark.svg` and write its contents to `public/logo-mark.svg`.

- [ ] **Step 5: Verify build + manual.** Run `npm run build` → PASS. Run `npm run dev`, confirm the app now renders on deep-ink purple background, Space Grotesk text, rounded corners. (Layout still old — that's expected.)

- [ ] **Step 6: Commit**

```bash
git add src/index.css public/logo-mark.svg
git commit -m "feat(ui): port Divsigner design-system tokens + atmosphere"
```

---

## Task 2: Design-system primitives (`src/components/ui/ds/`)

**Files:**
- Create: `src/components/ui/ds/ds.css`, `Button.tsx`, `IconButton.tsx`, `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Switch.tsx`, `Tag.tsx`, `Badge.tsx`, `Card.tsx`, `Dialog.tsx`, `index.ts`

Reproduce the design-system components. The DS sources use a runtime `injectStyle`; here, consolidate **all** their CSS into one `ds.css` imported from `index.ts`, and write thin typed TSX wrappers. **Copy the `.dvg-*` CSS verbatim** from the design-system component files (retrieve each via DesignSync `get_file` `components/forms/Button.jsx` etc., or use the copies in the spec transcript) so the look matches exactly.

- [ ] **Step 1: Create `ds.css`** containing the CSS blocks from: `Button.jsx`, `IconButton.jsx`, `Input.jsx` (incl. `.dvg-field*`), `Select.jsx`, `Textarea.jsx`, `Switch.jsx`, `Tag.jsx`, `Badge.jsx`, `Card.jsx`, `Dialog.jsx`. Import it once in `index.ts`:

```ts
import "./ds.css";
export * from "./Button";
export * from "./IconButton";
export * from "./Input";
export * from "./Select";
export * from "./Textarea";
export * from "./Switch";
export * from "./Tag";
export * from "./Badge";
export * from "./Card";
export * from "./Dialog";
```

- [ ] **Step 2: Write each wrapper** as a typed React component using the DS class names. Drop the `injectStyle` calls (CSS is global now). Example `Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children, variant = "primary", size = "md", iconLeft, iconRight,
  loading = false, fullWidth = false, className = "", disabled, type = "button", ...rest
}: ButtonProps) {
  const cls = ["dvg-btn", `dvg-btn--${variant}`, size !== "md" && `dvg-btn--${size}`,
    fullWidth && "dvg-btn--full", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} disabled={disabled || loading} {...rest}>
      {(variant === "primary" || variant === "danger") && <span className="dvg-btn__sheen" />}
      {loading ? <span className="dvg-btn__spin" /> : iconLeft}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </button>
  );
}
```

Mirror the same translation for `IconButton` (variant neutral/ghost/accent, size, `label`), `Input` (label/hint/error/icon, forwards `...rest`), `Select` (label/options/value/onChange, chevron svg), `Textarea` (label/mono/rows), `Switch` (label/checked/defaultChecked), `Tag` (variant/icon/onRemove), `Badge` (variant/dot), `Card` (variant/interactive/padding), `Dialog` (open/title/description/footer/onClose). Keep prop names identical to the DS source so behavior matches.

- [ ] **Step 3: Verify** `npm run build` → PASS (primitives compile; not yet used).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ds
git commit -m "feat(ui): add design-system primitives (Button, Input, Card, …)"
```

---

## Task 3: Add rail/nav icons

**Files:**
- Modify: `src/components/ui/icons.tsx`

The wireframe rail uses: terminal (Edit HTML), pencil-in-square (Properties), aperture (Styles), inbox (Assets), image (BG), info (Info), panel-toggle (Expand/Collapse). Nav uses history + sparkles (have `SparkleIcon`). `InfoIcon` exists.

- [ ] **Step 1:** Add missing icons following the existing `IconProps`/`<svg>` pattern in `icons.tsx` (24×24, `stroke="currentColor"`, Lucide paths): `TerminalIcon`, `PropertiesIcon` (pencil-in-square), `ApertureIcon`, `InboxIcon`, `ImageIcon`, `PanelToggleIcon`, `HistoryIcon`, `NewIcon` (plus or file-plus). Reuse `InfoIcon` for Info.
- [ ] **Step 2:** `npm run build` → PASS.
- [ ] **Step 3: Commit**

```bash
git add src/components/ui/icons.tsx
git commit -m "feat(ui): add rail and nav icons"
```

---

## Task 4: TopNav component + wire nav actions

**Files:**
- Create: `src/components/TopNav.tsx`
- Modify: `src/App.tsx` (replace `<header>` 373-421; add Export dropdown + New/History handlers)

Layout (wireframe): glass bar height `--nav-h`. Left: logo-mark · New · Import · Settings. Right: History · Export(dropdown PNG/HTML).

- [ ] **Step 1: Build `TopNav`** using the glass header recipe from the DS `TopNav.jsx` (background `var(--glass-1)`, `backdropFilter: var(--blur-md)`, `boxShadow: var(--glass-edge)`, `borderBottom: 1px solid var(--border-subtle)`). Props:

```tsx
interface TopNavProps {
  onNew: () => void;
  onImport: () => void;            // opens HTML file picker
  onToggleSettings: () => void;
  settingsActive: boolean;
  onHistory: () => void;           // switches center to list view
  historyActive: boolean;
  onExportPng: () => void;
  onExportHtml: () => void;
  canExport: boolean;
  error?: string | null;
}
```

Left cluster: `<img src="/logo-mark.svg" width=30 height=30 />` + three nav buttons (mono text, ghost treatment; active state for Settings/History). Right cluster: History button + an Export button that opens a small dropdown (reuse `src/components/ui/Dropdown.tsx` or a local menu) with **PNG** and **HTML** items, disabled when `!canExport`. Keep the inline `error` alert (reskin to danger tokens). Nav text buttons use `font-mono`, `--text-sm`.

- [ ] **Step 2: Wire in `App.tsx`.** Replace the `<header>` with `<TopNav … />`. Handlers:
  - `onNew`: `setFocus({ kind: "new" }); setView("full");` (and close any open right-pane section — see Task 5 state).
  - `onImport`: **fully move** the hidden HTML file `<input>` + `handleHtmlFile` from PromptBar into App in this task (keep the tree green between commits — don't leave a half-lifted flow). App keeps `htmlRef`, calls `.click()` on `onImport`, and `handleHtmlFile` calls the existing `handleImportHtml`. PromptBar's `onImportHtml` prop and Import button are removed here (Task 10 already assumes the nav owns Import).
  - `onToggleSettings`: existing `toggleSettings`.
  - `onHistory`: `setView(view === "list" ? "full" : "list")` (History toggles the list view; `historyActive = view === "list"`).
  - `onExportPng`/`onExportHtml`: call `handleExport`/`handleDownload` with the focused design's html + aspect. `canExport = Boolean(focusedDesign)`.

- [ ] **Step 3: Verify** build + dev: nav matches wireframe; History shows the list; Export menu exports the focused design; New resets to the empty slide.
- [ ] **Step 4: Commit**

```bash
git add src/components/TopNav.tsx src/App.tsx
git commit -m "feat(ui): glass top nav (New/Import/Settings · History/Export)"
```

---

## Task 5: Right pane state machine + icon rail

**Files:**
- Create: `src/components/RightPane.tsx`
- Modify: `src/App.tsx` (right-region rendering 453-529; add right-pane state)

Implements the four wireframe states. One section open at a time.

- [ ] **Step 1: Define state in `App.tsx`:**

```tsx
type Section = "html" | "properties" | "styles" | "assets" | "bg" | "info";
const [paneExpanded, setPaneExpanded] = useState(false);   // collapsed rail vs docked accordion
const [openSection, setOpenSection] = useState<Section | null>(null);
```

Remove the old `editorOpen`/`stylesPaneOpen`/`backgroundsPaneOpen` booleans (or derive them from `openSection`). Keep `showSettings` (Settings is a nav panel, not a rail section).

- [ ] **Step 2: Build `RightPane`** with props for state + section bodies:

```tsx
interface RightPaneProps {
  expanded: boolean;
  openSection: Section | null;
  onToggleExpanded: () => void;
  onOpenSection: (s: Section | null) => void;
  sections: { id: Section; label: string; icon: ReactNode; body: ReactNode }[];
}
```

Behavior:
  - **Collapsed (default):** render the vertical icon rail (DS `IconButton`-style buttons, active = accent) on the far right. Bottom: a `PanelToggleIcon` button = Expand. On `mouseenter` of the rail, reveal a floating labels flyout listing section names + an "Expand" row (absolute-positioned to the left of the rail, glass surface). Clicking an icon → `onOpenSection(id)`.
  - **Collapsed + section open:** render an **overlay panel to the left of the rail** (absolute/fixed, glass, `--shadow-lg`), header = section label + `✕` (`onOpenSection(null)`); body = that section's `body`. Rail stays visible; active icon highlighted. Panel floats over the canvas (does not resize it).
  - **Expanded:** render a docked column (e.g. width 320, glass, `borderLeft`) that participates in the flex row so the **canvas shrinks**. Body = an accordion: each section is a header row with `+`/`−`; the open one expands inline. Bottom: a **Collapse** button (`onToggleExpanded`). Clicking a header toggles `openSection`.

Match wireframe spacing/labels exactly (Edit HTML, Properties, Styles, Assets, BG, Info; Expand/Collapse).

- [ ] **Step 3: Wire sections in `App.tsx`.** Build the `sections` array mapping each id to its body:
  - `html` → existing `CodeEditor` block (the `focusedDesign ? <CodeEditor …> : <empty state>` from 473-482).
  - `properties` → `<PropertiesPane … />` (Task 6).
  - `styles` → existing `<StylesPane … />`.
  - `assets` → `<AssetsPane … />` (Task 7).
  - `bg` → existing `<BackgroundsPane … />` (guard: if no `focusedDesign`, show "Focus a design" empty state instead).
  - `info` → `<InfoPane … />` (Task 8).
  Render `<RightPane expanded={paneExpanded} openSection={openSection} … sections={sections} />` as the right element of the middle flex row. Remove the old separate panel blocks; Settings stays as its own panel toggled from the nav.

- [ ] **Step 4: Verify** all four states match the five wireframe PNGs (default, hovered, html-open, properties-open, expanded+properties). Build + dev.
- [ ] **Step 5: Commit**

```bash
git add src/components/RightPane.tsx src/App.tsx
git commit -m "feat(ui): Photoshop-style collapsible right pane"
```

---

## Task 6: Background-color HTML helper + Properties pane

**Files:**
- Create: `src/utils/bgColor.ts`, `src/utils/bgColor.test.ts`, `src/components/panes/PropertiesPane.tsx`
- Modify: `src/App.tsx` (pass props)

Background Color edits the **focused poster's HTML** background (spec §4.1). Implement pure read/write helpers first (TDD), then the UI.

- [ ] **Step 1: Write failing tests** `src/utils/bgColor.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readBgColor, writeBgColor } from "./bgColor";

describe("bgColor", () => {
  it("reads hex+opacity from a body background style", () => {
    const html = `<body style="background:#112233">x</body>`;
    expect(readBgColor(html)).toEqual({ hex: "112233", opacity: 100 });
  });
  it("defaults when no background is present", () => {
    expect(readBgColor(`<body>x</body>`)).toEqual({ hex: "FFFFFF", opacity: 100 });
  });
  it("writes a new background onto body, preserving other styles", () => {
    const out = writeBgColor(`<body style="margin:0">x</body>`, "FF0000", 50);
    expect(out).toContain("margin:0");
    expect(readBgColor(out)).toEqual({ hex: "FF0000", opacity: 50 });
  });
  it("round-trips opacity via rgba", () => {
    const out = writeBgColor(`<body>x</body>`, "00FF00", 25);
    expect(readBgColor(out)).toEqual({ hex: "00FF00", opacity: 25 });
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/utils/bgColor.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement `src/utils/bgColor.ts`.** Represent color as `background: rgba(r,g,b,a)` on the poster's root background element. `writeBgColor` sets/replaces the `background` declaration in that element's `style` attribute (creating `style` if absent; preserving other declarations). **Target selection:** prefer the `<body>` tag; if the generated HTML is a fragment with no `<body>` (generated posters may be fragments), fall back to the first top-level element/wrapper, and if none exists, wrap the content so the color still applies. `readBgColor` parses it back to `{ hex, opacity }` (hex uppercase no `#`, opacity 0–100), defaulting to `{ hex: "FFFFFF", opacity: 100 }` when absent. Accept both `#rrggbb` and `rgba()` forms when reading. Use regex/string ops (no DOM) so it runs under jsdom and SSR-free. Add a test for the no-`<body>` fragment case.

- [ ] **Step 4: Run** the tests → PASS.

- [ ] **Step 5: Build `PropertiesPane.tsx`** using DS primitives:

```tsx
interface PropertiesPaneProps {
  count: number; onCountChange: (n: number) => void;
  aspectRatio: AspectRatioKey; onAspectChange: (r: AspectRatioKey) => void;
  bg: { hex: string; opacity: number } | null;  // null = no focused design
  onBgChange: (hex: string, opacity: number) => void;
}
```

  - *Batch* → DS `Select` (options 1–4) bound to `count`.
  - *Resolution* → DS `Select` bound to `aspectRatio`; option labels like `1:1 (1080 x 1080)` built from `ASPECT_RATIOS`.
  - *Background Color* → a row: native color `<input type="color">` swatch (styled), a hex DS `Input`, and an opacity DS `Input` (e.g. `100%`). Disabled when `bg === null`. Calls `onBgChange` on change.

  Use section/eyebrow labels (`Batch`, `Resolution`, `Background Color`) per wireframe.

- [ ] **Step 6: Wire in `App.tsx`.** Derive `bg` from the focused design: `const bg = focusedDesign ? readBgColor(focusedDesign.html) : null;`. `onBgChange(hex,opacity)` → `writeBgColor(focusedDesign.html, hex, opacity)` then push via the focused-design update path (`setJobHtml(ref.jobId, …)` or `updateItem(ref.batchId, ref.index, …)` — same branching as `handleEditorChange`). Pass `count/onCountChange`, `aspectRatio/onAspectChange`.

- [ ] **Step 7: Verify** changing Background Color updates the rendered poster + the HTML in the code editor; build + tests pass.
- [ ] **Step 8: Commit**

```bash
git add src/utils/bgColor.ts src/utils/bgColor.test.ts src/components/panes/PropertiesPane.tsx src/App.tsx
git commit -m "feat(ui): Properties pane with poster background-color editing"
```

---

## Task 7: Assets pane

**Files:**
- Create: `src/components/panes/AssetsPane.tsx`
- Modify: `src/App.tsx` (pass props)

Surface assets attached to the current prompt (`pendingAssets`), with remove + add.

- [ ] **Step 1: Build `AssetsPane`:**

```tsx
interface AssetsPaneProps {
  assets: StoredAsset[];
  onAdd: () => void;            // opens asset file picker (reuse onAttachAsset flow)
  onRemove: (id: string) => void;
}
```

  Grid/list of asset thumbnails (DS `Card`/`Tag` styling) with a remove `IconButton`; an "Add asset" `Button` that triggers a hidden file `<input>` → `onAttachAsset(dataUrl, name)`. Empty state when none.

- [ ] **Step 2: Wire in `App.tsx`** with `pendingAssets`, an add handler (file → `handleAttachAsset`), and `onRemoveAsset`.
- [ ] **Step 3:** Build + dev verify; **Commit**

```bash
git add src/components/panes/AssetsPane.tsx src/App.tsx
git commit -m "feat(ui): Assets pane"
```

---

## Task 8: Info pane (wired)

**Files:**
- Create: `src/components/panes/InfoPane.tsx`
- Modify: `src/App.tsx` (pass focused job data)

Read-only. Shows the focused job's prompt/preferences + live `variant.thinking` / `variant.rawHtml`.

- [ ] **Step 1: Build `InfoPane`:**

```tsx
interface InfoPaneProps {
  info: {
    prompt: string;
    styleName: string;
    aspectRatio: string;
    count: number;
    thinking: string;   // variant.thinking (live)
    output: string;     // variant.rawHtml (live)
  } | null;
}
```

  Two blocks: **Prompt & preferences** (prompt text + a row of `Badge`/`Tag` for style, aspect, count) and **Model thinking / output** (mono, scrollable `<pre>` showing `thinking` then `output`, using the DS code-block recipe from `Canvas.jsx`: `background: rgba(7,6,12,0.6)`, `box-shadow: inset 0 0 0 1px var(--border-subtle)`, mono). Empty state when `info === null`.

- [ ] **Step 2: Wire in `App.tsx`.** Build `info` from the focused job/variant:

```tsx
const info = focusedJob && focusedVariant ? {
  prompt: focusedJob.prompt,
  styleName: allStyles.find(s => s.id === focusedJob.presetId)?.name ?? focusedJob.presetId,
  aspectRatio: focusedJob.aspectRatio,
  count: focusedJob.variants.length,
  thinking: focusedVariant.thinking,
  output: focusedVariant.rawHtml,
} : null;
```

  (`focusedJob`/`focusedVariant` already exist in App.) Updates live because `jobs` re-renders as tokens stream.

- [ ] **Step 3: Verify** during a generation the Info pane streams thinking/output; build + tests.
- [ ] **Step 4: Commit**

```bash
git add src/components/panes/InfoPane.tsx src/App.tsx
git commit -m "feat(ui): Info pane (prompt/preferences + live model thinking/output)"
```

---

## Task 9: Extract `useModelList` hook (dedupe model fetch)

**Files:**
- Create: `src/hooks/useModelList.ts`
- Modify: `src/components/SettingsPanel.tsx` (consume the hook)

Prep for the prompt-bar model dropdown so both call sites share one fetch+fallback (reviewer note: Anthropic has `supportsModelsEndpoint: false`).

- [ ] **Step 1: Extract** the model-list logic from `SettingsPanel.tsx` into `useModelList(config)` returning `{ models: string[]; loading: boolean; supportsEndpoint: boolean }`. Note (verified): SettingsPanel does **not** fetch `/models` directly — it obtains models via `onValidate()` → `validateApiKey(config)`, which returns `{ ..., models }`. Base the hook on `validateApiKey(config)` directly (run it in an effect keyed on `apiKey`/`providerId`/`customBaseUrl`/`def.supportsModelsEndpoint`; skip when `!apiKey || !def.supportsModelsEndpoint` and return `supportsEndpoint:false`).
- [ ] **Step 2: Refactor `SettingsPanel`** to consume `useModelList` (behavior identical).
- [ ] **Step 3: Verify** `npm test` + `npm run build` → PASS; Settings still lists models.
- [ ] **Step 4: Commit**

```bash
git add src/hooks/useModelList.ts src/components/SettingsPanel.tsx
git commit -m "refactor: extract useModelList hook shared by settings + prompt bar"
```

---

## Task 10: PromptBar rework (chips, Compare strip, Enhance/Model/Generate)

**Files:**
- Modify: `src/components/PromptBar.tsx`, `src/App.tsx` (pass model + compare props)

Rebuild PromptBar to the wireframe: textarea, `+` attach, chips (ratio/batch/style/background), and bottom-right Enhance · Model dropdown · Generate; a Compare strip just above.

- [ ] **Step 1: Extend PromptBar props** to add model + compare:

```tsx
// add to PromptBarProps:
model: string;
onModelChange: (m: string) => void;
modelOptions: string[];          // from useModelList; may be empty (manual)
modelLoading: boolean;
showCompare: boolean;            // focusedJob has >1 variant
compareActive: boolean;
onToggleCompare: () => void;
```

- [ ] **Step 2: Compare strip.** Above the textarea row, when `showCompare`, render a thin bar with a DS `Button`/toggle (`CompareIcon` + "Compare", active = accent). Reskin the existing attached ref/asset thumbnails row to DS `Tag`/`Card`.

- [ ] **Step 3: Chips row.** Replace the current control row. Chips use DS `Tag`/chip styling (mono):
  - ratio chip → opens the aspect `Dropdown` (label shows current ratio, e.g. `1:1`).
  - batch chip → opens the count `Dropdown` (label shows `count`).
  - style chip → `onBrowseStyles` (label = `Style {selectedStyle.name}`).
  - background chip → `onBrowseBackgrounds` (label = `BG {selectedBackground?.name ?? "None"}`), only when provided.
  Keep the `+` attach menu (Vision reference / Asset) as-is, reskinned. Keep Import here only if desired (nav also has Import — to DRY, the nav is canonical; the prompt `+`/Import button may be dropped). Decision: drop the prompt-bar Import button (nav owns Import); keep `+` attach.

- [ ] **Step 4: Bottom-right cluster.** Right-aligned: **Enhance** (existing `onEnhancePrompt`, DS secondary/ghost with `WandIcon`, disabled until `canEnhance`), **Model dropdown** (`Dropdown` over `modelOptions`; if `modelOptions` empty, render a small editable text input bound to `model` — manual entry for no-endpoint providers; show a spinner when `modelLoading`), **Generate** (the existing contextual `PrimaryButton` — generate/iterate as DS primary tactile, stop as DS danger, retry as DS warning). Move the Settings gear out (Settings now lives in the nav) — remove `onToggleSettings` from PromptBar.

- [ ] **Step 5: Wire in `App.tsx`.** Add `useModelList(config)`; pass `model={config.model}`, `onModelChange={(m)=>updateConfig({ model: m })}`, `modelOptions`, `modelLoading`. Pass `showCompare={canCompare}`, `compareActive={compare}`, `onToggleCompare={()=>setCompare(c=>!c)}`. Remove the now-moved Compare button + view switcher from the old header (already replaced by TopNav in Task 4).

- [ ] **Step 6: Verify** every prompt-area element from the spec is present and functional (text, ratio, batch, style, bg chips; enhance; model dropdown switches `config.model`; generate/iterate/stop/retry; compare strip appears for multi-variant). Build + tests.
- [ ] **Step 7: Commit**

```bash
git add src/components/PromptBar.tsx src/App.tsx
git commit -m "feat(ui): chip prompt area with model dropdown + compare strip"
```

---

## Task 11: Reskin existing panes to tokens/primitives

**Files:**
- Modify: `src/components/StylesPane.tsx`, `BackgroundsPane.tsx`, `SettingsPanel.tsx`, `HistoryList.tsx`, `CodeEditor.tsx`, `PosterCanvas.tsx`

These already work; update their chrome (buttons, inputs, borders, headers) to DS primitives + new tokens so they match. **No logic/behavior changes.** Do them one at a time, each its own commit, verifying build + dev after each.

- [ ] **Step 1: StylesPane** — headers/labels to `.eyebrow`/`.section-label`, buttons → DS `Button`/`IconButton`, selection ring → accent. Verify selection still closes the pane and selects the style.
- [ ] **Step 2: BackgroundsPane** — same treatment; keep the live preview + pause logic intact (don't change memoization/handlers that prevent flicker — see App comments).
- [ ] **Step 3: SettingsPanel** — inputs → DS `Input`/`Select`, buttons → DS `Button`; keep validation + model list behavior.
- [ ] **Step 4: HistoryList** — cards → DS `Card`, actions → DS `IconButton`; keep open/delete/clear.
- [ ] **Step 5: CodeEditor** — header `Code`/close → DS `IconButton`; the CodeMirror theme stays (it's a separate dark theme).
- [ ] **Step 6: PosterCanvas** — reskin slide chrome/empty state to tokens; export/download buttons → DS. Do **not** add any canvas backdrop (Background Color edits HTML, not the canvas).
- [ ] **Step 7:** After each, `npm run build` + `npm test` → PASS. Commit per pane, e.g.:

```bash
git add src/components/StylesPane.tsx
git commit -m "style(ui): reskin StylesPane to design system"
```

---

## Task 12: Final integration pass

**Files:** none new — verification + cleanup.

- [ ] **Step 1: Full build** `npm run build` → PASS (no TS errors, no unused old tokens/classes left referencing removed names).
- [ ] **Step 2: Full tests** `npm test` → all PASS.
- [ ] **Step 3: Manual checklist against spec §7 / wireframes:**
  - Nav: New, Import, Settings (left); History, Export▾ (right); logo mark.
  - Right pane: collapsed rail; hover labels; click → left overlay panel (Edit HTML, Properties, Styles, Assets, BG, Info); Expand → docked accordion resizing canvas; Collapse returns.
  - Properties: Batch, Resolution, Background Color (edits poster HTML).
  - Info: prompt/preferences + live thinking/output during a generation.
  - Prompt: textarea, ratio/batch/style/background chips, Enhance, Model dropdown (switches model; manual entry for Anthropic), Generate (generate/iterate/stop/retry), Compare strip for multi-variant.
  - Look: purple/glass/tactile, Space Grotesk + JetBrains Mono, rounded radii, glow focus.
  - All prior features work: generate, iterate, stop, retry, compare, styles, backgrounds, assets, import, history, export, enhance, settings, code edit.
- [ ] **Step 4: Remove dead code** (old `toolBtn`/`segBtn` helpers, unused imports, removed icons) flagged by tsc/eslint.
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(ui): final integration pass + cleanup for design-system revamp"
```

---

## Notes for the implementer

- Retrieve exact design-system values via the **DesignSync MCP** (`get_file` on `tokens/*.css` and `components/*/*.jsx`). Do not eyeball them — the look must match.
- The wireframes (`wireframes/*.png`) are the authority for layout/position/states; open them while building Tasks 4–5 and 10.
- Keep behavior identical; this is chrome only. If any reskin tempts a behavior change, stop and flag.
- Commit after every task; keep the tree green (`npm run build` + `npm test`).
