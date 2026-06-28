import type { InputHTMLAttributes } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "defaultChecked" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, defaultChecked, onChange, label, disabled = false, ...rest }: SwitchProps) {
  return (
    <label className="dvg-switch" data-disabled={disabled}>
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="dvg-switch__track"><span className="dvg-switch__thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}