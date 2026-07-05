const formatUptime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

interface Props {
  apiLatencyMs: number | undefined;
  dbLatencyMs: number | undefined;
  memoryUsedMb: number;
  uptimeSeconds: number;
}

export function HealthMetricsGrid({
  apiLatencyMs,
  dbLatencyMs,
  memoryUsedMb,
  uptimeSeconds,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
      <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
        <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">API</p>
        <p className="flex items-baseline gap-1.5">
          <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
            {apiLatencyMs ?? '—'}
          </span>
          <span className="font-mono text-[11px] text-faint">ms</span>
        </p>
      </div>
      <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
        <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">
          Base de datos
        </p>
        <p className="flex items-baseline gap-1.5">
          <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
            {dbLatencyMs ?? '—'}
          </span>
          <span className="font-mono text-[11px] text-faint">ms</span>
        </p>
      </div>
      <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
        <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">
          Memoria
        </p>
        <p className="flex items-baseline gap-1.5">
          <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
            {memoryUsedMb}
          </span>
          <span className="font-mono text-[11px] text-faint">MB</span>
        </p>
      </div>
      <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
        <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">
          Tiempo activo
        </p>
        <p className="flex items-baseline gap-1.5">
          <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
            {formatUptime(uptimeSeconds)}
          </span>
        </p>
      </div>
    </div>
  );
}
