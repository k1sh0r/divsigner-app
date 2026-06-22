import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft = null,
  iconRight = null,
  loading = false,
  fullWidth = false,
  disabled = false,
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  const cls = [
    "dvg-btn",
    `dvg-btn--${variant}`,
    size !== "md" && `dvg-btn--${size}`,
    fullWidth && "dvg-btn--full",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button type={type} className={cls} disabled={disabled || loading} {...rest}>
      {(variant === "primary" || variant === "danger") && <span className="dvg-btn__sheen" />}
      {loading ? <span className="dvg-btn__spin" /> : iconLeft}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </button>
  );
}