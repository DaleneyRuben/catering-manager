// Sits beside the month stepper on the month still running, and is absent entirely on a closed one
// so paging back reads as settled rather than as a marker that turned off.
export function OpenMonthPill() {
  return (
    <div
      title="Los totales de este mes todavía pueden cambiar"
      className="flex items-center gap-[7px] font-mono text-[10px] tracking-[.13em] uppercase text-open-month-text bg-open-month-bg border border-open-month-border rounded-full pl-[9px] pr-[11px] py-[5px]"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-open-month-dot shrink-0" />
      Mes en curso
    </div>
  );
}
