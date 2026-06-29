import { render } from '@testing-library/react';
import { ClientDetailSkeleton } from './ClientDetailSkeleton';

it('renders without crashing', () => {
  const { container } = render(<ClientDetailSkeleton />);
  expect(container.firstChild).toBeTruthy();
});
