import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useMenu } from '../../hooks/useMenu';
import { API_BASE } from '../../utils/env';
import { downloadReport } from '../../utils/downloadReport';
import { checkIsWeekend } from '../../utils/devFlags';

type DayOption = 'today' | 'tomorrow';

const BASE = API_BASE;

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

function downloadMenuCard(isoDate: string) {
  return downloadReport(
    `${BASE}/reports/menu-card/download?date=${encodeURIComponent(isoDate)}`,
    'menu.docx',
  );
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
  const isSelectedWeekend = checkIsWeekend(selected === 'today' ? today : addDays(today, 1));
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

      <Button
        onClick={handleDownload}
        disabled={isSelectedWeekend || !menuExists}
        loading={loading}
        leftIcon="download"
      >
        Descargar .docx
      </Button>
    </div>
  );
}
