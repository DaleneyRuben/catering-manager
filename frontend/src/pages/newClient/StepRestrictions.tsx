import { useState } from 'react';
import { TagInput } from '../../components/ui/TagInput';
import { WizardSectionCard } from '../../components/ui/WizardSectionCard';
import { DISEASES } from '../../constants/diseases';
import type { RestrictionsState } from './types';

interface Props {
  value: RestrictionsState;
  onChange: (updates: Partial<RestrictionsState>) => void;
}

export function StepRestrictions({ value, onChange }: Props) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v || value.restrictions.includes(v)) return;
    onChange({ restrictions: [...value.restrictions, v] });
    setDraft('');
  };

  const remove = (v: string) => {
    const idx = value.restrictions.indexOf(v);
    onChange({ restrictions: value.restrictions.filter((_, k) => k !== idx) });
  };

  const toggleDisease = (d: string) => {
    const selected = value.underlyingDiseases.includes(d);
    onChange({
      underlyingDiseases: selected
        ? value.underlyingDiseases.filter((x) => x !== d)
        : [...value.underlyingDiseases, d],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <WizardSectionCard
        icon="alert"
        iconBg="bg-warn-bg"
        iconColor="text-warn"
        title="Alergias, intolerancias y gustos"
        description="Agregá lo que el cliente no puede o no quiere consumir. Se resaltará en la cocina."
        descriptionMb={18}
      >
        <TagInput
          placeholder="Ej. lácteos, maní, cebolla…"
          emptyMessage="Sin elementos agregados."
          tags={value.restrictions}
          input={draft}
          setInput={setDraft}
          onAdd={add}
          onRemove={remove}
          tagClassName="bg-warn-bg border-warn-border text-warn"
        />
      </WizardSectionCard>

      <WizardSectionCard
        icon="stethoscope"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        title="Enfermedades de base"
        description="Seleccioná las que apliquen."
        descriptionMb={20}
      >
        <div className="flex flex-wrap gap-[9px]">
          {DISEASES.map((d) => {
            const selected = value.underlyingDiseases.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleDisease(d)}
                className={`py-[7px] px-[15px] rounded-full text-[13px] border transition-colors ${
                  selected
                    ? 'font-semibold bg-olive-100 text-olive-700 border-olive-200'
                    : 'font-normal bg-paper text-muted border-rule hover:border-olive-200'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </WizardSectionCard>
    </div>
  );
}
