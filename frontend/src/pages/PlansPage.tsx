import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/PageLoader';
import { usePlans } from '../hooks/usePlans';
import type { Plan } from '../types/client';
import { CreatePlanModal } from './plans/CreatePlanModal';
import { PlanCard } from './plans/PlanCard';
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

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <div className="flex items-end gap-6 mb-7 flex-wrap">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
            Catálogo
          </p>
          <h1 className="font-serif text-[44px] leading-none text-ink">Planes</h1>
          <p className="text-[13px] text-muted mt-2.5 max-w-[54ch]">
            Cada plan define qué comidas incluye. Los planes son dinámicos — combina comidas en
            cualquier proporción.
          </p>
        </div>
        <div className="ml-auto">
          <Button aria-label="Crear plan nuevo" onClick={() => setCreateOpen(true)} leftIcon="plus">
            Crear plan
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="py-16 text-center bg-paper border border-rule rounded-lg">
          <p className="font-semibold text-ink">Sin planes</p>
          <p className="text-sm text-muted mt-1">Crea el primer plan usando el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              clientCount={clientCounts[p.id] ?? 0}
              onClick={() => setEditPlan(p)}
            />
          ))}
        </div>
      )}

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
