import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface BottomDrawerProps {
  open: boolean;
  title: string;
  /** Live badge content on the title row (right of the title). */
  badge?: ReactNode;
  /** Right-aligned control on the title row (e.g. a close/back button). */
  action?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Change to force the swipe-into-view animation to re-fire (e.g. a view\n   *  id when the drawer swaps content but stays open). */
  swipeKey?: string | number;
  className?: string;
}

/**
 * A bottom-anchored drawer used on mobile for the menu and prompt config.
 *
 * The drawer itself handles the scrim, drag-handle, Escape/backdrop close, and
 * an exit animation. Sub-content changes (the `swipeKey` prop) re-trigger a
 * short `translateX`-based "swipe into view" animation — a light, non-blocking
 * nod to swiping between options without slowing real interaction.
 */
export function BottomDrawer({
  open,
  title,
  badge,
  action,
  onClose,
  children,
  swipeKey,
  className = "",
}: BottomDrawerProps) {
  // Play the closing animation, then actually unmount after it finishes.
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (open) {
      setRender(true);
      setClosing(false);
    } else if (render) {
      setClosing(true);
      timer.current = window.setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, 200);
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape closes (and a child sub-view may stop propagation if it handles its
  // own Escape — panes do this for their inner back navigation).
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );
  useEffect(() => {
    if (!render) return;
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [render, onKey]);

  if (!render) return null;

  // Portal to document.body so the fixed scrim + drawer escape any ancestor
  // that establishes a containing block for fixed elements (e.g. an ancestor
  // with backdrop-filter, which is exactly where this drawer often lives
  // inside the prompt bar). Without this, the scrim is clipped to the ancestor
  // box and tapping outside can't close the drawer.
  return createPortal(
    <>
      <div className="ds-scrim" onClick={onClose} />
      <div
        className={`ds-drawer ${closing ? "ds-drawer--closing" : ""} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="ds-drawer__handle" />
        <div className="ds-drawer__head">
          <div className="flex min-w-0 items-center gap-2">
            <span className="ds-drawer__title truncate">{title}</span>
            {badge}
          </div>
          {action}
        </div>
        <div className="ds-drawer__body">
          <div key={swipeKey} className="ds-panel-swipe-in ds-drawer__pad">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
