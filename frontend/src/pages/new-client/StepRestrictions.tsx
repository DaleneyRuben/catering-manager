import { useState } from 'react';
import { TagInput } from '../../components/ui/TagInput';
import type { RestrictionsState } from './types';

interface Props {
  value: RestrictionsState;
  onChange: (updates: Partial<RestrictionsState>) => void;
}

export function StepRestrictions({ value, onChange }: Props) {
  const [diseaseInput, setDiseaseInput] = useState('');
  const [restrictionInput, setRestrictionInput] = useState('');

  const addDisease = () => {
    const v = diseaseInput.trim();
    if (v && !value.underlyingDiseases.includes(v)) {
      onChange({ underlyingDiseases: [...value.underlyingDiseases, v] });
    }
    setDiseaseInput('');
  };

  const removeDisease = (v: string) => {
    onChange({ underlyingDiseases: value.underlyingDiseases.filter((d) => d !== v) });
  };

  const addRestriction = () => {
    const v = restrictionInput.trim();
    if (v && !value.restrictions.includes(v)) {
      onChange({ restrictions: [...value.restrictions, v] });
    }
    setRestrictionInput('');
  };

  const removeRestriction = (v: string) => {
    onChange({ restrictions: value.restrictions.filter((d) => d !== v) });
  };

  return (
    <div>
      <h2 className="font-semibold text-ink text-[15px] mb-6">Restricciones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <TagInput
          label="Enfermedades de base"
          tags={value.underlyingDiseases}
          input={diseaseInput}
          setInput={setDiseaseInput}
          onAdd={addDisease}
          onRemove={removeDisease}
        />
        <TagInput
          label="Restricciones alimentarias"
          tags={value.restrictions}
          input={restrictionInput}
          setInput={setRestrictionInput}
          onAdd={addRestriction}
          onRemove={removeRestriction}
        />
      </div>
    </div>
  );
}
