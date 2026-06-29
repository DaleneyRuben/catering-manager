import { render, screen } from '@testing-library/react';
import { PageLoader } from './PageLoader';

it('renders the loading label', () => {
  render(<PageLoader />);
  expect(screen.getByText(/cargando/i)).toBeInTheDocument();
});
