import { createContext, useContext } from "react";

/**
 * Chrome context for right-pane bodies. When a pane is rendered inside the
 * expanded docked accordion, `docked` is true — the accordion row already
 * provides the title and open/close toggle, so panes drop their own title
 * header (and any redundant close button) to avoid duplicate chrome.
 */
export interface PaneChrome {
  docked: boolean;
}

export const PaneChromeContext = createContext<PaneChrome>({ docked: false });

export const usePaneChrome = () => useContext(PaneChromeContext);
