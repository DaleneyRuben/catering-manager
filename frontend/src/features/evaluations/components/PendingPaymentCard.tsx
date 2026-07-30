import { IconButton } from '@ui/IconButton';
import { formatDate } from '@/utils/format';
import type { PendingPaymentClient } from '@/features/evaluations/types';

interface Props {
  client: PendingPaymentClient;
  onMarkPaid: (client: PendingPaymentClient) => void;
  onDelete: (client: PendingPaymentClient) => void;
}

export function PendingPaymentCard({ client, onMarkPaid, onDelete }: Props) {
  const subscription = client.subscriptions[0];
  const { plan } = subscription;
  const total = plan.price - subscription.discount;

  return (
    <div className="bg-paper border border-rule rounded-[14px] overflow-hidden flex flex-col hover:shadow-[var(--shadow-card-hover)] hover:border-olive-200 transition-all">
      <div className="px-5 pt-[18px] pb-4 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="min-w-0">
            <h3 className="font-serif font-semibold text-[22px] leading-[1.1] text-ink truncate">
              {client.name}
            </h3>
            <p className="font-mono text-[10.5px] text-faint mt-[6px]">
              {client.phoneNumber} · {plan.name}
            </p>
          </div>
          <span className="inline-flex items-center gap-[6px] text-[11px] font-semibold px-[10px] py-[4px] rounded-full bg-warn-bg text-warn border border-warn-border shrink-0 whitespace-nowrap">
            <span className="w-[6px] h-[6px] rounded-full bg-warn-dot shrink-0" />
            Pendiente de pago
          </span>
        </div>
        <div className="flex items-baseline gap-[6px] mb-3">
          <span className="font-mono text-[12px] text-faint">Bs</span>
          <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
            {total.toLocaleString('es-BO')}
          </span>
          <span className="font-mono text-[11px] text-faint">/mes</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted tabular-nums">
          <span>
            {formatDate(subscription.startDate)} → {formatDate(subscription.contractEndDate)}
          </span>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-cream-2 flex items-center justify-end gap-0">
        <IconButton
          icon="check"
          label="Marcar como pagado"
          onClick={() => onMarkPaid(client)}
          size={17}
          stroke={1.9}
          className="w-[34px] h-[34px] rounded-lg text-plan-edit hover:bg-olive-100 hover:text-olive-700"
        />
        <IconButton
          icon="trash"
          label="Eliminar"
          onClick={() => onDelete(client)}
          size={16}
          stroke={1.7}
          className="w-[34px] h-[34px] rounded-lg text-plan-delete hover:bg-danger-bg hover:text-danger"
        />
      </div>
    </div>
  );
}
