import type { ReactNode } from 'react';

export type LabelVariant = 'section' | 'field';

interface Props {
  variant?: LabelVariant;
  className?: string;
  /** Names the control this label describes — renders a real <label> instead of a caption. */
  htmlFor?: string;
  children: ReactNode;
}

const VARIANT_CLS: Record<LabelVariant, string> = {
  section: 'font-mono text-[10.5px] tracking-[.14em] text-muted font-semibold',
  field: 'text-[10.5px] tracking-[.06em] text-faint',
};

export function Label({ variant = 'field', className = '', htmlFor, children }: Props) {
  const cls = `uppercase ${VARIANT_CLS[variant]} ${className}`;
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className={`block ${cls}`}>
        {children}
      </label>
    );
  }
  return <p className={cls}>{children}</p>;
}
