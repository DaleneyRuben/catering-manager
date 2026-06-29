import { render } from '@testing-library/react';
import { UsersPageSkeleton } from './UsersPageSkeleton';

it('renders without crashing', () => {
  const { container } = render(<UsersPageSkeleton />);
  expect(container.firstChild).toBeTruthy();
});
