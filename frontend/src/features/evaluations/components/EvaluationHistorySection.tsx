import { EvaluationHistoryFilterBar } from '@/features/evaluations/components/EvaluationHistoryFilterBar';
import { EvaluationHistoryTable } from '@/features/evaluations/components/EvaluationHistoryTable';
import { useEvaluationHistoryFilters } from '@/features/evaluations/hooks/useEvaluationHistoryFilters';

const STATUS_LABEL: Record<'all' | 'pagado' | 'no_pagado', string> = {
  all: 'resueltas',
  pagado: 'pagadas',
  no_pagado: 'no pagadas',
};

export function EvaluationHistorySection() {
  const {
    status,
    changeStatus,
    page,
    limit,
    changePage,
    changeLimit,
    q,
    setQ,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    appointments,
    total,
    isFetching,
  } = useEvaluationHistoryFilters();

  const subtitle =
    status === 'all'
      ? `${total} ${total === 1 ? 'cita resuelta' : 'citas resueltas'}`
      : `${total} ${STATUS_LABEL[status]}`;

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-serif font-semibold text-[24px] leading-none text-ink">Historial</h2>
        <p className="font-mono text-[11px] uppercase tracking-[.06em] text-faint mt-2">
          {subtitle}
        </p>
      </div>

      <EvaluationHistoryFilterBar
        q={q}
        onQChange={setQ}
        status={status}
        onStatusChange={changeStatus}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        resultsLabel={`${total} resultados`}
        isFetching={isFetching}
      />

      <EvaluationHistoryTable
        appointments={appointments}
        total={total}
        page={page}
        limit={limit}
        onChangePage={changePage}
        onChangeLimit={changeLimit}
      />
    </section>
  );
}
