import { useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useClientList } from '../hooks/useClientList';
import { useClient } from '../hooks/useClient';
import { CLIENT_STATUS } from '../constants/clientStatus';
import { Icon } from '../components/ui/Icon';
import { RenewalModal } from '../components/modals/RenewalModal';
import { initials } from '../utils/string';
import type { Client } from '../types/client';

const RENEWAL_WINDOW_DAYS = 14;

function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

function expiryLabel(d: number): string {
  if (d === 0) return 'vence hoy';
  if (d < 0) return 'vencido';
  return `vence en ${d}d`;
}

function CandidateRow({
  client,
  kind,
  onClick,
}: {
  client: Client;
  kind: 'renew' | 'reactivate';
  onClick: () => void;
}) {
  const sub = client.subscriptions[0];
  const d = sub?.contractEndDate ? daysUntil(sub.contractEndDate) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-[18px] py-3 border-b border-rule text-left hover:bg-cream-2 transition-colors"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-[13px] font-semibold shrink-0 ${
          kind === 'renew' ? 'bg-olive-700 text-white' : 'bg-cream-2 text-ink-2'
        }`}
      >
        {initials(client.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink truncate">{client.name}</p>
        <p className="font-mono text-[10.5px] text-muted">{client.deliveryZone}</p>
      </div>
      {kind === 'renew' && d !== null && (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
            d <= 3 ? 'bg-alert-bg text-alert' : 'bg-warn-bg text-warn'
          }`}
        >
          {expiryLabel(d)}
        </span>
      )}
      {kind === 'reactivate' && sub?.contractEndDate && (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-rule text-muted">
          hace {Math.abs(daysUntil(sub.contractEndDate))}d
        </span>
      )}
      <Icon name="arrow-right" size={14} className="text-muted shrink-0" />
    </button>
  );
}

function RenewalModalWrapper({ client, onClose }: { client: Client; onClose: () => void }) {
  const isReactivation = client.status === CLIENT_STATUS.ENDED;
  const { renew } = useClient(String(client.id));

  return (
    <RenewalModal
      client={client}
      sub={client.subscriptions[0]}
      isReactivation={isReactivation}
      onClose={onClose}
      onRenew={renew}
    />
  );
}

export function RenewalsPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const cutoff = format(addDays(new Date(), RENEWAL_WINDOW_DAYS), 'yyyy-MM-dd');

  const { clients, isLoading } = useClientList({ limit: 200 });
  const [modalClient, setModalClient] = useState<Client | null>(null);

  const expiring = clients.filter((c) => {
    const sub = c.subscriptions[0];
    if (
      !sub?.contractEndDate ||
      c.status === CLIENT_STATUS.ENDED ||
      c.status === CLIENT_STATUS.PAUSED
    )
      return false;
    return sub.contractEndDate >= today && sub.contractEndDate <= cutoff;
  });

  const inactive = clients.filter((c) => c.status === CLIENT_STATUS.ENDED);

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-2">
            Cuentas
          </p>
          <h1 className="font-serif text-[42px] leading-none text-ink">
            Renovaciones <em>&amp;</em> reactivaciones
          </h1>
          <p className="text-[13px] text-muted mt-2.5 max-w-xl">
            Contratos por vencer y clientes anteriores listos para volver. Hacé clic en un cliente
            para renovar o reactivar sin crear una ficha nueva.
          </p>
        </div>
        <div className="flex gap-6 shrink-0">
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1">
              A renovar
            </p>
            <p className="font-serif text-[24px] leading-none text-olive-800">{expiring.length}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1">
              Inactivos
            </p>
            <p className="font-serif text-[24px] leading-none text-olive-800">{inactive.length}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted font-mono text-[13px]">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {/* Expiring column */}
          <div className="bg-paper border border-rule rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-rule">
              <Icon name="refresh" size={16} className="text-muted" />
              <p className="text-[13px] font-semibold text-ink flex-1">
                Por vencer (≤ {RENEWAL_WINDOW_DAYS} días)
              </p>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-warn-bg text-warn">
                {expiring.length}
              </span>
            </div>
            {expiring.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-5 text-center">
                <div className="w-12 h-12 rounded-full bg-cream-2 flex items-center justify-center mb-3 text-olive-700">
                  <Icon name="check" size={22} />
                </div>
                <p className="text-[13px] font-semibold text-ink mb-1">Sin renovaciones</p>
                <p className="font-mono text-[12px] text-muted">
                  No hay contratos que venzan en los próximos {RENEWAL_WINDOW_DAYS} días.
                </p>
              </div>
            ) : (
              expiring.map((c) => (
                <CandidateRow
                  key={c.id}
                  client={c}
                  kind="renew"
                  onClick={() => setModalClient(c)}
                />
              ))
            )}
          </div>

          {/* Inactive column */}
          <div className="bg-paper border border-rule rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-rule">
              <Icon name="users" size={16} className="text-muted" />
              <p className="text-[13px] font-semibold text-ink flex-1">
                Inactivos · listos para volver
              </p>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-rule text-muted">
                {inactive.length}
              </span>
            </div>
            {inactive.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-5 text-center">
                <div className="w-12 h-12 rounded-full bg-cream-2 flex items-center justify-center mb-3 text-olive-700">
                  <Icon name="users" size={22} />
                </div>
                <p className="text-[13px] font-semibold text-ink mb-1">Sin inactivos</p>
                <p className="font-mono text-[12px] text-muted">
                  Todos los clientes están vigentes.
                </p>
              </div>
            ) : (
              inactive.map((c) => (
                <CandidateRow
                  key={c.id}
                  client={c}
                  kind="reactivate"
                  onClick={() => setModalClient(c)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {modalClient && (
        <RenewalModalWrapper client={modalClient} onClose={() => setModalClient(null)} />
      )}
    </div>
  );
}
