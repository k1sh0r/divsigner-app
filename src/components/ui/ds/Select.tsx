import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: (string | SelectOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  id?: string;
}

export function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  id,
  ...rest
}: SelectProps) {
  const fid = id || (label ? `dvg-sel-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="dvg-field">
      {label && <label className="dvg-field__label" htmlFor={fid}>{label}</label>}
      <div className="dvg-select-wrap">
        <select id={fid} className="dvg-select" value={value} defaultValue={defaultValue} onChange={onChange} disabled={disabled} {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {norm.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="dvg-select-wrap__chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </div>
    </div>
  );
}