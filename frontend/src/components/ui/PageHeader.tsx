import type { ReactNode } from 'react';

interface Props {
  label: string;
  title: string;
  action?: ReactNode;
}

export function PageHeader({ label, title, action }: Props) {
  return (
    <div className="flex items-center lg:items-end gap-4 lg:gap-6 mb-5 lg:mb-7">
      <div className="flex-1">
        <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5 lg:mb-2">
          {label}
        </p>
        <h1 className="font-serif text-[28px] lg:text-[44px] leading-none text-ink">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
