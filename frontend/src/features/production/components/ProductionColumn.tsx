interface Props {
  label: string;
  names: string[];
}

export function ProductionColumn({ label, names }: Props) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 pb-[11px] border-b border-hairline mb-1.5">
        <span className="font-mono text-[10px] tracking-[.11em] uppercase text-chip-text font-semibold">
          {label}
        </span>
        <span className="font-mono text-[11px] font-semibold text-olive-700 bg-olive-100 border border-count-chip-border rounded-full min-w-6 text-center px-2 py-0.5 shrink-0">
          {names.length}
        </span>
      </div>
      {names.length > 0 ? (
        <div className="flex flex-col">
          {names.map((name) => (
            <div
              key={name}
              className="text-[13.5px] text-client-row py-2 border-b border-cream-2 leading-[1.3]"
            >
              {name}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-empty-italic italic py-[9px]">Sin clientes</div>
      )}
    </div>
  );
}
