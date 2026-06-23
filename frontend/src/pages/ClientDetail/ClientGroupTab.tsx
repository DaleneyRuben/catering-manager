import { useState } from 'react';
import { useClientGroup } from '../../hooks/useClientGroup';
import { useClientList } from '../../hooks/useClientList';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Label } from '../../components/ui/Label';
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
      <Label variant="section" className="mb-4">
        Entrega conjunta
      </Label>

      {members.length === 0 ? (
        <p className="font-mono text-[12px] text-muted mb-4">Sin miembros en el grupo.</p>
      ) : (
        <ul className="flex flex-col gap-2 mb-4">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-rule rounded-md"
            >
              <span className="font-mono text-[12.5px] text-ink">{m.name}</span>
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Eliminar ${m.name}`}
                onClick={() => remove(m.id)}
                className="border-0 bg-transparent text-red-700 hover:text-red-700 p-1"
              >
                <Icon name="trash" size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mb-2.5">
        <Icon
          name="search"
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="text"
          placeholder="Agregar miembro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls()} pl-[35px]`}
        />
      </div>

      {search && (
        <div className="border border-rule rounded-md overflow-hidden mb-3 bg-white">
          {searchResults.length > 0 ? (
            <ul>
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
          ) : (
            <p className="px-3 py-2.5 font-mono text-[12px] text-muted">Sin resultados.</p>
          )}
        </div>
      )}

      <Button onClick={save} disabled={!isDirty || isSaving} leftIcon="check" className="w-full">
        Guardar grupo
      </Button>
    </div>
  );
}
