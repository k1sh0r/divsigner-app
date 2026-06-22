import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "neutral" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  label: string;
}

export function IconButton({
  children,
  variant = "neutral",
  size = "md",
  label,
  disabled = false,
  className = "",
  ...rest
}: IconButtonProps) {
  const cls = [
    "dvg-iconbtn",
    variant !== "neutral" && `dvg-iconbtn--${variant}`,
    size !== "md" && `dvg-iconbtn--${size}`,
    className,
  ].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} aria-label={label} title={label} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}