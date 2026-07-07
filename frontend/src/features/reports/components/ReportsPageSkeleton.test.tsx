import { render, screen } from '@testing-library/react';
import { ReportsPageSkeleton } from './ReportsPageSkeleton';

describe('ReportsPageSkeleton', () => {
  it('renders three skeleton cards when the kitchen card is shown', () => {
    render(<ReportsPageSkeleton showKitchenCard />);
    expect(screen.getAllByTestId('report-card-skeleton')).toHaveLength(3);
  });

  it('renders two skeleton cards when the kitchen card is hidden', () => {
    render(<ReportsPageSkeleton showKitchenCard={false} />);
    expect(screen.getAllByTestId('report-card-skeleton')).toHaveLength(2);
  });
});
