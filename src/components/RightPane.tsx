import { useEffect, useRef, useState, type ReactNode } from "react";
import { PaneChromeContext } from "./panes/PaneContext";
import {
  InfoIcon,
  ApertureIcon,
  ImageIcon,
  InboxIcon,
  PanelToggleIcon,
  PropertiesIcon,
  SettingsIcon,
  TerminalIcon,
} from "./ui/icons";

export type Section =
  | "html"
  | "properties"
  | "styles"
  | "assets"
  | "bg"
  | "info"
  | "settings";

export interface RightPaneSection {
  id: Section;
  label: string;
  icon: ReactNode;
  /** Optional small badge (e.g. a red dot) shown on the icon. */
  badge?: ReactNode;
  body: ReactNode;
}

interface RightPaneProps {
  /** Whether labels are pinned visible (expanded docked column). */
  expanded: boolean;
  openSection: Section | null;
  onToggleExpanded: () => void;
  onOpenSection: (s: Section | null) => void;
  sections: RightPaneSection[];
}

const RAIL_WIDTH = 56; // collapsed rail width; hover widens to w-[200px]
const EXPANDED_WIDTH = 280; // default docked column width
const EXPANDED_MIN = 240;
const EXPANDED_MAX = 560;
const OVERLAY_WIDTH = 400;
const RAIL_GAP = 12; // floating gap between rail and screen edge

