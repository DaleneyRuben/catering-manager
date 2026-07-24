import { render, screen } from '@testing-library/react';
import { EvaluacionesPage } from '@/pages/EvaluacionesPage';

describe('EvaluacionesPage', () => {
  it('renders the Evaluaciones heading', () => {
    render(<EvaluacionesPage />);
    expect(screen.getByText('Evaluaciones')).toBeInTheDocument();
  });
});
