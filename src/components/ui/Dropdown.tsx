import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface DropdownItem {
  value: string;
  label: ReactNode;
  hint?: string;
}

interface DropdownProps {
  label: ReactNode;
  items: DropdownItem[];
  value: string;
  onSelect: (value: string) => void;
  align?: "left" | "right";
  width?: number;
}

/**
 * A compact toolbar dropdown styled to match the prompt-bar chips:
 * dark pill, label + chevron, opens an upward menu (it lives at the
 * bottom of the screen).
 */
export function Dropdown({
  label,
  items,
  value,
  onSelect,
  align = "left",
  width = 220,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 px-3 rounded-md bg-surface border border-border text-sm font-medium text-text hover:border-border-strong hover:bg-surface-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
      >
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDownIcon
          size={12}
          className={`text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          style={{ width, maxHeight: 280, boxShadow: "var(--shadow-menu)" }}
          className={`menu-enter scroll-thin absolute bottom-full mb-2 ${align === "right" ? "right-0" : "left-0"} z-30 overflow-y-auto rounded-md border border-border bg-surface-2 p-1`}
        >
          {items.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile ${
                  selected
                    ? "bg-accent/15 text-text"
                    : "text-text-muted hover:bg-surface-3"
                }`}
              >
                <span className="mt-0.5 flex w-3 shrink-0 justify-center text-accent">
                  {selected && <CheckIcon size={12} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="block text-xs text-text-muted/70 leading-snug">
                      {item.hint}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
