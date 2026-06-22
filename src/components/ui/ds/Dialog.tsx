import type { HTMLAttributes, ReactNode } from "react";

interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}

export function Dialog({ open = true, title, description, children, footer, onClose, className = "", ...rest }: DialogProps) {
  if (!open) return null;
  return (
    <div className="dvg-dialog-overlay" onClick={onClose}>
      <div className={["dvg-dialog", className].filter(Boolean).join(" ")} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} {...rest}>
        {(title || onClose) && (
          <div className="dvg-dialog__head">
            <div className="dvg-dialog__title">
              {title}
              {description && <div className="dvg-dialog__desc">{description}</div>}
            </div>
            {onClose && (
              <button type="button" className="dvg-dialog__close" aria-label="Close" onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            )}
          </div>
        )}
        {children}
        {footer && <div className="dvg-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}