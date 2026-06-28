import { Icon } from '../../components/ui/Icon';

interface Props {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  today: number;
  todayColor?: string;
  tomorrow?: number;
  tomorrowColor?: string;
  singleCaption?: string;
  todayLabel?: string;
  tomorrowLabel?: string;
}

export function KpiCard({
  icon,
  iconBg,
  iconColor,
  label,
  today,
  todayColor = 'text-ink',
  tomorrow,
  tomorrowColor = 'text-ink',
  singleCaption,
  todayLabel = 'Hoy',
  tomorrowLabel = 'Mañana',
}: Props) {
  return (
    <div className="bg-paper border border-rule rounded-[14px] px-[22px] py-[18px] flex flex-col gap-4 items-center text-center">
      <div className="flex items-center justify-center gap-[10px]">
        <span
          className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
        >
          <Icon name={icon} size={17} stroke={1.7} />
        </span>
        <span className="font-mono text-[10.5px] tracking-[.13em] uppercase text-muted font-medium">
          {label}
        </span>
      </div>

      {tomorrow === undefined ? (
        <div className="flex flex-col items-center gap-[9px]">
          <span className={`font-serif font-semibold text-[46px] leading-[.85] ${todayColor}`}>
            {today}
          </span>
          <span className="font-mono text-[9.5px] tracking-[.1em] uppercase text-faint">
            {singleCaption}
          </span>
        </div>
      ) : (
        <div className="flex items-end justify-center gap-[30px]">
          <div className="flex flex-col items-center gap-[9px]">
            <span className={`font-serif font-semibold text-[46px] leading-[.85] ${todayColor}`}>
              {today}
            </span>
            <span className="font-mono text-[9.5px] tracking-[.1em] uppercase text-faint">
              {todayLabel}
            </span>
          </div>
          <div className="w-px self-stretch bg-hairline my-0.5" />
          <div className="flex flex-col items-center gap-[9px]">
            <span className={`font-serif font-semibold text-[46px] leading-[.85] ${tomorrowColor}`}>
              {tomorrow}
            </span>
            <span className="font-mono text-[9.5px] tracking-[.1em] uppercase text-faint">
              {tomorrowLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
