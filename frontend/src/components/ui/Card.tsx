import type { ReactNode } from 'react';

interface Props {
  className?: string;
  padding?: string;
  children: ReactNode;
}

export function Card({ className = '', padding = '22px 24px', children }: Props) {
  return (
    <div className={`bg-paper border border-rule rounded-[14px] ${className}`} style={{ padding }}>
      {children}
    </div>
  );
}
