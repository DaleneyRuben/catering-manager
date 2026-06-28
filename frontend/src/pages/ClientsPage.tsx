import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { ClientTableSkeleton } from './clients/ClientTableSkeleton';
import { ClientFilterBar, type FilterValue } from './clients/ClientFilterBar';
import { ClientRestrictionPills } from './clients/ClientRestrictionPills';
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

export function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = (searchParams.get('status') as FilterValue) ?? CLIENT_STATUS.ALL;
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '25');

  const [q, setQ] = useState(() => searchParams.get('q') ?? '');
  const debouncedQ = useDebounce(q);
  const [restriction, setRestriction] = useState(() => searchParams.get('restriction') ?? '');
  const debouncedRestriction = useDebounce(restriction);
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
        if (next.get('status') === CLIENT_STATUS.ALL) next.delete('status');
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

  useEffect(() => {
    updateParams({ restriction: debouncedRestriction || null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRestriction]);

  const { clients, total, isLoading, isFetching } = useClientList({
    status: filter,
    q: debouncedQ,
    restriction: debouncedRestriction,
    page,
    limit,
  });

  useEffect(() => {
    if (!isFetching) setTableLoading(false);
  }, [isFetching]);

  const showRestrictionsColumn = debouncedRestriction.trim() !== '';

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

      <ClientFilterBar
        q={q}
        onQChange={setQ}
        restriction={restriction}
        onRestrictionChange={setRestriction}
        filter={filter}
        onFilterChange={changeFilter}
        resultsLabel={`${clients.length} resultados`}
        isFetching={isFetching}
      />

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
                  {showRestrictionsColumn && (
                    <th className="text-left px-5 py-[13px] font-semibold">Restricciones</th>
                  )}
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
                      {showRestrictionsColumn && (
                        <td className="px-5 py-[13px]">
                          <ClientRestrictionPills
                            restrictions={c.restrictions}
                            highlightQuery={debouncedRestriction}
                          />
                        </td>
                      )}
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
