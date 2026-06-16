import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { usePlans } from '../hooks/usePlans';
import type { Plan } from '../types/client';
import { CreatePlanModal } from './plans/CreatePlanModal';
import { PlanCard } from './plans/PlanCard';
import { PlanCardSkeleton } from './plans/PlanCardSkeleton';
import { PlanEditModal } from './plans/PlanEditModal';

export function PlansPage() {
  const { plans, clientCounts, isLoading, isSaving, save, create, remove } = usePlans();
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = async () => {
    if (editPlan === null) return;
    await remove(editPlan.id);
    setEditPlan(null);
  };

  const renderPlans = () => {
    if (isLoading) return <PlanCardSkeleton />;
    if (plans.length === 0) {
      return (
        <div className="py-16 text-center bg-paper border border-rule rounded-lg">
          <p className="font-semibold text-ink">Sin planes</p>
          <p className="text-sm text-muted mt-1">Crea el primer plan usando el botón de arriba.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-list">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            clientCount={clientCounts[p.id] ?? 0}
            onClick={() => setEditPlan(p)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 py-5 lg:p-7 max-w-[1320px] mx-auto">
      <PageHeader
        label="Catálogo"
        title="Planes"
        action={
          <Button aria-label="Crear plan nuevo" onClick={() => setCreateOpen(true)} leftIcon="plus">
            Crear plan
          </Button>
        }
      />

      {renderPlans()}

      {createOpen && <CreatePlanModal onClose={() => setCreateOpen(false)} onSave={create} />}
      {editPlan && (
        <PlanEditModal
          plan={editPlan}
          clientCount={clientCounts[editPlan.id] ?? 0}
          isSaving={isSaving}
          onSave={(draft) => save(editPlan.id, draft)}
          onDelete={handleDelete}
          onClose={() => setEditPlan(null)}
        />
      )}
    </div>
  );
}
