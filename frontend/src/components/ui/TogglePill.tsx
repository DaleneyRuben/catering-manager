import type { ReactNode } from 'react';

interface Props {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function TogglePill({ pressed, onClick, children, className = '' }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border transition-colors ${
        pressed
          ? 'font-semibold bg-olive-100 text-olive-700 border-olive-200'
          : 'font-normal bg-paper text-muted border-rule hover:border-olive-200'
      } ${className}`}
    >
      {children}
    </button>
  );
}
