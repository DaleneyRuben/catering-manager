import { render, screen } from '@testing-library/react';
import { HealthPageSkeleton } from './HealthPageSkeleton';

it('renders the banner, four metric cards, and the services table skeleton', () => {
  render(<HealthPageSkeleton />);
  expect(screen.getByTestId('health-skeleton-banner')).toBeInTheDocument();
  expect(screen.getAllByTestId('health-skeleton-metric')).toHaveLength(4);
  expect(screen.getByTestId('health-skeleton-services')).toBeInTheDocument();
});
