import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { ClientTableSkeleton } from './ClientTableSkeleton';
import { useClientList } from '../hooks/useClientList';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/format';
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  STATUS_DOT_CLASSES,
  CLIENT_STATUS,
} from '../constants/clientStatus';
import { SEX_LABELS } from '../constants/clientOptions';
import { initials } from '../utils/string';
import { MONTHS } from '../constants/months';

type FilterValue = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

export function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = (searchParams.get('status') as FilterValue) ?? CLIENT_STATUS.ALL;
  const birthMonth = searchParams.get('birthMonth') ?? CLIENT_STATUS.ALL;
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '25');

  const [q, setQ] = useState(() => searchParams.get('q') ?? '');
  const debouncedQ = useDebounce(q);
  const [tableLoading, setTableLoading] = useState(false);
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);

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
        if (next.get('status') === CLIENT_STATUS.ALL) next.delete('status');
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
  const STATUS_FILTERS: { v: FilterValue; l: string }[] = [
    { v: CLIENT_STATUS.ALL, l: 'Todos' },
    { v: CLIENT_STATUS.ACTIVE, l: 'Activos' },
    { v: CLIENT_STATUS.EXPIRING, l: 'Por vencer' },
    { v: CLIENT_STATUS.PAUSED, l: 'Pausados' },
    { v: CLIENT_STATUS.ENDED, l: 'Finalizados' },
  ];

  useEffect(() => {
    if (!isFetching) setTableLoading(false);
  }, [isFetching]);

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader
        label="Directorio"
        title="Clientes"
        action={
          <Button onClick={() => navigate('/clientes/nuevo')} leftIcon="plus">
            Agregar cliente
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 mb-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search + filter toggle (toggle hidden on desktop) */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cliente…"
                className="w-full pl-[38px] pr-3 py-2.5 text-[13.5px] border border-rule rounded-[9px] bg-paper placeholder:text-faint focus:outline-none focus:border-olive-600"
              />
              <Icon
                name="search"
                size={16}
                className="absolute left-[13px] top-1/2 -translate-y-1/2 text-faint"
              />
            </div>
            {(() => {
              const activeCount =
                (filter !== CLIENT_STATUS.ALL ? 1 : 0) + (birthMonth !== 'all' ? 1 : 0);
              return (
                <button
                  type="button"
                  onClick={() => setShowSecondaryFilters((v) => !v)}
                  aria-label="Filtros"
                  className={`lg:hidden relative shrink-0 flex items-center gap-1.5 px-3 h-[38px] border rounded-[9px] text-[12px] font-medium transition-colors ${
                    activeCount > 0
                      ? 'border-olive-600 bg-olive-50 text-olive-800'
                      : 'border-rule bg-paper text-muted'
                  }`}
                >
                  <Icon name="filter" size={12} />
                  Filtros
                  {activeCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-olive-800 text-white text-[10px] flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </button>
              );
            })()}
          </div>

          {/* Month — collapsed on mobile behind toggle */}
          <div className={`${showSecondaryFilters ? 'block' : 'hidden'} lg:block lg:shrink-0`}>
            <div className="relative">
              <select
                value={birthMonth}
                onChange={(e) => changeBirthMonth(e.target.value)}
                className="appearance-none font-mono text-[13px] text-ink-2 w-full py-[10px] pl-[14px] pr-8 border border-rule rounded-[9px] bg-paper cursor-pointer"
              >
                <option value="all">Mes · todos</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Results count — always visible */}
          <span
            className={`font-mono text-[11.5px] uppercase tracking-[.04em] lg:ml-auto transition-opacity ${isFetching ? 'opacity-40' : 'text-muted'}`}
          >
            {clients.length} resultados
          </span>
        </div>

        {/* Status segmented control — collapsed on mobile behind toggle */}
        <div className={`${showSecondaryFilters ? 'flex' : 'hidden'} lg:flex`}>
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            <div className="inline-flex p-[3px] gap-px bg-paper border border-rule rounded-[11px] text-[12.5px]">
              {STATUS_FILTERS.map(({ v, l }) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => changeFilter(v)}
                  className={`px-3.5 py-[6px] rounded-[8px] font-semibold whitespace-nowrap transition-all ${
                    filter === v
                      ? 'bg-olive-100 text-olive-700'
                      : 'text-muted font-normal hover:bg-cream-2 hover:text-ink-2'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
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
            <table className="w-full text-sm min-w-[840px]">
              <thead>
                <tr className="bg-olive-50 border-b border-rule text-[10px] font-mono uppercase tracking-[.13em] text-muted">
                  <th className="text-left px-5 py-[13px] font-semibold">Cliente</th>
                  <th className="text-left px-5 py-[13px] font-semibold">Plan</th>
                  <th className="text-left px-5 py-[13px] font-semibold">Zona</th>
                  <th className="text-left px-5 py-[13px] font-semibold">Nacimiento</th>
                  <th className="text-left px-5 py-[13px] font-semibold">Contrato</th>
                  <th className="text-left px-5 py-[13px] font-semibold">Estado</th>
                  <th className="text-right px-5 py-[13px] font-semibold">Precio</th>
                </tr>
              </thead>
              <tbody className="stagger-list">
                {clients.map((c) => {
                  const sub = c.subscriptions[0];
                  const { status } = c;
                  const price = sub ? Number(sub.plan.price) - sub.discount : 0;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/clientes/${c.id}`)}
                      className="border-b border-cream-2 last:border-0 hover:bg-row-hover cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-[13px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-olive-100 border border-olive-200 text-olive-700 flex items-center justify-center font-mono text-[12px] font-semibold shrink-0">
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-ink leading-tight">
                              {c.name}
                            </p>
                            <p className="font-mono text-[10.5px] uppercase tracking-[.03em] text-faint mt-0.5">
                              {c.deliveryZone} · {SEX_LABELS[c.sex] ?? c.sex}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-[13px] text-[13.5px] text-ink-2">
                        {sub ? sub.plan.name : <span className="text-faint">—</span>}
                      </td>
                      <td className="px-5 py-[13px]">
                        <span className="font-mono text-[11px] tracking-[.04em] text-muted bg-cream-2 rounded-[5px] px-[9px] py-[3px]">
                          {c.deliveryZone}
                        </span>
                      </td>
                      <td className="px-5 py-[13px] font-mono text-[12.5px] text-ink-2 tabular-nums">
                        {formatDate(c.dateOfBirth)}
                      </td>
                      <td className="px-5 py-[13px] font-mono text-[11.5px] text-muted tabular-nums whitespace-nowrap">
                        {sub
                          ? `${formatDate(sub.startDate)} → ${formatDate(sub.contractEndDate)}`
                          : '—'}
                      </td>
                      <td className="px-5 py-[13px]">
                        <span
                          className={`inline-flex items-center gap-[7px] text-[12px] font-semibold pl-[9px] pr-[11px] py-[4px] rounded-full ${STATUS_CLASSES[status]}`}
                        >
                          <span
                            className={`w-[6px] h-[6px] rounded-full shrink-0 ${STATUS_DOT_CLASSES[status]}`}
                          />
                          {STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-5 py-[13px] text-right font-mono text-[13px] font-medium tabular-nums whitespace-nowrap">
                        {price > 0 ? (
                          price.toLocaleString('es-BO')
                        ) : (
                          <span className="text-faint">—</span>
                        )}
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
