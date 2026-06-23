import { useState, type ReactNode } from "react";
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
const OVERLAY_WIDTH = 372;

function RailButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center transition-colors duration-150"
      style={{
        width: 40,
        height: 40,
        margin: "4px auto",
        borderRadius: "var(--radius-sm)",
        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
        background: active ? "var(--accent-soft-rgba)" : "transparent",
        boxShadow: active ? "inset 0 0 0 1px var(--border-accent)" : "none",
      }}
    >
      {icon}
    </button>
  );
}

export function RightPane({
  expanded,
  openSection,
  onToggleExpanded,
  onOpenSection,
  sections,
}: RightPaneProps) {
  const [hovered, setHovered] = useState(false);

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
                  className="flex w-full items-center gap-3 px-4 transition-colors duration-150"
                  style={{ height: 44, color: "var(--text-secondary)" }}
                >
                  <span style={{ color: open ? "var(--accent-hover)" : "var(--text-tertiary)", display: "inline-flex" }}>
                    {s.icon}
                  </span>
                  <span className="font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] flex-1 text-left">
                    {s.label}
                  </span>
                  <span className="font-mono text-[16px] text-text-faint">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="px-4 pb-4 animate-[fadeIn_200ms_ease]">{s.body}</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: "1px solid var(--border-subtle)" }} className="p-2">
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

  // ---- Collapsed: icon rail (+ hover flyout / overlay panel) ----
  const activeSection = openSection ? sections.find((s) => s.id === openSection) ?? null : null;

  return (
    <div
      className="relative shrink-0"
      style={{ width: RAIL_WIDTH }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Overlay panel: section body floating to the left of the rail */}
      {activeSection && (
        <div
          className="absolute bottom-0 top-0 flex flex-col"
          style={{
            right: RAIL_WIDTH,
            width: OVERLAY_WIDTH,
            background: "var(--glass-3)",
            backdropFilter: "var(--blur-lg)",
            WebkitBackdropFilter: "var(--blur-lg)",
            boxShadow: "var(--glass-edge), var(--shadow-lg)",
            borderLeft: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
            zIndex: 40,
          }}
        >
          <div
            className="flex shrink-0 items-center justify-between px-4"
            style={{ height: 44, borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] text-text">
              {activeSection.label}
            </span>
            <button
              type="button"
              onClick={() => onOpenSection(null)}
              aria-label="Close"
              className="flex items-center justify-center text-text-muted hover:text-text transition-colors duration-150"
              style={{ width: 28, height: 28, borderRadius: "var(--radius-xs)" }}
            >
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{activeSection.body}</div>
        </div>
      )}

      {/* Hover flyout: section labels + Expand (only when no section open) */}
      {hovered && !activeSection && (
        <div
          className="absolute top-0"
          style={{
            right: RAIL_WIDTH,
            width: 200,
            background: "var(--glass-3)",
            backdropFilter: "var(--blur-lg)",
            WebkitBackdropFilter: "var(--blur-lg)",
            boxShadow: "var(--glass-edge), var(--shadow-md)",
            borderLeft: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
            padding: 6,
            zIndex: 40,
          }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpenSection(s.id)}
              className="flex w-full items-center gap-3 px-3 transition-colors duration-150"
              style={{ height: 36, borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}
            >
              <span style={{ color: "var(--text-tertiary)", display: "inline-flex" }}>{s.icon}</span>
              <span className="font-mono text-[12px] font-medium tracking-[var(--tracking-mono)]">{s.label}</span>
            </button>
          ))}
          <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "6px 0" }} />
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex w-full items-center gap-3 px-3 transition-colors duration-150"
            style={{ height: 36, borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}
          >
            <span style={{ color: "var(--text-tertiary)", display: "inline-flex" }}><PanelToggleIcon size={16} /></span>
            <span className="font-mono text-[12px] font-medium tracking-[var(--tracking-mono)]">Expand</span>
          </button>
        </div>
      )}

      {/* The rail itself */}
      <div
        className="flex h-full flex-col items-center"
        style={{
          background: "var(--glass-1)",
          backdropFilter: "var(--blur-md)",
          WebkitBackdropFilter: "var(--blur-md)",
          boxShadow: "var(--glass-edge)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col items-center">
          {sections.map((s) => (
            <RailButton
              key={s.id}
              icon={s.icon}
              label={s.label}
              active={openSection === s.id}
              onClick={() => onOpenSection(openSection === s.id ? null : s.id)}
            />
          ))}
        </div>
        <div className="p-1">
          <RailButton
            icon={<PanelToggleIcon size={18} />}
            label="Expand"
            active={false}
            onClick={onToggleExpanded}
          />
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