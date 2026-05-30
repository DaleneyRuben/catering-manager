import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { differenceInDays, differenceInYears, parseISO } from 'date-fns';
import { Icon } from '../components/ui/Icon';
import { useClient } from '../hooks/useClient';
import { MEAL_LABELS } from '../constants/meals';
import { clientStatus } from '../types/client';
import { STATUS_LABELS, STATUS_CLASSES } from '../constants/clientStatus';
import { SEX_LABELS } from '../constants/clientOptions';
import { formatDate } from '../utils/format';
import { ClientEditModal } from './ClientEditModal';
import type { EditDraft } from './ClientEditModal';
import { ClientOverviewTab } from './ClientOverviewTab';
import { ClientHistoryTab } from './ClientHistoryTab';

type TabId = 'overview' | 'plan' | 'suspensions' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Resumen' },
  { id: 'plan', label: 'Plan + facturación' },
  { id: 'suspensions', label: 'Suspensiones' },
  { id: 'history', label: 'Historial' },
];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, update, isUpdating } = useClient(id!);
  const [tab, setTab] = useState<TabId>('overview');
  const [editOpen, setEditOpen] = useState(false);

  const handleToggleActive = async () => {
    if (!client) return;
    await update({ isActive: !client.isActive });
  };

  const handleSave = async (draft: EditDraft) => {
    await update({
      name: draft.name,
      sex: draft.sex,
      dateOfBirth: draft.dateOfBirth,
      phoneNumber: draft.phoneNumber,
      address: draft.address,
      zone: draft.zone,
      delivery: draft.delivery,
      nit: draft.nit || null,
      businessName: draft.businessName || null,
      underlyingDiseases: draft.underlyingDiseases,
      restrictions: draft.restrictions,
    });
    setEditOpen(false);
  };

  if (!client) {
    return (
      <div className="p-7 max-w-[1320px] mx-auto">
        <p className="text-muted text-[13px]">Cargando…</p>
      </div>
    );
  }

  const sub = client.subscriptions[0];
  const status = clientStatus(client);
  const age = differenceInYears(new Date(), parseISO(client.dateOfBirth));
  const remaining = sub ? differenceInDays(parseISO(sub.contractEndDate), new Date()) : 0;

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <button
        type="button"
        onClick={() => navigate('/clientes')}
        className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink mb-5 transition-colors"
      >
        <Icon name="arrow-left" size={13} />
        Clientes
      </button>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-olive-800 text-white flex items-center justify-center font-serif text-[26px] font-semibold shrink-0">
          {initials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-[36px] leading-none text-ink">{client.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono ${STATUS_CLASSES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="font-mono text-[12px] text-muted mt-1.5">
            {age} años · {SEX_LABELS[client.sex] ?? client.sex} · {client.zone} ·{' '}
            {client.phoneNumber}
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {client.isActive ? (
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="calendar" size={14} />
              )}
              Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="check" size={14} />
              )}
              Reanudar
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            <Icon name="settings" size={14} />
            Editar
          </button>
        </div>
      </div>

      <div role="tablist" className="flex border-b border-rule mb-5">
        {TABS.map(({ id: tId, label }) => (
          <button
            key={tId}
            type="button"
            role="tab"
            aria-selected={tab === tId}
            onClick={() => setTab(tId)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              tab === tId
                ? 'border-olive-800 text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <ClientOverviewTab client={client} sub={sub} remaining={remaining} />}

      {tab === 'plan' && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-paper border border-rule rounded-lg p-5">
              {sub ? (
                <>
                  <div className="flex items-start flex-wrap gap-3 mb-4">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                        Plan asignado
                      </p>
                      <p className="font-serif text-[28px]">{sub.plan.name}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-mono text-[10.5px] text-muted">Total mensual</p>
                      <p className="font-serif text-[40px] text-olive-800 tabular-nums">
                        {sub.plan.price}
                      </p>
                    </div>
                  </div>
                  <hr className="border-rule mb-4" />
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {sub.plan.meals.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-100 border border-rule text-ink"
                      >
                        {MEAL_LABELS[m] ?? m}
                      </span>
                    ))}
                  </div>
                  <hr className="border-rule mb-4" />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Precio
                      </p>
                      <p className="font-mono text-[14px]">{sub.plan.price}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Descuento
                      </p>
                      <p className="font-mono text-[14px] text-muted">—</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Total
                      </p>
                      <p className="font-mono text-[14px] font-bold text-olive-800">
                        {sub.plan.price}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-muted">Sin suscripción activa.</p>
              )}
            </div>
          </div>
          {sub && (
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
              <div className="bg-paper border border-rule rounded-lg p-5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                  Contrato
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Firma
                    </p>
                    <p className="font-mono text-[13px]">{formatDate(sub.contractDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Inicio
                    </p>
                    <p className="font-mono text-[13px]">{formatDate(sub.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Fin</p>
                    <p className="font-mono text-[13px]">{formatDate(sub.contractEndDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Restan
                    </p>
                    <p className="font-mono text-[13px]">{remaining} d. hábiles</p>
                  </div>
                </div>
              </div>
              <div className="bg-paper border border-rule rounded-lg p-5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                  Facturación
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">NIT</p>
                    <p className="font-mono text-[13px]">{client.nit || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Razón social
                    </p>
                    <p className="font-mono text-[13px] break-words">
                      {client.businessName || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'suspensions' && (
        <div className="bg-paper border border-rule rounded-lg p-10 text-center">
          <p className="font-mono text-[13px] text-muted">Sin suspensiones registradas.</p>
        </div>
      )}

      {tab === 'history' && <ClientHistoryTab clientId={client.id} />}

      {editOpen && (
        <ClientEditModal
          client={client}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
          isSaving={isUpdating}
        />
      )}
    </div>
  );
}
