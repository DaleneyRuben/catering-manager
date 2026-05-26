export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="inline-block w-6 h-6 rounded-full border-2 border-olive-800 border-t-transparent animate-spin" />
      <p className="font-mono text-[11px] uppercase tracking-[.14em] text-muted">Cargando...</p>
    </div>
  );
}
