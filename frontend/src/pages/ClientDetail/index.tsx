import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { remainingDeliveryDays } from '../../utils/businessDays';
import { useClient } from '../../hooks/useClient';
import { CLIENT_STATUS } from '../../constants/clientStatus';
import { formatDate } from '../../utils/format';
import { ClientEditModal } from '../../components/modals/ClientEditModal';
import type { EditDraft } from '../../components/modals/ClientEditModal';
import { ConfirmFinalizeModal } from '../../components/modals/ConfirmFinalizeModal';
import { SuspendModal } from '../../components/modals/SuspendModal';
import { ClientOverviewTab } from './ClientOverviewTab';
import { ClientHistoryTab } from './ClientHistoryTab';
import { ClientPlanTab } from './ClientPlanTab';
import { ClientHeader } from './ClientHeader';
import { RenewalModal } from '../../components/modals/RenewalModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/PageLoader';
import { Tabs } from '../../components/ui/Tabs';

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
  const {
    client,
    isLoading,
    update,
    isUpdating,
    finalize,
    deleteClient,
    updateSuspensions,
    updateContract,
    renew,
  } = useClient(id!);
  const [tab, setTab] = useState<TabId>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const handleToggleActive = async () => {
    if (!client) return;
    // pausedSince !== null means currently paused → resume (null); null means active → pause (now)
    await update({ pausedSince: client.pausedSince !== null ? null : new Date().toISOString() });
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
  const { status } = client;
  const isEnded = status === CLIENT_STATUS.ENDED;
  const visibleTabs = isEnded
    ? TABS.filter((t) => t.id !== 'plan' && t.id !== 'suspensions')
    : TABS;
  const activeTab = isEnded && (tab === 'plan' || tab === 'suspensions') ? 'overview' : tab;
  const remaining =
    sub && sub.startDate && sub.contractEndDate
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
        onBack={() => navigate(-1)}
        onRenew={() => setRenewOpen(true)}
      />

      <Tabs
        tabs={visibleTabs}
        activeId={activeTab}
        onChange={(tabId) => setTab(tabId as TabId)}
        className="mb-5"
      />

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
        <ClientPlanTab
          client={client}
          sub={sub}
          remaining={remaining}
          onUpdateContract={(draft) => updateContract(sub!.id, draft)}
        />
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
              <Button onClick={() => setSuspendOpen(true)} leftIcon="calendar">
                Suspender días
              </Button>
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
      {renewOpen && (
        <RenewalModal
          client={client}
          sub={sub}
          isReactivation={status === CLIENT_STATUS.ENDED}
          onClose={() => setRenewOpen(false)}
          onRenew={renew}
        />
      )}
    </div>
  );
}
