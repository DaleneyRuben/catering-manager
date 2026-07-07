import { render, screen } from '@testing-library/react';
import { PlanRadioListSkeleton } from './PlanRadioListSkeleton';

it('renders three skeleton rows', () => {
  render(<PlanRadioListSkeleton />);
  expect(screen.getAllByTestId('plan-radio-skeleton-row')).toHaveLength(3);
});
