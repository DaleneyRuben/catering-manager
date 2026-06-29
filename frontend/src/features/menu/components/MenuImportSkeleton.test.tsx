import { render } from '@testing-library/react';
import { MenuImportSkeleton } from './MenuImportSkeleton';

it('renders without crashing', () => {
  const { container } = render(<MenuImportSkeleton />);
  expect(container.firstChild).toBeTruthy();
});
