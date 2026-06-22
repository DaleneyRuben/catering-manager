import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface Props {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ onClose, children, className = '' }: Props) {
  // Portal escapes any ancestor `transform` (e.g. page-enter animation) that would
  // otherwise make `fixed` children position relative to that element, not the viewport.
  return createPortal(
    <>
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 z-50 bg-[rgba(21,42,6,0.42)] backdrop-blur-[3px] modal-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={`pointer-events-auto bg-cream rounded-[16px] shadow-[0_24px_60px_rgba(20,40,6,0.32)] modal-dialog-enter ${className}`}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
