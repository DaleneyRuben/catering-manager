import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryBreakdown } from '@/features/finance/components/CategoryBreakdown';
import type { CategoryTotal } from '@/features/finance/types';

const categories: CategoryTotal[] = [
  { categoryId: 'A', categoryName: 'Insumos', total: 7300, active: true },
  { categoryId: 'B', categoryName: 'Personal', total: 5400, active: true },
  { categoryId: 'C', categoryName: 'Transporte', total: 3650, active: true },
];

const onPick = jest.fn();
const onManage = jest.fn();

const setup = (props: Partial<React.ComponentProps<typeof CategoryBreakdown>> = {}) =>
  render(
    <CategoryBreakdown
      categories={categories}
      activeCategoryId=""
      onPick={onPick}
      onManage={onManage}
      {...props}
    />,
  );

beforeEach(() => jest.clearAllMocks());

describe('CategoryBreakdown', () => {
  it('lists each category with its total', () => {
    setup();

    expect(screen.getByText('Insumos')).toBeInTheDocument();
    expect(screen.getByText('7.300')).toBeInTheDocument();
  });

  // The biggest cost is what the reader came for, so it is always the first line.
  it('sorts by amount descending regardless of the order given', () => {
    setup({ categories: [...categories].reverse() });

    const names = screen.getAllByTestId('category-name').map((el) => el.textContent);
    expect(names).toEqual(['Insumos', 'Personal', 'Transporte']);
  });

  it('scales each bar against the largest category', () => {
    setup();

    const bars = screen.getAllByTestId('category-bar');
    expect(bars[0]).toHaveStyle({ width: '100%' });
    expect(bars[1]).toHaveStyle({ width: '74%' });
  });

  // A hairline still reads as "some", where a zero-width bar reads as a rendering fault.
  it('keeps a visible sliver for a category that barely registers', () => {
    setup({
      categories: [
        { categoryId: 'A', categoryName: 'Insumos', total: 10000, active: true },
        { categoryId: 'B', categoryName: 'Otros', total: 20, active: true },
      ],
    });

    expect(screen.getAllByTestId('category-bar')[1]).toHaveStyle({ width: '3%' });
  });

  it('says nothing was spent rather than listing zeroes', () => {
    setup({ categories: [] });

    expect(screen.getByText('Todavía no hay gastos este mes.')).toBeInTheDocument();
  });

  // "Cuánto gastamos en Transporte" and "en qué se fue" are the same question read two ways, so
  // the answer to the first is the way into the second.
  it('narrows the list to a category when its cell is clicked', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: /insumos/i }));

    expect(onPick).toHaveBeenCalledWith('A');
  });

  it('marks the category the list is narrowed to', () => {
    setup({ activeCategoryId: 'B' });

    expect(screen.getByRole('button', { name: /personal/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /insumos/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reports the same category again so the filter can be cleared by it', async () => {
    setup({ activeCategoryId: 'A' });

    await userEvent.click(screen.getByRole('button', { name: /insumos/i }));

    expect(onPick).toHaveBeenCalledWith('A');
  });

  // A category archived after the money was spent still owns it: the line stays and is flagged,
  // rather than the total quietly leaving the breakdown.
  it('flags a category archived since the month was spent', () => {
    setup({
      categories: [{ categoryId: 'D', categoryName: 'Eventos', total: 300, active: false }],
    });

    expect(screen.getByText('Archivada')).toBeInTheDocument();
  });

  it('says nothing about a category still in use', () => {
    setup();

    expect(screen.queryByText('Archivada')).not.toBeInTheDocument();
  });

  it('sums the band beside its heading', () => {
    setup();

    expect(screen.getByText('Bs 16.350 en 3 categorías')).toBeInTheDocument();
  });

  it('reads a single category in the singular', () => {
    setup({ categories: [categories[0]] });

    expect(screen.getByText('Bs 7.300 en 1 categoría')).toBeInTheDocument();
  });

  // "Bs 0 en 0 categorías" says less than the empty state already does.
  it('drops the summary when nothing was spent', () => {
    setup({ categories: [] });

    expect(screen.queryByText(/en 0 categorías/)).not.toBeInTheDocument();
  });

  // The category list changes perhaps twice a year, so managing it lives here rather than on the
  // daily path — but it is reachable even in a month where nothing has been spent yet.
  it('opens category management from the header', async () => {
    setup({ categories: [] });

    await userEvent.click(screen.getByRole('button', { name: 'Administrar categorías' }));

    expect(onManage).toHaveBeenCalled();
  });

  // Below 900px auto-fill would drop to a single column and make the band very tall; two-up keeps
  // the month's shape readable at a glance (backlog 3.27).
  it('holds two columns below the compact breakpoint', () => {
    setup();

    expect(screen.getByTestId('category-grid')).toHaveClass('max-compact:grid-cols-2');
  });
});
