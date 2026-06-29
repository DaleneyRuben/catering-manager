import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

interface Props {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  badge?: string;
  description?: string;
  descriptionMb?: number;
  className?: string;
  children: ReactNode;
}

export function WizardSectionCard({
  icon,
  iconBg,
  iconColor,
  title,
  badge,
  description,
  descriptionMb = 20,
  className = '',
  children,
}: Props) {
  return (
    <Card padding="26px 28px" className={className}>
      <div
        className="flex items-center gap-[10px]"
        style={{ marginBottom: description ? '6px' : '22px' }}
      >
        <span
          className={`w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
        >
          <Icon name={icon} size={15} stroke={1.7} />
        </span>
        <h2 className="font-serif text-[22px] font-semibold text-ink">{title}</h2>
        {badge && <span className="text-[12px] text-faint italic">{badge}</span>}
      </div>
      {description && (
        <p
          className="text-[13px] text-faint ml-[38px]"
          style={{ marginBottom: `${descriptionMb}px` }}
        >
          {description}
        </p>
      )}
      {children}
    </Card>
  );
}
