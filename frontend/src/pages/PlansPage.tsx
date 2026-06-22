import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { usePlans } from '../hooks/usePlans';
import type { Plan } from '../types/client';
import { PlanCard } from './plans/PlanCard';
import { PlanCardSkeleton } from './plans/PlanCardSkeleton';
import { PlanModal } from './plans/PlanModal';

export function PlansPage() {
  const { plans, clientCounts, isLoading, isSaving, isCreating, save, create, remove } = usePlans();
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const allPrices = plans.map((p) => p.price);
  const planCountLabel = plans.length === 1 ? '1 plan activo' : `${plans.length} planes activos`;

  const handleDelete = async () => {
    if (deletePlan === null) return;
    await remove(deletePlan.id);
    setDeletePlan(null);
  };

  const renderPlans = () => {
    if (isLoading) return <PlanCardSkeleton />;
    if (plans.length === 0) {
      return (
        <div className="py-16 px-6 text-center bg-paper border border-rule rounded-[14px] flex flex-col items-center gap-3.5">
          <span className="w-[52px] h-[52px] rounded-[14px] bg-cream-2 text-[#c8c4ad] flex items-center justify-center">
            <Icon name="plan" size={26} stroke={1.4} />
          </span>
          <p className="font-serif font-semibold text-[22px] text-ink-2">Sin planes</p>
          <p className="text-[13.5px] text-faint max-w-[300px] leading-[1.5]">
            Crea el primer plan de alimentación para asignarlo a tus clientes.
          </p>
          <Button onClick={() => setCreateOpen(true)} leftIcon="plus" size="sm" className="mt-1">
            Crear primer plan
          </Button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 stagger-list">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            clientCount={clientCounts[p.id] ?? 0}
            allPrices={allPrices}
            onEdit={() => setEditPlan(p)}
            onDelete={() => setDeletePlan(p)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader
        label="Catálogo"
        title="Planes"
        action={
          <Button aria-label="Crear plan nuevo" onClick={() => setCreateOpen(true)} leftIcon="plus">
            Crear plan
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-5 flex-wrap mb-5">
        <p className="text-[14px] text-muted max-w-[560px] leading-[1.5]">
          Cada plan define los tiempos de comida incluidos y su precio mensual. Asigna un plan a
          cada cliente desde su ficha.
        </p>
        <p className="font-mono text-[11.5px] tracking-[.04em] text-muted uppercase whitespace-nowrap">
          {planCountLabel}
        </p>
      </div>

      {renderPlans()}

      {createOpen && (
        <PlanModal
          mode="create"
          isSaving={isCreating}
          onSave={create}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {editPlan && (
        <PlanModal
          mode="edit"
          plan={editPlan}
          clientCount={clientCounts[editPlan.id] ?? 0}
          isSaving={isSaving}
          onSave={(draft) => save(editPlan.id, draft)}
          onClose={() => setEditPlan(null)}
        />
      )}
      {deletePlan && (
        <ConfirmModal
          title="Eliminar plan"
          message={
            <>
              ¿Seguro que querés eliminar el plan{' '}
              <span className="font-semibold">{deletePlan.name}</span>? Los clientes asignados
              quedarán sin plan. Esta acción no se puede deshacer.
            </>
          }
          confirmLabel="Eliminar"
          onClose={() => setDeletePlan(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
