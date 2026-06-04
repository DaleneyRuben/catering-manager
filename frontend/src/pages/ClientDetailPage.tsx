import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { remainingDeliveryDays } from '../utils/businessDays';
import { Icon } from '../components/ui/Icon';
import { useClient } from '../hooks/useClient';
import { MEAL_LABELS } from '../constants/meals';
import { clientStatus } from '../types/client';
import { CLIENT_STATUS } from '../constants/clientStatus';
import { formatDate } from '../utils/format';
import { ClientEditModal } from './ClientEditModal';
import type { EditDraft } from './ClientEditModal';
import { ConfirmFinalizeModal } from './ConfirmFinalizeModal';
import { SuspendModal } from './SuspendModal';
import { ClientOverviewTab } from './ClientOverviewTab';
import { ClientHistoryTab } from './ClientHistoryTab';
import { ClientHeader } from './ClientHeader';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PageLoader } from '../components/ui/PageLoader';

type TabId = 'overview' | 'plan' | 'suspensions' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Resumen' },
  { id: 'plan', label: 'Plan + facturación' },
  { id: 'suspensions', label: 'Suspensiones' },
  { id: 'history', label: 'Historial' },
];

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, isLoading, update, isUpdating, finalize, deleteClient, updateSuspensions } =
    useClient(id!);
  const [tab, setTab] = useState<TabId>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);

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
      deliveryZone: draft.deliveryZone,
      delivery: draft.delivery,
      nit: draft.nit || null,
      businessName: draft.businessName || null,
      underlyingDiseases: draft.underlyingDiseases,
      restrictions: draft.restrictions,
    });
    setEditOpen(false);
  };

  if (isLoading) return <PageLoader />;

  if (!client) {
    return (
      <div className="p-7 max-w-[1320px] mx-auto">
        <p className="text-muted text-[13px]">Cliente no encontrado.</p>
      </div>
    );
  }

  const sub = client.subscriptions[0];
  const status = clientStatus(client);
  const isEnded = status === CLIENT_STATUS.ENDED;
  const visibleTabs = isEnded
    ? TABS.filter((t) => t.id !== 'plan' && t.id !== 'suspensions')
    : TABS;
  const activeTab = isEnded && (tab === 'plan' || tab === 'suspensions') ? 'overview' : tab;
  const remaining = sub
    ? remainingDeliveryDays(parseISO(sub.startDate), parseISO(sub.contractEndDate))
    : 0;

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <ClientHeader
        client={client}
        status={status}
        isUpdating={isUpdating}
        onToggleActive={handleToggleActive}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onBack={() => navigate('/clientes')}
      />

      <div role="tablist" className="flex border-b border-rule mb-5">
        {visibleTabs.map(({ id: tId, label }) => (
          <button
            key={tId}
            type="button"
            role="tab"
            aria-selected={activeTab === tId}
            onClick={() => setTab(tId)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tId
                ? 'border-olive-800 text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <ClientOverviewTab
          client={client}
          sub={sub}
          remaining={remaining}
          onFinalize={() => setFinalizeOpen(true)}
          onSuspend={() => setSuspendOpen(true)}
        />
      )}

      {activeTab === 'plan' && (
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
                        {Number(sub.plan.price) - sub.discount}
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
                      <p className="font-mono text-[14px] text-muted">
                        {sub.discount > 0 ? sub.discount : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        Total
                      </p>
                      <p className="font-mono text-[14px] font-bold text-olive-800">
                        {Number(sub.plan.price) - sub.discount}
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

      {activeTab === 'suspensions' && (
        <div className="bg-paper border border-rule rounded-lg p-5">
          <div className="flex items-center mb-4">
            <div>
              <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-0.5">
                Días suspendidos
              </p>
              <p className="font-serif text-[32px] leading-none text-alert">
                {sub?.suspendedDates?.length ?? 0}
              </p>
            </div>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setSuspendOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
              >
                <Icon name="calendar" size={14} />
                Suspender días
              </button>
            </div>
          </div>
          {sub && (sub.suspendedDates?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {[...(sub.suspendedDates ?? [])].sort().map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-1 rounded-full text-[11px] font-mono"
                  style={{ background: '#f3eedc', color: '#6b4f08' }}
                >
                  {formatDate(d)}
                </span>
              ))}
            </div>
          ) : (
            <p className="font-mono text-[12px] text-muted">Sin suspensiones registradas.</p>
          )}
        </div>
      )}

      {activeTab === 'history' && <ClientHistoryTab clientId={client.id} />}

      {editOpen && (
        <ClientEditModal
          client={client}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
          isSaving={isUpdating}
        />
      )}
      {finalizeOpen && (
        <ConfirmFinalizeModal
          clientName={client.name}
          onClose={() => setFinalizeOpen(false)}
          onConfirm={finalize}
        />
      )}
      {deleteOpen && (
        <ConfirmModal
          title="Eliminar cliente"
          message={
            <>
              ¿Seguro que querés eliminar a <span className="font-semibold">{client.name}</span>?
              Esta acción no se puede deshacer.
            </>
          }
          confirmLabel="Eliminar"
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            await deleteClient();
            navigate('/clientes');
          }}
        />
      )}
      {suspendOpen && sub && (
        <SuspendModal
          sub={sub}
          clientName={client.name}
          onClose={() => setSuspendOpen(false)}
          onSave={(dates) => updateSuspensions(sub.id, dates)}
        />
      )}
    </div>
  );
}