export function RightPane({
  expanded,
  openSection,
  onToggleExpanded,
  onOpenSection,
  sections,
}: RightPaneProps) {
  // When a section is open, the overlay panel sits to the RIGHT of the rail
  // (flush to the screen edge) and the rail shifts left to make room.
  const activeSection = openSection
    ? sections.find((s) => s.id === openSection) ?? null
    : null;
  const anyOpen = Boolean(activeSection);

  const railRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Resizable docked column. The column is flush to the right edge, so its
  // width is the distance from the cursor to the window's right edge while
  // dragging the left-edge handle.
  const [expandedWidth, setExpandedWidth] = useState(EXPANDED_WIDTH);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const w = window.innerWidth - e.clientX;
      setExpandedWidth(Math.min(EXPANDED_MAX, Math.max(EXPANDED_MIN, w)));
    };
    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Collapsed + open: clicking anywhere outside the rail/panel closes it.
  useEffect(() => {
    if (expanded || !anyOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (railRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      onOpenSection(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [expanded, anyOpen, onOpenSection]);

  // ---- Expanded: docked accordion column (resizes the canvas) ----
  if (expanded) {
    return (
      <div
        className="relative flex min-h-0 shrink-0 flex-col"
        style={{
          width: expandedWidth,
          background: "var(--glass-2)",
          backdropFilter: "var(--blur-md)",
          WebkitBackdropFilter: "var(--blur-md)",
          boxShadow: "var(--glass-edge)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        {/* Left-edge drag handle to resize the docked column. */}
        <div
          onMouseDown={startResize}
          aria-hidden
          className="absolute top-0 bottom-0 z-10 group/resize"
          style={{ left: -3, width: 6, cursor: "col-resize" }}
        >
          <div
            className="absolute inset-y-0 left-[2px] w-px transition-colors duration-150 group-hover/resize:bg-[var(--border-accent)]"
            style={{ background: "transparent" }}
          />
        </div>
        <PaneChromeContext.Provider value={{ docked: true }}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin">
          {sections.map((s) => {
            const open = openSection === s.id;
            return (
              <div key={s.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  onClick={() => onOpenSection(open ? null : s.id)}
                  className="flex w-full items-center gap-3 transition-colors duration-150"
                  style={{ height: 44, padding: "0 var(--space-4)", color: "var(--text-secondary)" }}
                >
                  <span style={{ color: open ? "var(--accent-hover)" : "var(--text-tertiary)", display: "inline-flex", position: "relative" }}>
                    {s.icon}
                    {s.badge}
                  </span>
                  <span className="font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] flex-1 text-left">
                    {s.label}
                  </span>
                  <span className="font-mono text-[16px]" style={{ color: "var(--text-faint)" }}>{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="animate-[fadeIn_200ms_ease]">
                    {s.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </PaneChromeContext.Provider>
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "var(--space-2)" }}>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex w-full items-center justify-center gap-2 transition-colors duration-150"
            style={{
              height: 36,
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              background: "var(--glass-2)",
              boxShadow: "var(--emboss-neutral)",
            }}
          >
            <PanelToggleIcon size={16} />
            <span className="font-mono text-[12px] font-medium tracking-[var(--tracking-mono)]">Collapse</span>
          </button>
        </div>
      </div>
    );
  }

  // ---- Collapsed: floating icon rail on the right edge ----
  // Rail is collapsed (icons only) by default; when no section is open it
  // widens on hover to reveal labels (the hovered wireframe look).
  // The rail shifts left to clear the panel when a section is open, leaving a
  // gap between the rail and the opened panel (panel sits at right: RAIL_GAP).
  const railRight = anyOpen ? OVERLAY_WIDTH + RAIL_GAP * 2 : 0;
  // Card background is visible when open or while hovering the rail.
  const cardBg: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "var(--glass-2)",
    backdropFilter: "var(--blur-md)",
    WebkitBackdropFilter: "var(--blur-md)",
    boxShadow: "var(--glass-edge), var(--shadow-md)",
    border: "1px solid var(--border-subtle)",
    borderRadius: anyOpen
      ? "var(--radius-lg)"
      : "var(--radius-lg) 0 0 var(--radius-lg)",
    pointerEvents: "none",
  };
  const cardBgClass = anyOpen
    ? "opacity-100"
    : "opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100";

  return (
    <>
      {/* Overlay panel: opens to the RIGHT of the rail, flush to the edge */}
      {activeSection && (
        <div
          ref={panelRef}
          className="absolute z-30 panel-enter flex flex-col"
          style={{
            top: RAIL_GAP,
            bottom: RAIL_GAP,
            right: RAIL_GAP,
            width: OVERLAY_WIDTH,
            background: "var(--glass-3)",
            backdropFilter: "var(--blur-lg)",
            WebkitBackdropFilter: "var(--blur-lg)",
            boxShadow: "var(--glass-edge), var(--shadow-lg)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div className="min-h-0 flex-1 overflow-hidden">{activeSection.body}</div>
        </div>
      )}

      {/* The rail — content-height (does not stretch vertically), top-aligned.
          Hovering widens it to reveal labels; clicking an icon opens its panel. */}
      <div
        ref={railRef}
        className={`group/rail absolute z-30 flex w-[56px] flex-col overflow-hidden ${anyOpen ? "" : "hover:w-[200px]"}`}
        style={{
          top: RAIL_GAP,
          right: railRight,
          transition: "width var(--transition-med), right var(--transition-med)",
        }}
      >
        <div className={cardBgClass} style={cardBg} />
        <div className="relative flex flex-col py-1">
          {sections.map((s) => (
            <RailButton
              key={s.id}
              label={s.label}
              icon={s.icon}
              badge={s.badge}
              active={openSection === s.id}
              onClick={() => onOpenSection(openSection === s.id ? null : s.id)}
            />
          ))}
          <div
            style={{ borderTop: "1px solid var(--border-subtle)", margin: "4px 8px" }}
          />
          <RailButton
            label="Expand"
            icon={<PanelToggleIcon size={18} />}
            active={false}
            onClick={onToggleExpanded}
          />
        </div>
      </div>
    </>
  );
}

// A single rail row: an icon box (always visible) followed by a label that
// fades in when the rail is hovered (the hovered wireframe look). The icon
// box keeps the icon centered at the rail's collapsed width so icons don't
// jump when the rail widens.
function RailButton({
  label,
  icon,
  badge,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="relative flex w-full items-center transition-colors duration-150"
      style={{
        height: 44,
        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
        background: active ? "var(--accent-soft-rgba)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--glass-2)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = active
          ? "var(--text-primary)"
          : "var(--text-tertiary)";
      }}
    >
      <span
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: RAIL_WIDTH, height: 44 }}
      >
        {icon}
        {badge}
      </span>
      <span className="whitespace-nowrap font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100">
        {label}
      </span>
    </button>
  );
}

// Re-export the icons the rail uses so App can build sections without
// re-importing each one.
export const SectionIcons = {
  html: <TerminalIcon size={18} />,
  properties: <PropertiesIcon size={18} />,
  styles: <ApertureIcon size={18} />,
  assets: <InboxIcon size={18} />,
  bg: <ImageIcon size={18} />,
  info: <InfoIcon size={18} />,
  settings: <SettingsIcon size={18} />,
};
