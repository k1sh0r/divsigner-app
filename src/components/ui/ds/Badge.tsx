import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "accent" | "success" | "warning" | "danger";
  dot?: boolean;
}

export function Badge({ children, variant = "neutral", dot = false, className = "", ...rest }: BadgeProps) {
  const cls = ["dvg-badge", `dvg-badge--${variant}`, className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className="dvg-badge__dot" />}
      {children}
    </span>
  );
}