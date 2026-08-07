import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancePage } from '@/pages/FinancePage';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { useExpenseCategories, useExpenseMutations } from '@/features/finance/hooks/useExpenses';
import type { FinanceOverview } from '@/features/finance/types';

jest.mock('@/features/finance/hooks/useFinance');
jest.mock('@/features/finance/hooks/useExpenses');

const mockedUseFinance = useFinance as jest.MockedFunction<typeof useFinance>;
const mockedUseCategories = useExpenseCategories as jest.MockedFunction<
  typeof useExpenseCategories
>;
const mockedUseMutations = useExpenseMutations as jest.MockedFunction<typeof useExpenseMutations>;

const overview: FinanceOverview = {
  month: '2026-08',
  earliestMonth: '2026-07',
  income: 34800,
  expenses: 21450,
  balance: 13350,
  byCategory: [{ categoryId: 'C1', categoryName: 'Insumos', total: 7300 }],
  movements: [
    {
      kind: 'income',
      id: 'P1',
      date: '2026-08-05',
      amount: 1550,
      label: 'Marcela Ríos',
      description: null,
      clientId: 'C9',
      clientArchived: false,
      categoryId: null,
      registeredByName: 'Daleney',
      registeredAt: '2026-08-05T09:30:00.000Z',
    },
    {
      kind: 'expense',
      id: 'E1',
      date: '2026-08-04',
      amount: 180,
      label: 'Transporte',
      description: 'Reparto del día',
      clientId: null,
      clientArchived: false,
      categoryId: 'C1',
      registeredByName: 'Gilian',
      registeredAt: '2026-08-04T18:05:00.000Z',
    },
  ],
};

const create = jest.fn().mockResolvedValue(undefined);
const update = jest.fn().mockResolvedValue(undefined);
const remove = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseFinance.mockReturnValue({ overview, isLoading: false, error: null });
  mockedUseCategories.mockReturnValue({
    categories: [
      { id: 'C1', name: 'Insumos', active: true },
      { id: 'C2', name: 'Transporte', active: true },
    ],
    isLoading: false,
  });
  mockedUseMutations.mockReturnValue({ create, update, remove, isSaving: false });
});

describe('FinancePage', () => {
  it('renders the register for the current month', () => {
    render(<FinancePage />);

    expect(screen.getByRole('heading', { name: 'Finanzas' })).toBeInTheDocument();
    expect(screen.getByText('34.800')).toBeInTheDocument();
    expect(screen.getByText('Marcela Ríos')).toBeInTheDocument();
    expect(screen.getByText('Insumos')).toBeInTheDocument();
  });

  it('asks the hook for the month the selector moves to', async () => {
    render(<FinancePage />);

    await userEvent.click(screen.getByRole('button', { name: /mes anterior/i }));

    await waitFor(() => expect(mockedUseFinance).toHaveBeenLastCalledWith('2026-07'));
  });

  it('registers an expense', async () => {
    render(<FinancePage />);

    await userEvent.click(screen.getByRole('button', { name: /registrar gasto/i }));
    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(create).toHaveBeenCalled());
  });

  it('edits an expense from its row', async () => {
    render(<FinancePage />);

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    await userEvent.clear(screen.getByLabelText(/monto/i));
    await userEvent.type(screen.getByLabelText(/monto/i), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('E1', expect.objectContaining({ amount: 200 })),
    );
  });

  // Duplicar is the daily path: the same expense, dated today, created rather than edited.
  it('duplicates an expense into a new one dated today', async () => {
    render(<FinancePage />);

    await userEvent.click(screen.getByRole('button', { name: /duplicar/i }));

    expect(screen.getByLabelText(/monto/i)).toHaveValue('180');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 180, description: 'Reparto del día' }),
      ),
    );
    expect(update).not.toHaveBeenCalled();
  });

  // Deleting moves the month's totals, so it is never a single click.
  it('confirms before deleting an expense', async () => {
    render(<FinancePage />);

    await userEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(remove).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Eliminar gasto')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('E1'));
  });

  // All income is subscription revenue, created by marking a subscription paid — the asymmetry
  // with expenses is deliberate (ADR-008).
  it('offers no way to register income', () => {
    render(<FinancePage />);

    expect(screen.queryByRole('button', { name: /registrar ingreso/i })).not.toBeInTheDocument();
  });

  it('shows a skeleton while the month loads', () => {
    mockedUseFinance.mockReturnValue({ overview: null, isLoading: true, error: null });

    render(<FinancePage />);

    expect(screen.getByTestId('finance-skeleton')).toBeInTheDocument();
  });
});
