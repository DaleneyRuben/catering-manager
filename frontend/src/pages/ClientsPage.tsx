import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '../components/ui/Icon';
import { PageLoader } from '../components/ui/PageLoader';
import { useClients } from '../hooks/useClients';
import { clientStatus } from '../types/client';
import { STATUS_LABELS, STATUS_CLASSES } from '../constants/clientStatus';
import { SEX_LABELS } from '../constants/clientOptions';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
}

function formatDateShort(iso: string) {
  return format(parseISO(iso), 'dd/MM/yy');
}

function formatMonthDay(iso: string) {
  return format(parseISO(iso), 'd MMM', { locale: es });
}

type FilterValue = 'active' | 'expiring' | 'paused' | 'ended' | 'all';

export function ClientsPage() {
  const navigate = useNavigate();
  const { clients, isLoading } = useClients();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterValue>('active');
  const [birthMonth, setBirthMonth] = useState('all');

  const counts = useMemo(() => {
    const today = new Date();
    return {
      active: clients.filter((c) => clientStatus(c, today) === 'active').length,
      paused: clients.filter((c) => clientStatus(c, today) === 'paused').length,
      expiring: clients.filter((c) => clientStatus(c, today) === 'expiring').length,
      ended: clients.filter((c) => clientStatus(c, today) === 'ended').length,
    };
  }, [clients]);

  const filtered = useMemo(() => {
    const today = new Date();
    let list = clients;

    if (filter !== 'all') {
      list = list.filter((c) => clientStatus(c, today) === filter);
    }
    if (birthMonth !== 'all') {
      const m = Number(birthMonth);
      list = list.filter((c) => new Date(c.dateOfBirth).getMonth() + 1 === m);
    }
    if (q) {
      const Q = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(Q) ||
          c.address.toLowerCase().includes(Q) ||
          (c.nit || '').toLowerCase().includes(Q),
      );
    }
    return list;
  }, [clients, filter, birthMonth, q]);

  if (isLoading) return <PageLoader />;

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
            {counts.active} activos · {clients.length} totales · {counts.expiring} vencen pronto
          </p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/clientes/nuevo')}
            className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            <Icon name="plus" size={14} />
            Agregar Cliente
          </button>
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
                { v: 'active', l: 'Activos' },
                { v: 'expiring', l: 'Por vencer' },
                { v: 'paused', l: 'Pausados' },
                { v: 'ended', l: 'Finalizados' },
                { v: 'all', l: 'Todos' },
              ] as { v: FilterValue; l: string }[]
            ).map(({ v, l }) => (
              <button
                type="button"
                key={v}
                onClick={() => setFilter(v)}
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
            onChange={(e) => setBirthMonth(e.target.value)}
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

        <span className="text-[11px] font-mono text-muted ml-auto">
          {filtered.length} resultados
        </span>
      </div>

      {/* Table */}
      <div className="bg-paper border border-rule rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-cream mx-auto mb-3 flex items-center justify-center text-olive-700">
              <Icon name="users" size={22} />
            </div>
            <p className="font-semibold text-ink">Sin resultados</p>
            <p className="text-sm text-muted mt-1">Prueba con otra búsqueda o quita los filtros.</p>
          </div>
        ) : (
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
              <tbody>
                {filtered.map((c) => {
                  const sub = c.subscriptions[0];
                  const status = clientStatus(c);
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
                              {c.zone} · {SEX_LABELS[c.sex] ?? c.sex}
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
                      <td className="px-4 py-3 font-mono text-xs">{c.zone}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatMonthDay(c.dateOfBirth)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-2">
                        {sub
                          ? `${formatDateShort(sub.startDate)} → ${formatDateShort(sub.contractEndDate)}`
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
                        {sub ? sub.plan.price : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
