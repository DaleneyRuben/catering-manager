import { useNavigate } from 'react-router-dom';
import { Icon } from '@ui/Icon';
import { Pagination } from '@ui/Pagination';
import { ClientTableSkeleton } from '@/features/clients/components/list/ClientTableSkeleton';
import { ClientRestrictionPills } from '@/features/clients/components/list/ClientRestrictionPills';
import { formatDate } from '@/utils/format';
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  STATUS_DOT_CLASSES,
} from '@/features/clients/constants/clientStatus';
import { SEX_LABELS } from '@/features/clients/constants/clientOptions';
import { initials } from '@/utils/string';
import type { Client } from '@/features/clients/types';

interface Props {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
  isLoading: boolean;
  showRestrictionsColumn: boolean;
  restrictionQuery: string;
}

export function ClientTable({
  clients,
  total,
  page,
  limit,
  onChangePage,
  onChangeLimit,
  isLoading,
  showRestrictionsColumn,
  restrictionQuery,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
      {isLoading && <ClientTableSkeleton />}
      {!isLoading && clients.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-cream mx-auto mb-3 flex items-center justify-center text-olive-700">
            <Icon name="users" size={22} />
          </div>
          <p className="font-semibold text-ink">Sin resultados</p>
          <p className="text-sm text-muted mt-1">Prueba con otra búsqueda o quita los filtros.</p>
        </div>
      )}
      {!isLoading && clients.length > 0 && (
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
                          highlightQuery={restrictionQuery}
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
        onChange={onChangePage}
        onLimitChange={onChangeLimit}
      />
    </div>
  );
}
