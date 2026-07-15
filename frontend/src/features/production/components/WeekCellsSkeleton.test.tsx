import { render } from '@testing-library/react';
import { WeekCellsSkeleton } from '@/features/production/components/WeekCellsSkeleton';

describe('WeekCellsSkeleton', () => {
  it('renders five bordered day cells', () => {
    const { container } = render(<WeekCellsSkeleton />);

    expect(container.querySelectorAll('.border-week-cell-border')).toHaveLength(5);
  });

  it('renders a label bar and a count bar inside each cell (structural, not slabs)', () => {
    const { container } = render(<WeekCellsSkeleton />);

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(10);
  });
});
