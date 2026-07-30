import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useEvaluationHistory } from '@/features/evaluations/hooks/useEvaluationHistory';
import type { EvaluationHistoryFilters } from '@/features/evaluations/hooks/useEvaluationHistory';

type StatusValue = NonNullable<EvaluationHistoryFilters['status']>;

export function useEvaluationHistoryFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get('historyStatus') as StatusValue) ?? 'all';
  const page = Number(searchParams.get('historyPage') ?? '1');
  const limit = Number(searchParams.get('historyLimit') ?? '25');

  const [q, setQ] = useState(() => searchParams.get('historyQ') ?? '');
  const debouncedQ = useDebounce(q);
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('historyDateFrom') ?? '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('historyDateTo') ?? '');
  const [tableLoading, setTableLoading] = useState(false);

  const updateParams = (updates: Record<string, string | null>, resetPage = false) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (resetPage) next.delete('historyPage');
        Object.entries(updates).forEach(([k, v]) => {
          if (v === null) next.delete(k);
          else next.set(k, v);
        });
        if (next.get('historyStatus') === 'all') next.delete('historyStatus');
        if (next.get('historyPage') === '1') next.delete('historyPage');
        if (next.get('historyLimit') === '25') next.delete('historyLimit');
        return next;
      },
      { replace: true },
    );
  };

  const changeStatus = (v: StatusValue) => {
    if (v === status) return;
    setTableLoading(true);
    updateParams({ historyStatus: v }, true);
  };
  const changeLimit = (v: number) => {
    if (v === limit) return;
    setTableLoading(true);
    updateParams({ historyLimit: String(v) }, true);
  };
  const changePage = (p: number) => {
    if (p === page) return;
    setTableLoading(true);
    updateParams({ historyPage: String(p) });
  };

  useEffect(() => {
    updateParams({ historyQ: debouncedQ || null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useEffect(() => {
    updateParams({ historyDateFrom: dateFrom || null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom]);

  useEffect(() => {
    updateParams({ historyDateTo: dateTo || null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTo]);

  const { appointments, total, isLoading, isFetching } = useEvaluationHistory({
    status,
    q: debouncedQ,
    dateFrom,
    dateTo,
    page,
    limit,
  });

  useEffect(() => {
    if (!isFetching) setTableLoading(false);
  }, [isFetching]);

  return {
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
    isLoading,
    isFetching,
    tableLoading,
  };
}
