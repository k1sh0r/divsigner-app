import { type ReactNode } from "react";
import { CloseIcon } from "../ui/icons";
import { usePaneChrome } from "./PaneContext";

interface PaneHeaderProps {
  title: string;
  onClose?: () => void;
  /** Optional controls rendered left of the close button (e.g. a back arrow). */
  right?: ReactNode;
}

/**
 * The standard title bar shared by every right-pane panel: a 44px mono-titled
 * row with a close button. Keeping it in one place keeps panes uniform
 * (Properties, Edit HTML, Backgrounds, Settings, empty states, …).
 */
export function PaneHeader({ title, onClose, right }: PaneHeaderProps) {
  // In the docked accordion the row header already shows the title and a
  // +/− toggle, so the pane's own title bar is redundant — hide it.
  const { docked } = usePaneChrome();
  if (docked) return right ? <>{right}</> : null;

  return (
    <div
      className="flex shrink-0 items-center justify-between px-4"
      style={{ height: 44, borderBottom: "1px solid var(--border-subtle)" }}
    >
      <span className="truncate font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] text-text">
        {title}
      </span>
      <div className="flex items-center gap-1">
        {right}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center transition-colors duration-150"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-xs)", color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
