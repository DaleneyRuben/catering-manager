import { useState } from 'react';
import { useClientGroup } from '../../hooks/useClientGroup';
import { useClientList } from '../../hooks/useClientList';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/ui/Button';
import { inputCls } from '../../components/ui/Field';
import type { GroupMember } from '../../types/client';

interface Props {
  clientId: string;
  initialMembers: GroupMember[];
}

export function ClientGroupTab({ clientId, initialMembers }: Props) {
  const { members, isDirty, add, remove, save, isSaving } = useClientGroup(
    clientId,
    initialMembers,
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { clients } = useClientList({ q: debouncedSearch || undefined, limit: 8 });

  const memberIds = new Set(members.map((m) => m.id));
  const searchResults = clients.filter((c) => c.id !== clientId && !memberIds.has(c.id));

  return (
    <div className="bg-paper border border-rule rounded-lg p-5">
      <div className="grid grid-cols-2 gap-6 min-h-[200px]">
        {/* left column — current members */}
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-3">
            En el grupo
          </p>
          {members.length === 0 ? (
            <p className="font-mono text-[12px] text-muted">Sin miembros en el grupo.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] text-ink">{m.name}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label={`Eliminar ${m.name}`}
                    onClick={() => remove(m.id)}
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* right column — search to add */}
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-3">
            Agregar miembro
          </p>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls()}
          />
          {search && searchResults.length > 0 && (
            <ul className="mt-1.5 border border-rule rounded-md overflow-hidden">
              {searchResults.map((c) => (
                <li key={c.id}>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Agregar ${c.name}`}
                    onClick={() => {
                      add({ id: c.id, name: c.name });
                      setSearch('');
                    }}
                    className="w-full justify-start border-0 border-b border-rule rounded-none font-mono font-normal last:border-b-0"
                  >
                    {c.name}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {search && searchResults.length === 0 && (
            <p className="mt-2 font-mono text-[12px] text-muted">Sin resultados.</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={!isDirty || isSaving} leftIcon="check">
          Guardar grupo
        </Button>
      </div>
    </div>
  );
}
