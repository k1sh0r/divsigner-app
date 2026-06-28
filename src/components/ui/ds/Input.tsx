import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  id?: string;
}

export function Input({
  label,
  hint,
  error,
  icon = null,
  id,
  className = "",
  ...rest
}: InputProps) {
  const fid = id || (label ? `dvg-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const inputCls = [
    "dvg-input",
    icon && "dvg-input--has-icon",
    error && "dvg-input--error",
    className,
  ].filter(Boolean).join(" ");
  return (
    <div className="dvg-field">
      {label && <label className="dvg-field__label" htmlFor={fid}>{label}</label>}
      <div className="dvg-input-wrap">
        {icon && <span className="dvg-input-wrap__icon">{icon}</span>}
        <input id={fid} className={inputCls} aria-invalid={!!error} {...rest} />
      </div>
      {(error || hint) && (
        <span className={"dvg-field__hint" + (error ? " dvg-field__hint--error" : "")}>
          {error || hint}
        </span>
      )}
    </div>
  );
}