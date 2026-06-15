import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { ClientTableSkeleton } from './ClientTableSkeleton';
import { useClientList, useClientCounts } from '../hooks/useClientList';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/format';
import { STATUS_LABELS, STATUS_CLASSES, CLIENT_STATUS } from '../constants/clientStatus';
import { SEX_LABELS } from '../constants/clientOptions';
import { EXPIRY_THRESHOLD_DAYS } from '../constants/subscription';
import { initials } from '../utils/string';
import { MONTHS } from '../constants/months';

type FilterValue = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

export function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = (searchParams.get('status') as FilterValue) ?? CLIENT_STATUS.ACTIVE;
  const birthMonth = searchParams.get('birthMonth') ?? CLIENT_STATUS.ALL;
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '25');

  const [q, setQ] = useState(() => searchParams.get('q') ?? '');
  const debouncedQ = useDebounce(q);
  const [tableLoading, setTableLoading] = useState(false);

  const updateParams = (updates: Record<string, string | null>, resetPage = false) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (resetPage) next.delete('page');
        Object.entries(updates).forEach(([k, v]) => {
          if (v === null) next.delete(k);
          else next.set(k, v);
        });
        // remove defaults to keep URLs clean
        if (next.get('status') === CLIENT_STATUS.ACTIVE) next.delete('status');
        if (next.get('birthMonth') === CLIENT_STATUS.ALL) next.delete('birthMonth');
        if (next.get('page') === '1') next.delete('page');
        if (next.get('limit') === '25') next.delete('limit');
        return next;
      },
      { replace: true },
    );
  };

  const changeFilter = (v: FilterValue) => {
    if (v === filter) return;
    setTableLoading(true);
    updateParams({ status: v }, true);
  };
  const changeBirthMonth = (v: string) => {
    if (v === birthMonth) return;
    setTableLoading(true);
    updateParams({ birthMonth: v }, true);
  };
  const changeLimit = (v: number) => {
    if (v === limit) return;
    setTableLoading(true);
    updateParams({ limit: String(v) }, true);
  };
  const changePage = (p: number) => {
    if (p === page) return;
    setTableLoading(true);
    updateParams({ page: String(p) });
  };

  useEffect(() => {
    updateParams({ q: debouncedQ || null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const { clients, total, isLoading, isFetching } = useClientList({
    status: filter,
    q: debouncedQ,
    birthMonth,
    page,
    limit,
  });

  useEffect(() => {
    if (!isFetching) setTableLoading(false);
  }, [isFetching]);

  const { counts } = useClientCounts();

  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex items-end gap-6 mb-7 flex-wrap">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
            Directorio
          </p>
          <h1 className="font-serif text-[44px] leading-none text-ink">Clientes</h1>
          <p className="text-[13px] text-muted mt-2.5">
            {counts?.active ?? '—'} activos · {counts?.total ?? '—'} totales ·{' '}
            {counts?.expiring ?? '—'} vencen en ≤ {EXPIRY_THRESHOLD_DAYS} días hábiles
          </p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <Button onClick={() => navigate('/clientes/nuevo')} leftIcon="plus">
            Agregar cliente
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-paper border border-rule rounded-lg px-4 py-3.5 mb-4 flex flex-wrap gap-3.5 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, NIT, dirección…"
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600"
          />
          <Icon
            name="search"
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>

        <div className="w-full overflow-x-auto sm:w-auto">
          <div className="inline-flex p-[3px] bg-cream-2 border border-rule rounded-[7px] text-[12px]">
            {(
              [
                { v: CLIENT_STATUS.ACTIVE, l: 'Activos' },
                { v: CLIENT_STATUS.EXPIRING, l: 'Por vencer' },
                { v: CLIENT_STATUS.PAUSED, l: 'Pausados' },
                { v: CLIENT_STATUS.ENDED, l: 'Finalizados' },
                { v: CLIENT_STATUS.ALL, l: 'Todos' },
              ] as { v: FilterValue; l: string }[]
            ).map(({ v, l }) => (
              <button
                type="button"
                key={v}
                onClick={() => changeFilter(v)}
                className={`px-3 py-1.5 rounded-[5px] font-medium whitespace-nowrap transition-all ${
                  filter === v ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink-2'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="relative shrink-0">
          <select
            value={birthMonth}
            onChange={(e) => changeBirthMonth(e.target.value)}
            style={{ fontSize: 13 }}
            className="appearance-none py-[7px] pl-2.5 pr-7 border border-rule rounded-[5px] bg-paper cursor-pointer"
          >
            <option value="all">Mes de nacimiento · todos</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
        </div>

        <span
          className={`text-[11px] font-mono ml-auto transition-opacity ${isFetching ? 'opacity-40' : 'text-muted'}`}
        >
          {clients.length} resultados
        </span>
      </div>

      {/* Table */}
      <div className="bg-paper border border-rule rounded-lg overflow-hidden">
        {(isLoading || tableLoading) && <ClientTableSkeleton />}
        {!isLoading && !tableLoading && clients.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-cream mx-auto mb-3 flex items-center justify-center text-olive-700">
              <Icon name="users" size={22} />
            </div>
            <p className="font-semibold text-ink">Sin resultados</p>
            <p className="text-sm text-muted mt-1">Prueba con otra búsqueda o quita los filtros.</p>
          </div>
        )}
        {!isLoading && !tableLoading && clients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-2 border-b border-rule text-[10.5px] font-mono uppercase tracking-widest text-muted">
                  <th className="text-left px-4 py-2.5 font-medium">Cliente</th>
                  <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                  <th className="text-left px-4 py-2.5 font-medium">Zona</th>
                  <th className="text-left px-4 py-2.5 font-medium">Nacimiento</th>
                  <th className="text-left px-4 py-2.5 font-medium">Contrato</th>
                  <th className="text-left px-4 py-2.5 font-medium">Estado</th>
                  <th className="text-right px-4 py-2.5 font-medium">Precio</th>
                </tr>
              </thead>
              <tbody className="stagger-list">
                {clients.map((c) => {
                  const sub = c.subscriptions[0];
                  const { status } = c;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/clientes/${c.id}`)}
                      className="border-b border-rule last:border-0 hover:bg-cream-2 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-olive-800 text-white flex items-center justify-center font-serif text-sm font-semibold shrink-0">
                            {initials(c.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-ink">{c.name}</p>
                            <p className="text-xs font-mono text-muted">
                              {c.deliveryZone} · {SEX_LABELS[c.sex] ?? c.sex}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-olive-800 text-white font-mono">
                            {sub.plan.name}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.deliveryZone}</td>
                      <td className="px-4 py-3 font-mono text-xs">{formatDate(c.dateOfBirth)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-2">
                        {sub
                          ? `${formatDate(sub.startDate)} → ${formatDate(sub.contractEndDate)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-mono ${STATUS_CLASSES[status]}`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {sub ? Number(sub.plan.price) - sub.discount : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onChange={changePage}
          onLimitChange={changeLimit}
        />
      </div>
    </div>
  );
}
