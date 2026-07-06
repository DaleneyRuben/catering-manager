import { useNavigate } from 'react-router-dom';
import { Button } from '@ui/Button';
import { PageHeader } from '@ui/PageHeader';
import { ClientFilterBar } from '@/features/clients/components/list/ClientFilterBar';
import { ClientTable } from '@/features/clients/components/list/ClientTable';
import { useClientListFilters } from '@/features/clients/hooks/useClientListFilters';

export function ClientsPage() {
  const navigate = useNavigate();
  const {
    filter,
    changeFilter,
    q,
    setQ,
    restriction,
    setRestriction,
    debouncedRestriction,
    page,
    limit,
    changePage,
    changeLimit,
    clients,
    total,
    isLoading,
    isFetching,
    tableLoading,
  } = useClientListFilters();

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

      <ClientTable
        clients={clients}
        total={total}
        page={page}
        limit={limit}
        onChangePage={changePage}
        onChangeLimit={changeLimit}
        isLoading={isLoading || tableLoading}
        showRestrictionsColumn={showRestrictionsColumn}
        restrictionQuery={debouncedRestriction}
      />
    </div>
  );
}
