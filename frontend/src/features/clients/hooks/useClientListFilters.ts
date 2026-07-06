import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { CLIENT_STATUS } from '@/features/clients/constants/clientStatus';
import { useClientList } from '@/features/clients/hooks/useClientList';
import type { FilterValue } from '@/features/clients/components/list/ClientFilterBar';

export function useClientListFilters() {
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

  return {
    filter,
    page,
    limit,
    q,
    setQ,
    restriction,
    setRestriction,
    debouncedRestriction,
    changeFilter,
    changeLimit,
    changePage,
    clients,
    total,
    isLoading,
    isFetching,
    tableLoading,
  };
}
