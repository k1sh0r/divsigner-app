import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
  id?: string;
}

export function Textarea({
  label,
  hint,
  error,
  mono = false,
  id,
  className = "",
  ...rest
}: TextareaProps) {
  const fid = id || (label ? `dvg-ta-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const cls = ["dvg-textarea", mono && "dvg-textarea--mono", className].filter(Boolean).join(" ");
  return (
    <div className="dvg-field">
      {label && <label className="dvg-field__label" htmlFor={fid}>{label}</label>}
      <textarea id={fid} className={cls} aria-invalid={!!error} {...rest} />
      {(error || hint) && (
        <span className={"dvg-field__hint" + (error ? " dvg-field__hint--error" : "")}>{error || hint}</span>
      )}
    </div>
  );
}