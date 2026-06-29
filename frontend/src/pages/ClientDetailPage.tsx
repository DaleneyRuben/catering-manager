import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { remainingDeliveryDays } from '@/utils/businessDays';
import { useClient } from '@/features/clients/hooks/useClient';
import { CLIENT_STATUS } from '@/constants/clientStatus';
import { ClientEditModal } from '@/features/clients/components/modals/ClientEditModal';
import type { EditDraft } from '@/features/clients/components/modals/ClientEditModal';
import { ConfirmFinalizeModal } from '@/features/clients/components/modals/ConfirmFinalizeModal';
import { SuspendModal } from '@/features/clients/components/modals/SuspendModal';
import { ClientOverviewTab } from '@/features/clients/components/detail/ClientOverviewTab';
import { ClientHistoryTab } from '@/features/clients/components/detail/ClientHistoryTab';
import { ClientPlanTab } from '@/features/clients/components/detail/ClientPlanTab';
import { ClientHeader } from '@/features/clients/components/detail/ClientHeader';
import { RenewalModal } from '@/features/clients/components/modals/RenewalModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Tabs } from '@/components/ui/Tabs';
import { ClientDetailSkeleton } from '@/features/clients/components/detail/ClientDetailSkeleton';

type TabId = 'overview' | 'plan' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Resumen' },
  { id: 'plan', label: 'Plan + facturación' },
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
    updateBilling,
    updateInstructions,
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

  if (isLoading) return <ClientDetailSkeleton />;

  if (!client) {
    return (
      <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
        <p className="text-muted text-[13px]">Cliente no encontrado.</p>
      </div>
    );
  }

  const sub = client.subscriptions[0];
  const { status } = client;
  const isEnded = status === CLIENT_STATUS.ENDED;
  const visibleTabs = isEnded ? TABS.filter((t) => t.id !== 'plan') : TABS;
  const activeTab = isEnded && tab === 'plan' ? 'overview' : tab;
  const remaining =
    sub && sub.startDate && sub.contractEndDate
      ? remainingDeliveryDays(parseISO(sub.startDate), parseISO(sub.contractEndDate))
      : 0;

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <ClientHeader
        client={client}
        status={status}
        isUpdating={isUpdating}
        onToggleActive={handleToggleActive}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onFinalize={() => setFinalizeOpen(true)}
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
        <ClientOverviewTab client={client} sub={sub} remaining={remaining} />
      )}

      {activeTab === 'plan' && (
        <ClientPlanTab
          client={client}
          sub={sub}
          remaining={remaining}
          onUpdateContract={(draft) => updateContract(sub!.id, draft)}
          onUpdateBilling={(discount) => updateBilling(sub!.id, discount)}
          onUpdateInstructions={(si) => updateInstructions(sub!.id, si)}
          onSuspend={() => setSuspendOpen(true)}
        />
      )}

      {activeTab === 'history' && (
        <ClientHistoryTab clientId={client.id} currentPlanName={sub?.plan.name ?? null} />
      )}

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
