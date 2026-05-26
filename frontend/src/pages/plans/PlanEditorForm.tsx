import { Field, inputCls } from '../../components/ui/Field';
import { MealRow } from './MealRow';
import type { MealKey, PlanDraft } from './types';
import { COL1, COL2 } from './types';

export function PlanEditorForm({
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
