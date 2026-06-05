import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Icon } from '../components/ui/Icon';

type DayOption = 'today' | 'tomorrow';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function downloadDeliveryList(date: string) {
  const res = await fetch(
    `${BASE}/reports/active-clients/download?date=${encodeURIComponent(date)}`,
  );
  if (!res.ok) throw new Error(`Error al generar el archivo: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes-${date}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [selected, setSelected] = useState<DayOption>('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const dateForOption = (opt: DayOption) =>
    format(opt === 'today' ? today : addDays(today, 1), 'dd/MM/yyyy');

  const handleDownload = async () => {
    setError(null);
    setLoading(true);
    try {
      await downloadDeliveryList(dateForOption(selected));
    } catch {
      setError('No se pudo generar el archivo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <div className="mb-7">
        <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
          Analítica
        </p>
        <h1 className="font-serif text-[44px] leading-none text-ink">Informes</h1>
        <p className="text-[13px] text-muted mt-2.5">
          Genera informes de clientes activos, vencimientos y métricas de servicio.
        </p>
      </div>

      <div className="bg-paper border border-rule rounded-lg p-6 max-w-md">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="chef" size={16} className="text-olive-800" />
          <h2 className="text-[14px] font-semibold text-ink">Lista de entrega</h2>
        </div>
        <p className="text-[12px] text-muted mb-5">
          Descarga la lista de clientes que reciben su pedido en la fecha seleccionada.
        </p>

        <div className="inline-flex p-[3px] bg-cream-2 border border-rule rounded-[7px] text-[12px] mb-5">
          {(['today', 'tomorrow'] as DayOption[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
              className={[
                'px-4 py-1.5 rounded-[5px] font-semibold transition-colors',
                selected === opt ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              {opt === 'today' ? 'Hoy' : 'Mañana'}
              <span className="ml-1.5 font-mono font-normal text-[10.5px] text-muted">
                {dateForOption(opt)}
              </span>
            </button>
          ))}
        </div>

        {error && <p className="text-[12px] text-alert mb-4">{error}</p>}

        <div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Icon name="download" size={14} />
            )}
            Descargar .docx
          </button>
        </div>
      </div>
    </div>
  );
}
