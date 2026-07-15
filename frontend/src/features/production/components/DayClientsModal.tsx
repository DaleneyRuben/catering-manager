import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { useProductionDay } from '@/features/production/hooks/useProductionDay';
import type { DayClient } from '@/features/production/types';

interface Props {
  date: string;
  onClose: () => void;
}

const capitalize = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

const dayTitle = (date: string) =>
  `Clientes activos · ${capitalize(format(parseISO(date), 'EEEE dd/MM', { locale: es }))}`;

function ClientRow({ client }: { client: DayClient }) {
  return (
    <Link
      to={`/clientes/${client.id}`}
      className="flex items-center gap-[13px] px-3.5 py-[11px] rounded-[10px] bg-paper border border-history-row-border transition-colors hover:border-olive-200 hover:bg-day-badge-bg"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink leading-tight truncate">{client.name}</p>
        <p className="font-mono text-[10.5px] tracking-[.02em] text-faint mt-[3px] truncate">
          {client.phoneNumber} · {client.deliveryZone}
        </p>
      </div>
      <span className="text-week-label shrink-0">
        <Icon name="arrow-right" size={15} stroke={1.8} />
      </span>
    </Link>
  );
}

export function DayClientsModal({ date, onClose }: Props) {
  const { dayClients, isLoading } = useProductionDay(date);

  const renderBody = () => {
    if (isLoading || !dayClients) {
      return <p className="font-mono text-[12px] text-faint py-3">Cargando…</p>;
    }
    if (dayClients.clients.length === 0) {
      return (
        <p className="text-[13.5px] text-week-label italic text-center py-10">
          Sin clientes activos
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {dayClients.clients.map((client) => (
          <ClientRow key={client.id} client={client} />
        ))}
      </div>
    );
  };

  const count = dayClients?.count ?? 0;

  return (
    <Modal
      onClose={onClose}
      className="w-[min(520px,92vw)] max-h-[82vh] flex flex-col overflow-hidden"
    >
      <div className="flex items-start gap-[13px] px-6 pt-[22px] pb-[18px] border-b border-hairline">
        <span className="w-9 h-9 rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="users" size={18} stroke={1.6} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-semibold text-[23px] leading-[1.1] text-ink">
            {dayTitle(date)}
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[.12em] text-faint mt-1">
            {count} {count === 1 ? 'cliente activo' : 'clientes activos'}
          </p>
        </div>
        <IconButton
          icon="x"
          label="Cerrar"
          onClick={onClose}
          size={19}
          stroke={1.8}
          className="p-1 rounded-[7px] shrink-0 text-faint hover:text-ink hover:bg-cream-2"
        />
      </div>

      <div className="overflow-y-auto px-6 pt-4 pb-[22px]">{renderBody()}</div>
    </Modal>
  );
}
