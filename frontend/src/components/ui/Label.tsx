import type { ReactNode } from 'react';

export type LabelVariant = 'section' | 'field';

interface Props {
  variant?: LabelVariant;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLS: Record<LabelVariant, string> = {
  section: 'font-mono text-[10.5px] tracking-[.14em] text-muted font-semibold',
  field: 'text-[10.5px] tracking-[.06em] text-faint',
};

export function Label({ variant = 'field', className = '', children }: Props) {
  return <p className={`uppercase ${VARIANT_CLS[variant]} ${className}`}>{children}</p>;
}
