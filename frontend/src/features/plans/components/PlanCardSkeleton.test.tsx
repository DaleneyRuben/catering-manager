import { render } from '@testing-library/react';
import { PlanCardSkeleton } from './PlanCardSkeleton';

it('renders without crashing', () => {
  const { container } = render(<PlanCardSkeleton />);
  expect(container.firstChild).toBeTruthy();
});
