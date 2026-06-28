import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  DownloadIcon,
  HistoryIcon,
  ImportIcon,
  MenuIcon,
  NewIcon,
} from "./ui/icons";

interface TopNavProps {
  onNew: () => void;
  onImport: () => void;
  onHistory: () => void;
  historyActive: boolean;
  onExportPng: () => void;
  onExportHtml: () => void;
  canExport: boolean;
  exporting?: boolean;
  error?: string | null;
  /** Mobile: opens the menu bottom drawer (nav + right-pane sections). */
  onOpenMenu?: () => void;
}

function NavButton({
  onClick,
  active,
  icon,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] transition-all duration-150 btn-tactile ${
        active
          ? "text-text-primary"
          : "text-text-muted hover:text-text-primary"
      }`}
      style={
        active
          ? { background: "var(--accent-soft-rgba)", boxShadow: "inset 0 0 0 1px var(--border-accent)" }
          : undefined
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function TopNav({
  onNew,
  onImport,
  onHistory,
  historyActive,
  onExportPng,
  onExportHtml,
  canExport,
  exporting = false,
  error = null,
  onOpenMenu,
}: TopNavProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onDown = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [exportOpen]);

  return (
    <header
      className="relative z-50 flex shrink-0 items-center gap-3 px-4"
      style={{
        height: "var(--nav-h)",
        background: "var(--glass-1)",
        backdropFilter: "var(--blur-md)",
        WebkitBackdropFilter: "var(--blur-md)",
        boxShadow: "var(--glass-edge)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Brand mark + wordmark */}
      <div className="flex items-center gap-2.5">
        <img src="/divsigner-logo.png" alt="Divsigner" width={30} height={30} />
        <span
          className="font-display text-[15px] font-bold tracking-tight text-text"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Div<span className="text-accent-soft">signer</span>
        </span>
      </div>

      {/* Left cluster: New · Import (desktop only) */}
      <div className="ml-2 hidden items-center gap-1 md:flex">
        <NavButton onClick={onNew} icon={<NewIcon size={15} />} label="New" />
        <NavButton onClick={onImport} icon={<ImportIcon size={15} />} label="Import" />
      </div>

      {error && (
        <div
          role="alert"
          className="ml-3 flex min-w-0 items-center gap-2 px-2.5 py-1 text-xs text-danger animate-[fadeIn_200ms_ease]"
          style={{
            borderRadius: "var(--radius-sm)",
            background: "rgba(242,62,99,0.12)",
            boxShadow: "inset 0 0 0 1px rgba(242,62,99,0.4)",
          }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger animate-pulse"
            style={{ background: "var(--danger)" }}
          />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Right cluster: History · Export (desktop) · Menu (mobile) */}
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <NavButton
            onClick={onHistory}
            active={historyActive}
            icon={<HistoryIcon size={15} />}
            label="History"
          />

        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => canExport && setExportOpen((o) => !o)}
            disabled={!canExport}
            className="flex h-9 items-center gap-2 px-3 font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] transition-all duration-150 btn-tactile disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "var(--glass-2)",
              boxShadow: "var(--emboss-neutral)",
              color: "var(--text-primary)",
            }}
          >
            <DownloadIcon size={15} />
            <span>Export</span>
            <ChevronDownIcon
              size={12}
              className={`text-text-muted transition-transform duration-200 ${exportOpen ? "rotate-180" : ""}`}
            />
          </button>
          {exportOpen && (
            <div
              className="menu-enter absolute right-0 top-full mt-2 z-50 p-1"
              style={{
                width: 180,
                borderRadius: "var(--radius-md)",
                background: "var(--glass-3)",
                backdropFilter: "var(--blur-lg)",
                WebkitBackdropFilter: "var(--blur-lg)",
                boxShadow: "var(--glass-edge), var(--shadow-lg)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExportPng();
                }}
                disabled={exporting}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-text-muted hover:text-text-primary transition-all duration-150 disabled:opacity-50"
                style={{ borderRadius: "var(--radius-sm)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft-rgba)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <DownloadIcon size={14} />
                {exporting ? "Exporting…" : "PNG"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExportHtml();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-text-muted hover:text-text-primary transition-all duration-150"
                style={{ borderRadius: "var(--radius-sm)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft-rgba)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <DownloadIcon size={14} />
                HTML
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Mobile menu button (opens the nav + sections bottom drawer) */}
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex md:hidden items-center justify-center transition-all duration-150 btn-tactile"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              background: "var(--glass-2)",
              boxShadow: "var(--emboss-neutral)",
              color: "var(--text-secondary)",
            }}
            aria-label="Open menu"
          >
            <MenuIcon size={18} />
          </button>
        )}
      </div>
    </header>
  );
}