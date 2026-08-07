import { render, screen } from '@testing-library/react';
import { CategoryBreakdown } from '@/features/finance/components/CategoryBreakdown';
import type { CategoryTotal } from '@/features/finance/types';

const categories: CategoryTotal[] = [
  { categoryId: 'A', categoryName: 'Insumos', total: 7300 },
  { categoryId: 'B', categoryName: 'Personal', total: 5400 },
  { categoryId: 'C', categoryName: 'Transporte', total: 3650 },
];

describe('CategoryBreakdown', () => {
  it('lists each category with its total', () => {
    render(<CategoryBreakdown categories={categories} />);

    expect(screen.getByText('Insumos')).toBeInTheDocument();
    expect(screen.getByText('7.300')).toBeInTheDocument();
  });

  // The biggest cost is what the reader came for, so it is always the first line.
  it('sorts by amount descending regardless of the order given', () => {
    render(<CategoryBreakdown categories={[...categories].reverse()} />);

    const names = screen.getAllByTestId('category-name').map((el) => el.textContent);
    expect(names).toEqual(['Insumos', 'Personal', 'Transporte']);
  });

  it('scales each bar against the largest category', () => {
    render(<CategoryBreakdown categories={categories} />);

    const bars = screen.getAllByTestId('category-bar');
    expect(bars[0]).toHaveStyle({ width: '100%' });
    expect(bars[1]).toHaveStyle({ width: '74%' });
  });

  // A hairline still reads as "some", where a zero-width bar reads as a rendering fault.
  it('keeps a visible sliver for a category that barely registers', () => {
    render(
      <CategoryBreakdown
        categories={[
          { categoryId: 'A', categoryName: 'Insumos', total: 10000 },
          { categoryId: 'B', categoryName: 'Otros', total: 20 },
        ]}
      />,
    );

    expect(screen.getAllByTestId('category-bar')[1]).toHaveStyle({ width: '3%' });
  });

  it('says nothing was spent rather than listing zeroes', () => {
    render(<CategoryBreakdown categories={[]} />);

    expect(screen.getByText('Todavía no hay gastos este mes.')).toBeInTheDocument();
  });
});
