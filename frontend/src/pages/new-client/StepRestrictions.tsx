import { useState } from 'react';
import { Button } from '../../components/ui/Button';
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
    <div className="space-y-8">
      <div>
        <h2 className="font-semibold text-ink text-[15px] mb-1">
          Alergias, intolerancias y gustos
        </h2>

        <div className="flex gap-2 mb-5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            className="flex-1 px-3 py-2.5 border border-rule bg-paper rounded-md text-[13px] focus:outline-none focus:border-olive-700"
          />
          <Button onClick={add} leftIcon="plus">
            Agregar
          </Button>
        </div>

        <div className="min-h-[80px] p-4 bg-cream-2 rounded-md border border-dashed border-rule-2">
          {value.restrictions.length === 0 ? (
            <p className="text-[12.5px] font-mono text-muted text-center py-3">
              Sin restricciones agregadas todavía
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {value.restrictions.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-warn-bg text-warn text-[12px] font-mono rounded-full"
                >
                  {r}
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    className="opacity-60 hover:opacity-100 px-0.5"
                    title="Quitar"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-rule pt-6">
        <h2 className="font-semibold text-ink text-[15px] mb-1">Enfermedades de base</h2>
        <p className="text-[11.5px] font-mono text-muted mb-4">Seleccioná las que apliquen.</p>
        <div className="flex flex-wrap gap-2">
          {DISEASES.map((d) => {
            const selected = value.underlyingDiseases.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleDisease(d)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-mono border transition-colors ${
                  selected
                    ? 'bg-olive-100 text-ink border-olive-300'
                    : 'bg-paper text-ink border-rule hover:border-olive-700'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
