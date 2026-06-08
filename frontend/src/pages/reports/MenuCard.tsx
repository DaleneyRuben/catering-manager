import { useState } from 'react';
import { format, addDays, isWeekend } from 'date-fns';
import { Icon } from '../../components/ui/Icon';
import { useMenu } from '../../hooks/useMenu';

import { API_BASE } from '../../utils/env';

type DayOption = 'today' | 'tomorrow';

const BASE = API_BASE;

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

async function downloadMenuCard(isoDate: string) {
  const res = await fetch(`${BASE}/reports/menu-card/download?date=${encodeURIComponent(isoDate)}`);
  if (!res.ok) throw new Error(`Error al generar el archivo: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dayMonth = format(new Date(`${isoDate}T12:00:00`), 'dd-MM');
  a.download = `Menu completo ${dayMonth}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MenuCard() {
  const [selected, setSelected] = useState<DayOption>('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { menus } = useMenu();

  const today = new Date();
  const isoForOption = (opt: DayOption) => toIso(opt === 'today' ? today : addDays(today, 1));
  const displayDate = (opt: DayOption) =>
    format(opt === 'today' ? today : addDays(today, 1), 'dd/MM/yyyy');

  const selectedIso = isoForOption(selected);
  const isSelectedWeekend = isWeekend(selected === 'today' ? today : addDays(today, 1));
  const menuExists = menus.some((m) => m.date === selectedIso);

  const handleDownload = async () => {
    setError(null);
    setLoading(true);
    try {
      await downloadMenuCard(selectedIso);
    } catch {
      setError('No se pudo generar el archivo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-paper border border-rule rounded-lg p-6 max-w-md">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="menu" size={16} className="text-olive-800" />
        <h2 className="text-[14px] font-semibold text-ink">Menú del día</h2>
      </div>
      <p className="text-[12px] text-muted mb-5">
        Descarga la carta del menú para la fecha seleccionada en formato Word.
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
              {displayDate(opt)}
            </span>
          </button>
        ))}
      </div>

      {isSelectedWeekend && (
        <p className="text-[12px] text-alert mb-4">No hay entregas los fines de semana.</p>
      )}

      {!isSelectedWeekend && !menuExists && (
        <p className="text-[12px] text-alert mb-4">No hay menú registrado para esta fecha.</p>
      )}

      {error && <p className="text-[12px] text-alert mb-4">{error}</p>}

      <div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading || isSelectedWeekend || !menuExists}
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
  );
}
