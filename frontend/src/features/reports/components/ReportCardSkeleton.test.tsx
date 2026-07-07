import { render } from '@testing-library/react';
import { ReportCardSkeleton } from './ReportCardSkeleton';

it('renders without crashing', () => {
  const { container } = render(<ReportCardSkeleton />);
  expect(container.firstChild).toBeTruthy();
});
