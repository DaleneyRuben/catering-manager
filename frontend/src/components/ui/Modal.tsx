import type { ReactNode } from 'react';

interface Props {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ onClose, children, className = '' }: Props) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(20,40,6,0.32)] backdrop-blur-sm modal-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centering wrapper keeps transforms separate from the dialog animation */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div
          role="dialog"
          aria-modal="true"
          className={`bg-cream border border-rule-2 shadow-[0_20px_60px_rgba(20,40,6,0.25)] modal-dialog-enter ${className}`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
