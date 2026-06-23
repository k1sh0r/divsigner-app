import { type ReactNode } from "react";
import {
  CloseIcon,
  InfoIcon,
  ApertureIcon,
  ImageIcon,
  InboxIcon,
  PanelToggleIcon,
  PropertiesIcon,
  TerminalIcon,
} from "./ui/icons";

export type Section =
  | "html"
  | "properties"
  | "styles"
  | "assets"
  | "bg"
  | "info";

export interface RightPaneSection {
  id: Section;
  label: string;
  icon: ReactNode;
  body: ReactNode;
}

interface RightPaneProps {
  expanded: boolean;
  openSection: Section | null;
  onToggleExpanded: () => void;
  onOpenSection: (s: Section | null) => void;
  sections: RightPaneSection[];
}

const RAIL_WIDTH = 48;
const EXPANDED_WIDTH = 320;
const OVERLAY_WIDTH = 380;

export function RightPane({
  expanded,
  openSection,
  onToggleExpanded,
  onOpenSection,
  sections,
}: RightPaneProps) {
  // ---- Expanded: docked accordion column (resizes the canvas) ----
  if (expanded) {
    return (
      <div
        className="flex min-h-0 shrink-0 flex-col"
        style={{
          width: EXPANDED_WIDTH,
          background: "var(--glass-2)",
          backdropFilter: "var(--blur-md)",
          WebkitBackdropFilter: "var(--blur-md)",
          boxShadow: "var(--glass-edge)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
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
                  <span style={{ color: open ? "var(--accent-hover)" : "var(--text-tertiary)", display: "inline-flex" }}>
                    {s.icon}
                  </span>
                  <span className="font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] flex-1 text-left">
                    {s.label}
                  </span>
                  <span className="font-mono text-[16px]" style={{ color: "var(--text-faint)" }}>{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="animate-[fadeIn_200ms_ease]" style={{ paddingBottom: "var(--space-4)" }}>
                    {s.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
  // The entire collapsed RightPane is position:absolute so it floats
  // over the canvas without taking flex space. The parent row must
  // have position:relative.
  const activeSection = openSection ? sections.find((s) => s.id === openSection) ?? null : null;

  return (
    <div
      className="absolute right-0 top-0 bottom-0 z-30"
      style={{ width: RAIL_WIDTH + (activeSection ? OVERLAY_WIDTH : 0) }}
    >
      {/* Overlay panel: opens to the left of the rail */}
      {activeSection && (
        <div
          className="absolute top-0 bottom-0 flex flex-col"
          style={{
            right: RAIL_WIDTH,
            width: OVERLAY_WIDTH,
            background: "var(--glass-3)",
            backdropFilter: "var(--blur-lg)",
            WebkitBackdropFilter: "var(--blur-lg)",
            boxShadow: "var(--glass-edge), var(--shadow-lg)",
            borderRight: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
          }}
        >
          <div
            className="flex shrink-0 items-center justify-between"
            style={{
              height: 44,
              padding: "0 var(--space-4)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span className="font-mono text-[13px] font-medium tracking-[var(--tracking-mono)]" style={{ color: "var(--text-primary)" }}>
              {activeSection.label}
            </span>
            <button
              type="button"
              onClick={() => onOpenSection(null)}
              aria-label="Close"
              className="flex items-center justify-center transition-colors duration-150"
              style={{ width: 28, height: 28, borderRadius: "var(--radius-xs)", color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{activeSection.body}</div>
        </div>
      )}

      {/* The rail itself — floating strip on the far right */}
      <div
        className="absolute right-0 top-0 bottom-0 flex flex-col items-center"
        style={{
          width: RAIL_WIDTH,
          background: "var(--glass-1)",
          backdropFilter: "var(--blur-md)",
          WebkitBackdropFilter: "var(--blur-md)",
          boxShadow: "var(--glass-edge)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col items-center">
          {sections.map((s) => (
            <div key={s.id} className="group relative">
              <button
                type="button"
                onClick={() => onOpenSection(openSection === s.id ? null : s.id)}
                title={s.label}
                aria-label={s.label}
                className="flex items-center justify-center transition-colors duration-150"
                style={{
                  width: 40,
                  height: 40,
                  margin: "4px auto",
                  borderRadius: "var(--radius-sm)",
                  color: openSection === s.id ? "var(--text-primary)" : "var(--text-tertiary)",
                  background: openSection === s.id ? "var(--accent-soft-rgba)" : "transparent",
                  boxShadow: openSection === s.id ? "inset 0 0 0 1px var(--border-accent)" : "none",
                }}
              >
                {s.icon}
              </button>
              {/* Hover label tooltip — appears to the left of the icon on hover */}
              <span
                className="absolute right-full top-1/2 -translate-y-1/2 font-mono text-[11px] font-medium tracking-[var(--tracking-mono)] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  color: "var(--text-secondary)",
                  paddingRight: 8,
                  background: "var(--glass-2)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ padding: "var(--space-1)" }}>
          <button
            type="button"
            onClick={onToggleExpanded}
            title="Expand"
            aria-label="Expand"
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            <PanelToggleIcon size={18} />
          </button>
        </div>
      </div>
    </div>
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
};