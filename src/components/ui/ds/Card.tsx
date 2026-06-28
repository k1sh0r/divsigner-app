import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "accent";
  interactive?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, variant = "glass", interactive = false, padding = "md", className = "", ...rest }: CardProps) {
  const cls = [
    "dvg-card",
    variant !== "glass" && `dvg-card--${variant}`,
    interactive && "dvg-card--interactive",
    padding === "sm" && "dvg-card__pad-sm",
    padding === "lg" && "dvg-card__pad-lg",
    className,
  ].filter(Boolean).join(" ");
  return <div className={cls} {...rest}>{children}</div>;
}