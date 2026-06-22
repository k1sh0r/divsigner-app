import type { HTMLAttributes, ReactNode } from "react";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "accent";
  icon?: ReactNode;
  onRemove?: () => void;
}

export function Tag({ children, variant = "neutral", icon = null, onRemove, className = "", ...rest }: TagProps) {
  const cls = ["dvg-tag", variant !== "neutral" && `dvg-tag--${variant}`, className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {icon}
      <span>{children}</span>
      {onRemove && (
        <button type="button" className="dvg-tag__remove" aria-label="Remove" onClick={onRemove}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
    </span>
  );
}