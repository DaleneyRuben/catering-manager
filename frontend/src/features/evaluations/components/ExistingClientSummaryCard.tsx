import { Icon } from '@ui/Icon';
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  STATUS_DOT_CLASSES,
} from '@/features/clients/constants/clientStatus';
import { formatRenewalMeta } from '@/features/clients/utils/queuedRenewal';
import { formatDate } from '@/utils/format';
import type { Client, Subscription } from '@/features/clients/types';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  queuedRenewal?: Subscription | null;
}

export function ExistingClientSummaryCard({ client, sub, queuedRenewal }: Props) {
  return (
    <div className="bg-paper border border-rule rounded-[14px] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-serif font-semibold text-[22px] leading-[1.1] text-ink truncate">
            {client.name}
          </h2>
          <p className="font-mono text-[11px] text-faint mt-2">{client.phoneNumber}</p>
        </div>
        <span
          className={`inline-flex items-center gap-[7px] pl-[10px] pr-3 py-[5px] rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 ${STATUS_CLASSES[client.status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_CLASSES[client.status]}`} />
          {STATUS_LABELS[client.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-[14px]">
        <div>
          <p className="text-[9.5px] font-mono uppercase tracking-[.1em] text-faint mb-2">Plan</p>
          <p className="text-[13.5px] text-ink-2">{sub?.plan.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-[9.5px] font-mono uppercase tracking-[.1em] text-faint mb-2">
            Fin de contrato
          </p>
          <p className="font-mono text-[13.5px] text-ink-2">{formatDate(sub?.contractEndDate)}</p>
        </div>
      </div>

      {queuedRenewal && (
        <div className="flex items-start gap-[11px] mt-[18px] px-[15px] py-[13px] rounded-[11px] bg-success-soft-bg border border-olive-200">
          <Icon name="refresh" size={15} className="text-success-text shrink-0 mt-[2px]" />
          <div className="min-w-0 flex flex-col gap-1">
            <p className="text-[12.5px] font-semibold text-olive-800">
              Renovación ya registrada
              {queuedRenewal.startDate ? '' : ' · sin fecha de inicio'}
            </p>
            <p className="font-mono text-[11px] tabular-nums text-success-text">
              {formatRenewalMeta(queuedRenewal)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
