import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useCategoryCatalog, useCategoryMutations } from '@/features/finance/hooks/useCategories';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const mockApi = api as unknown as { get: jest.Mock; post: jest.Mock; patch: jest.Mock };

const catalog = [
  { id: 'AB12CD', name: 'Insumos', active: true, usageThisMonth: 5, usageAllTime: 41 },
  { id: 'EF34GH', name: 'Eventos', active: false, usageThisMonth: 0, usageAllTime: 3 },
];

let queryClient: QueryClient;

function makeWrapper() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useCategoryCatalog', () => {
  // The modal is the one caller that needs the archived ones: they have to be visible somewhere
  // to be restorable, and the expense form must never offer them.
  it('asks for the archived categories too', async () => {
    mockApi.get.mockResolvedValue(catalog);

    const { result } = renderHook(() => useCategoryCatalog('2026-08'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockApi.get).toHaveBeenCalledWith(
      '/finance/categories?includeArchived=true&month=2026-08',
    );
    expect(result.current.categories).toEqual(catalog);
  });

  // "Usado 5 veces este mes" has to describe the register on screen, not today's calendar month,
  // so the month is part of the key and paging refetches.
  it('refetches when the month on screen changes', async () => {
    mockApi.get.mockResolvedValue(catalog);
    const wrapper = makeWrapper();

    const { result, rerender } = renderHook(({ month }) => useCategoryCatalog(month), {
      wrapper,
      initialProps: { month: '2026-08' },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ month: '2026-07' });

    await waitFor(() =>
      expect(mockApi.get).toHaveBeenCalledWith(
        '/finance/categories?includeArchived=true&month=2026-07',
      ),
    );
  });

  it('starts as an empty list rather than undefined', () => {
    mockApi.get.mockResolvedValue([]);

    const { result } = renderHook(() => useCategoryCatalog('2026-08'), { wrapper: makeWrapper() });

    expect(result.current.categories).toEqual([]);
  });
});

describe('useCategoryMutations', () => {
  const setup = () => renderHook(() => useCategoryMutations(), { wrapper: makeWrapper() });

  it('creates a category by name', async () => {
    mockApi.post.mockResolvedValue({ id: 'IJ56KL', name: 'Mantenimiento', active: true });
    const { result } = setup();

    const created = await result.current.create('Mantenimiento');

    expect(mockApi.post).toHaveBeenCalledWith('/finance/categories', { name: 'Mantenimiento' });
    expect(created.name).toBe('Mantenimiento');
  });

  it('renames a category', async () => {
    mockApi.patch.mockResolvedValue({ id: 'AB12CD', name: 'Insumos secos', active: true });
    const { result } = setup();

    await result.current.rename('AB12CD', 'Insumos secos');

    expect(mockApi.patch).toHaveBeenCalledWith('/finance/categories/AB12CD', {
      name: 'Insumos secos',
    });
  });

  // Archiving and restoring are the same row's `active` flag, which is why there is no DELETE:
  // expenses already filed against a category keep naming it forever.
  it('archives and restores through the active flag', async () => {
    mockApi.patch.mockResolvedValue({ id: 'AB12CD', name: 'Insumos', active: false });
    const { result } = setup();

    await result.current.archive('AB12CD');
    expect(mockApi.patch).toHaveBeenCalledWith('/finance/categories/AB12CD', { active: false });

    await result.current.restore('AB12CD');
    expect(mockApi.patch).toHaveBeenCalledWith('/finance/categories/AB12CD', { active: true });
  });

  // A rename moves the label in every month's breakdown and an archive changes what the form
  // offers, so both the catalog and the register on screen are stale afterwards.
  it('refetches the catalog and the register after a write', async () => {
    mockApi.patch.mockResolvedValue({ id: 'AB12CD', name: 'Insumos', active: true });
    const { result } = setup();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    await result.current.rename('AB12CD', 'Insumos');

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['expense-categories'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['finance'] });
  });
});
