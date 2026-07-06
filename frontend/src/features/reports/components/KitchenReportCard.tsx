import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { useMenu } from '@/features/menu/hooks/useMenu';
import { API_BASE } from '@/utils/env';
import { downloadReport } from '@/utils/downloadReport';
import { DaySelector } from '@/features/reports/components/DaySelector';
import { ReportNotice } from '@/features/reports/components/ReportNotice';
import { DISABLED_DOWNLOAD_STYLE } from '@/features/reports/components/downloadButtonStyles';
import { useDaySelector } from '@/features/reports/hooks/useDaySelector';

const BASE = API_BASE;

function downloadKitchenReport(isoDate: string) {
  return downloadReport(
    `${BASE}/reports/kitchen-report/download?date=${encodeURIComponent(isoDate)}`,
    'informe-cocina.docx',
  );
}

export function KitchenReportCard() {
  const { selected, setSelected, resolvedDate, isWeekend, shortDateForOption } = useDaySelector();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { menus } = useMenu();

  const selectedIso = format(resolvedDate, 'yyyy-MM-dd');
  const menuExists = menus.some((m) => m.date === selectedIso);

  const handleDownload = async () => {
    setError(null);
    setLoading(true);
    try {
      await downloadKitchenReport(selectedIso);
    } catch {
      setError('No se pudo generar el archivo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-[1_1_340px] min-w-[320px] bg-paper border border-rule rounded-[14px] px-[26px] py-[24px] flex flex-col">
      <div className="flex items-center gap-[11px] mb-3">
        <span className="w-9 h-9 rounded-[10px] bg-warn-bg text-warn flex items-center justify-center shrink-0">
          <Icon name="utensils" size={18} stroke={1.7} />
        </span>
        <h2 className="font-serif font-semibold text-[21px] text-ink">Informe de cocina</h2>
      </div>
      <p className="text-[13px] text-muted leading-[1.5] mb-[18px]">
        Descarga el informe de cocina para la fecha seleccionada en formato Word.
      </p>

      <p className="font-mono text-[10px] tracking-[.1em] uppercase text-faint mb-[9px]">Fecha</p>
      <DaySelector selected={selected} onSelect={setSelected} dateLabel={shortDateForOption} />

      {isWeekend && <ReportNotice>No hay entregas los fines de semana.</ReportNotice>}

      {!isWeekend && !menuExists && (
        <ReportNotice>No hay menú registrado para esta fecha.</ReportNotice>
      )}

      {error && <p className="text-[12px] text-alert mb-4">{error}</p>}

      <Button
        onClick={handleDownload}
        disabled={isWeekend || !menuExists}
        loading={loading}
        leftIcon="download"
        className="mt-auto"
        style={isWeekend || !menuExists ? DISABLED_DOWNLOAD_STYLE : undefined}
      >
        Descargar .docx
      </Button>
    </div>
  );
}
