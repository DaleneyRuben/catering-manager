import type { ReactNode } from 'react';

interface Props {
  label: string;
  title: string;
  action?: ReactNode;
}

export function PageHeader({ label, title, action }: Props) {
  return (
    <div className="flex items-center lg:items-end gap-4 lg:gap-6 pb-5 lg:pb-[22px] mb-5 lg:mb-6 border-b border-hairline">
      <div className="flex-1">
        <p className="text-[11px] font-mono uppercase tracking-[.18em] text-olive-600 mb-0.5 lg:mb-[10px]">
          {label}
        </p>
        <h1 className="font-serif font-semibold text-[28px] lg:text-[42px] leading-none tracking-[.005em] text-ink">
          {title}
        </h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
