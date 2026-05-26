import { useEffect, useState } from 'react';
import { Field, inputCls } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import api from '../services/api';
import type { Client, Plan } from '../types/client';

const MEAL_KEYS = [
  'breakfast',
  'morning_snack',
  'salad',
  'lunch',
  'afternoon_snack',
  'dinner',
  'juice',
  'extra',
] as const;

type MealKey = (typeof MEAL_KEYS)[number];

const MEAL_LABELS: Record<MealKey, string> = {
  breakfast: 'Desayuno',
  morning_snack: 'Merienda AM',
  salad: 'Ensalada',
  lunch: 'Almuerzo',
  afternoon_snack: 'Merienda PM',
  dinner: 'Cena',
  juice: 'Jugo',
  extra: 'Extra',
};

interface PlanDraft {
  name: string;
  meals: MealKey[];
  price: string;
}

function MealRow({
  mealKey,
  included,
  onToggle,
}: {
  mealKey: MealKey;
  included: boolean;
  onToggle: (key: MealKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(mealKey)}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-left w-full transition-colors ${
        included
          ? 'bg-olive-800 border-olive-800 text-white'
          : 'bg-cream-2 border-rule text-muted hover:border-olive-600'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-[2px] shrink-0 ${included ? 'bg-white' : 'bg-olive-600'}`}
      />
      <span className={`flex-1 text-[13px] ${included ? 'font-semibold' : 'font-normal'}`}>
        {MEAL_LABELS[mealKey]}
      </span>
      {included && <Icon name="check" size={12} />}
    </button>
  );
}

const HALF = Math.ceil(MEAL_KEYS.length / 2);
const COL1 = MEAL_KEYS.slice(0, HALF);
const COL2 = MEAL_KEYS.slice(HALF);

function PlanEditorForm({
  draft,
  setDraft,
  namePlaceholder = 'Ej. Completo, Mediodía…',
}: {
  draft: PlanDraft;
  setDraft: (d: PlanDraft) => void;
  namePlaceholder?: string;
}) {
  const onToggle = (key: MealKey) => {
    const included = draft.meals.includes(key);
    setDraft({
      ...draft,
      meals: included ? draft.meals.filter((m) => m !== key) : [...draft.meals, key],
    });
  };

  return (
    <>
      <Field label="Nombre del plan" htmlFor="pef-name" required>
        <input
          id="pef-name"
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder={namePlaceholder}
          className={inputCls()}
        />
      </Field>

      <div className="h-px bg-rule my-4" />

      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2.5">
        Comidas incluidas
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          {COL1.map((m) => (
            <MealRow key={m} mealKey={m} included={draft.meals.includes(m)} onToggle={onToggle} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {COL2.map((m) => (
            <MealRow key={m} mealKey={m} included={draft.meals.includes(m)} onToggle={onToggle} />
          ))}
        </div>
      </div>

      <div className="h-px bg-rule my-4" />

      <Field label="Precio ($/mes)" htmlFor="pef-price" required>
        <input
          id="pef-price"
          type="number"
          min={0}
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          className={inputCls()}
        />
      </Field>
    </>
  );
}

function CreatePlanModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: PlanDraft) => void;
}) {
  const [draft, setDraft] = useState<PlanDraft>({ name: '', meals: [], price: '0' });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(20,40,6,0.32)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cream border border-rule-2 rounded-[10px] w-[min(640px,92vw)] max-h-[92vh] overflow-auto shadow-[0_20px_60px_rgba(20,40,6,0.25)]"
      >
        <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
          <Icon name="plan" size={16} />
          <div className="flex-1">
            <p className="font-serif text-[20px] leading-tight text-ink">Crear plan</p>
            <p className="font-mono text-[11px] text-muted">Define nombre, comidas y precio</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="p-[22px]">
          <PlanEditorForm draft={draft} setDraft={setDraft} />
          <div className="flex gap-2.5 mt-[18px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-paper transition-colors"
            >
              Cancelar
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-400 text-olive-900 rounded-md hover:bg-[#7ed427] transition-colors"
            >
              <Icon name="check" size={14} />
              Crear plan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PlanCard({
  plan,
  isSelected,
  clientCount,
  onClick,
}: {
  plan: Plan;
  isSelected: boolean;
  clientCount: number;
  onClick: () => void;
}) {
  const includedMeals = MEAL_KEYS.filter((m) => plan.meals.includes(m));
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      style={{
        padding: 18,
        borderRadius: 8,
        cursor: 'pointer',
        background: isSelected ? '#1e3c0a' : 'var(--color-paper)',
        color: isSelected ? '#fff' : 'var(--color-ink)',
        border: `1px solid ${isSelected ? '#1e3c0a' : 'var(--color-rule)'}`,
        transition: 'all .15s',
      }}
    >
      <p
        className="font-mono text-[10.5px] uppercase tracking-[.14em]"
        style={{ color: isSelected ? '#a8c374' : 'var(--color-muted)' }}
      >
        Plan
      </p>
      <p className="font-serif text-[24px] mt-1">{plan.name}</p>
      <p
        className="font-mono font-semibold text-[30px] mt-1.5"
        style={{ color: isSelected ? '#fff' : '#1e3c0a' }}
      >
        ${plan.price}
        <span
          className="text-[12px]"
          style={{ color: isSelected ? '#a8c374' : 'var(--color-muted)' }}
        >
          /mes
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5 mt-3.5">
        {includedMeals.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono"
            style={{
              background: isSelected ? 'rgba(255,255,255,.12)' : 'var(--color-cream-2)',
              color: isSelected ? '#fff' : 'var(--color-ink-2)',
            }}
          >
            <span className="w-2 h-2 rounded-[2px] bg-olive-600 shrink-0" />
            {MEAL_LABELS[m]}
          </span>
        ))}
      </div>
      <div
        className="h-px my-3.5"
        style={{ background: isSelected ? 'rgba(255,255,255,.1)' : 'var(--color-rule)' }}
      />
      <p
        className="font-mono text-[11px]"
        style={{ color: isSelected ? '#a8c374' : 'var(--color-muted)' }}
      >
        {clientCount} cliente{clientCount !== 1 ? 's' : ''} activos
      </p>
    </div>
  );
}

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clientCounts, setClientCounts] = useState<Record<number, number>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PlanDraft>({ name: '', meals: [], price: '' });
  const [createOpen, setCreateOpen] = useState(false);

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

  const handleDiscard = () => {
    const p = plans.find((plan) => plan.id === selectedId);
    if (p) setDraft({ name: p.name, meals: p.meals as MealKey[], price: String(p.price) });
  };

  const handleSave = async () => {
    if (selectedId === null) return;
    await api.patch(`/plans/${selectedId}`, {
      name: draft.name,
      meals: draft.meals,
      price: Number(draft.price),
    });
    await load();
  };

  const handleCreate = async (newDraft: PlanDraft) => {
    await api.post('/plans', {
      name: newDraft.name,
      meals: newDraft.meals,
      price: Number(newDraft.price),
    });
    setCreateOpen(false);
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
              <PlanEditorForm draft={draft} setDraft={setDraft} namePlaceholder="" />
              <div className="flex gap-2.5 mt-[18px]">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
                >
                  Descartar
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
                >
                  <Icon name="check" size={14} />
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
    </div>
  );
}
