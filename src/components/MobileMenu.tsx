import type { ReactNode } from "react";
import { BottomDrawer } from "./ui/BottomDrawer";
import { CloseIcon, BackIcon } from "./ui/icons";
import { PaneChromeContext } from "./panes/PaneContext";

/**
 * A unified mobile surface that hosts both the nav actions and the right-pane
 * sections. Opens as a bottom drawer showing a menu of options; selecting a
 * section swaps the drawer content to that panel (with a swipe-in animation)
 * while keeping the drawer open. Controlled by `activeId` so the host (App)
 * can deep-link into a section (e.g. opening Styles from the prompt config).
 */

export interface MobileMenuAction {
  id: string;
  label: string;
  /** Short hint shown under the label. */
  hint?: string;
  icon: ReactNode;
  /** Optional badge (e.g. a red dot). */
  badge?: ReactNode;
  /** Direct action — fires and closes the drawer. */
  onSelect?: () => void;
  /** Panel body rendered in the drawer when selected (mutually exclusive
   *  with onSelect). */
  panel?: ReactNode;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  title: string;
  actions: MobileMenuAction[];
  /** Id of the section currently shown as a panel, or null for the menu list. */
  activeId: string | null;
  /** Set the active section (null = back to list). */
  onOpenSection: (id: string | null) => void;
}

export function MobileMenu({
  open,
  onClose,
  title,
  actions,
  activeId,
  onOpenSection,
}: MobileMenuProps) {
  const active = actions.find((a) => a.id === activeId) ?? null;

  const closeAll = () => {
    onOpenSection(null);
    onClose();
  };

  const handleAction = (a: MobileMenuAction) => {
    if (a.panel) onOpenSection(a.id);
    else {
      a.onSelect?.();
      closeAll();
    }
  };

  // Back returns to the menu list when a panel is open; otherwise close.
  const handleBack = () => {
    if (active) onOpenSection(null);
    else closeAll();
  };

  return (
    <BottomDrawer
      open={open}
      title={active ? active.label : title}
      swipeKey={activeId ?? "menu"}
      badge={active?.badge}
      action={
        active ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to menu"
            className="flex items-center justify-center text-text-muted transition-all duration-150 btn-tactile hover:text-text"
            style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)" }}
          >
            <BackIcon size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={closeAll}
            aria-label="Close menu"
            className="flex items-center justify-center text-text-muted transition-all duration-150 btn-tactile hover:text-text"
            style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)" }}
          >
            <CloseIcon size={18} />
          </button>
        )
      }
      onClose={closeAll}
    >
      {active ? (
        <PaneChromeContext.Provider value={{ docked: true }}>
          <div className="-mx-4 -mb-5">{active.panel}</div>
        </PaneChromeContext.Provider>
      ) : (
        <nav className="flex flex-col gap-1.5">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleAction(a)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition-all duration-150 btn-tactile"
              style={{
                borderRadius: "var(--radius-md)",
                background: "var(--glass-2)",
                boxShadow: "var(--emboss-neutral)",
              }}
            >
              <span
                className="relative flex shrink-0 items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-soft-rgba)",
                  color: "var(--accent-hover)",
                }}
              >
                {a.icon}
                {a.badge}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-text">
                  {a.label}
                </span>
                {a.hint && (
                  <span className="block truncate text-xs text-text-muted">
                    {a.hint}
                  </span>
                )}
              </span>
              {a.panel && (
                <span className="font-mono text-[14px] text-text-faint">›</span>
              )}
            </button>
          ))}
        </nav>
      )}
    </BottomDrawer>
  );
}
