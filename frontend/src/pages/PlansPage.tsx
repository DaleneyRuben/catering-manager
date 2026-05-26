import { useEffect, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import api from '../services/api';
import type { Client, Plan } from '../types/client';
import { ConfirmDeleteModal } from './plans/ConfirmDeleteModal';
import { CreatePlanModal } from './plans/CreatePlanModal';
import { PlanCard } from './plans/PlanCard';
import { PlanEditorForm } from './plans/PlanEditorForm';
import type { MealKey, PlanDraft } from './plans/types';

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clientCounts, setClientCounts] = useState<Record<number, number>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PlanDraft>({ name: '', meals: [], price: '' });
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const [plansRes, clientsRes] = await Promise.all([api.get('/plans'), api.get('/clients')]);
    const loadedPlans: Plan[] = plansRes.data.data;
    setPlans(loadedPlans);
    setSelectedId((prev) => (prev === null && loadedPlans.length > 0 ? loadedPlans[0].id : prev));

    const clients: Client[] = clientsRes.data.data;
    const counts = clients.reduce<Record<number, number>>((acc, c) => {
      const sub = c.subscriptions?.[0];
      if (!sub) return acc;
      return { ...acc, [sub.planId]: (acc[sub.planId] ?? 0) + 1 };
    }, {});
    setClientCounts(counts);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId === null || plans.length === 0) return;
    const p = plans.find((plan) => plan.id === selectedId);
    if (p) setDraft({ name: p.name, meals: p.meals as MealKey[], price: String(p.price) });
  }, [selectedId, plans]);

  const handleDelete = async () => {
    if (selectedId === null) return;
    await api.delete(`/plans/${selectedId}`);
    setSelectedId(null);
    await load();
  };

  const handleSave = async () => {
    if (selectedId === null) return;
    setIsSaving(true);
    try {
      await api.patch(`/plans/${selectedId}`, {
        name: draft.name,
        meals: draft.meals,
        price: Number(draft.price),
      });
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (newDraft: PlanDraft) => {
    await api.post('/plans', {
      name: newDraft.name,
      meals: newDraft.meals,
      price: Number(newDraft.price),
    });
    await load();
  };

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
          <button
            type="button"
            aria-label="Crear plan nuevo"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            <Icon name="plus" size={14} />
            Crear plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          {plans.length === 0 ? (
            <div className="py-16 text-center bg-paper border border-rule rounded-lg">
              <p className="font-semibold text-ink">Sin planes</p>
              <p className="text-sm text-muted mt-1">
                Crea el primer plan usando el botón de arriba.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  isSelected={p.id === selectedId}
                  clientCount={clientCounts[p.id] ?? 0}
                  onClick={() => setSelectedId(p.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          {selectedId !== null ? (
            <div className="bg-paper border border-rule rounded-lg p-5 lg:sticky lg:top-[90px]">
              <PlanEditorForm draft={draft} setDraft={setDraft} />
              <div className="flex gap-2.5 mt-[18px]">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-warn hover:bg-cream-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Icon name="check" size={14} />
                  )}
                  Guardar cambios
                </button>
              </div>
              <p className="font-mono text-[11px] text-muted mt-3.5 px-3 py-2.5 bg-cream-2 rounded-md">
                ⓘ Modificar este plan afectará a {clientCounts[selectedId] ?? 0} cliente
                {(clientCounts[selectedId] ?? 0) !== 1 ? 's' : ''} con contrato vigente.
              </p>
            </div>
          ) : (
            <div className="bg-paper border border-rule rounded-lg p-5 text-center text-muted text-[13px]">
              Selecciona un plan para editarlo.
            </div>
          )}
        </div>
      </div>

      {createOpen && <CreatePlanModal onClose={() => setCreateOpen(false)} onSave={handleCreate} />}
      {confirmDeleteOpen && selectedId !== null && (
        <ConfirmDeleteModal
          planName={plans.find((p) => p.id === selectedId)?.name ?? ''}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
