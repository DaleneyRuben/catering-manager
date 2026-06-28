import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { API_BASE } from '../../utils/env';
import { downloadReport } from '../../utils/downloadReport';
import { checkIsWeekend } from '../../utils/devFlags';
import { DaySelector, type DayOption } from './DaySelector';
import { ReportNotice } from './ReportNotice';
import { DISABLED_DOWNLOAD_STYLE } from './downloadButtonStyles';

const BASE = API_BASE;

function downloadDeliveryList(date: string) {
  return downloadReport(
    `${BASE}/reports/active-clients/download?date=${encodeURIComponent(date)}`,
    'lista-entrega.xlsx',
  );
}

export function DeliveryListCard() {
  const [selected, setSelected] = useState<DayOption>('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const dateForOption = (opt: DayOption) =>
    format(opt === 'today' ? today : addDays(today, 1), 'dd/MM/yyyy');
  const shortDateForOption = (opt: DayOption) =>
    format(opt === 'today' ? today : addDays(today, 1), 'dd/MM');

  const isSelectedWeekend = checkIsWeekend(selected === 'today' ? today : addDays(today, 1));

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
    <div className="flex-[1_1_340px] min-w-[320px] bg-paper border border-rule rounded-[14px] px-[26px] py-[24px] flex flex-col">
      <div className="flex items-center gap-[11px] mb-3">
        <span className="w-9 h-9 rounded-[10px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="clipboard-check" size={18} stroke={1.7} />
        </span>
        <h2 className="font-serif font-semibold text-[21px] text-ink">Lista de entrega</h2>
      </div>
      <p className="text-[13px] text-muted leading-[1.5] mb-[18px]">
        Descarga la lista de clientes que reciben su pedido en la fecha seleccionada.
      </p>

      <p className="font-mono text-[10px] tracking-[.1em] uppercase text-faint mb-[9px]">Fecha</p>
      <DaySelector selected={selected} onSelect={setSelected} dateLabel={shortDateForOption} />

      {isSelectedWeekend && <ReportNotice>No hay entregas los fines de semana.</ReportNotice>}

      {error && <p className="text-[12px] text-alert mb-4">{error}</p>}

      <Button
        onClick={handleDownload}
        disabled={isSelectedWeekend}
        loading={loading}
        leftIcon="download"
        className="mt-auto"
        style={isSelectedWeekend ? DISABLED_DOWNLOAD_STYLE : undefined}
      >
        Descargar .xlsx
      </Button>
    </div>
  );
}
