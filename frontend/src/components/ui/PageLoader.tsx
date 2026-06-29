import logo from '@/assets/logo.png';

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <img src={logo} alt="La Oliva" className="w-32 h-auto" />
      <span className="inline-block w-5 h-5 rounded-full border-2 border-olive-800 border-t-transparent animate-spin" />
      <p className="font-mono text-[11px] uppercase tracking-[.14em] text-muted">Cargando...</p>
    </div>
  );
}
