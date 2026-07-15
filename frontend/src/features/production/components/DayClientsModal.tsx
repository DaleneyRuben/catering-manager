import { Link } from 'react-router-dom';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { Skeleton } from '@ui/Skeleton';
import { useProductionDay } from '@/features/production/hooks/useProductionDay';
import { formatWeekdayDate } from '@/utils/format';
import type { DayClient } from '@/features/production/types';

interface Props {
  date: string;
  onClose: () => void;
}

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
  const { dayClients, isLoading, error } = useProductionDay(date);

  const renderBody = () => {
    if (error) {
      return (
        <p className="font-mono text-[12px] text-faint py-3">
          No se pudo cargar la lista de clientes. Intenta de nuevo.
        </p>
      );
    }
    if (isLoading || !dayClients) {
      return (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="w-full h-[54px] rounded-[10px]" />
          ))}
        </div>
      );
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

  const countLabel = () => {
    if (error) return null;
    if (!dayClients) return <Skeleton className="w-36 h-3 mt-1.5" />;
    const { count } = dayClients;
    return (
      <p className="font-mono text-[10.5px] uppercase tracking-[.12em] text-faint mt-1">
        {count} {count === 1 ? 'cliente activo' : 'clientes activos'}
      </p>
    );
  };

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
            Clientes activos · {formatWeekdayDate(date)}
          </p>
          {countLabel()}
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
