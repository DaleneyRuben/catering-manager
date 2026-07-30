import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationHistoryFilterBar } from '@/features/evaluations/components/EvaluationHistoryFilterBar';

const baseProps = {
  q: '',
  onQChange: jest.fn(),
  status: 'all' as const,
  onStatusChange: jest.fn(),
  dateFrom: '',
  onDateFromChange: jest.fn(),
  dateTo: '',
  onDateToChange: jest.fn(),
  resultsLabel: '8 resultados',
  isFetching: false,
};

describe('EvaluationHistoryFilterBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the name/phone search input', () => {
    render(<EvaluationHistoryFilterBar {...baseProps} />);
    expect(screen.getByPlaceholderText('Buscar por nombre o teléfono…')).toBeInTheDocument();
  });

  it('calls onQChange when typing in the search input', async () => {
    const onQChange = jest.fn();
    render(<EvaluationHistoryFilterBar {...baseProps} onQChange={onQChange} />);
    await userEvent.type(screen.getByPlaceholderText('Buscar por nombre o teléfono…'), 'a');
    expect(onQChange).toHaveBeenCalledWith('a');
  });

  it('shows a clear button when the search has a value, and clears it on click', async () => {
    const onQChange = jest.fn();
    render(<EvaluationHistoryFilterBar {...baseProps} q="Julia" onQChange={onQChange} />);
    await userEvent.click(screen.getByLabelText('Limpiar búsqueda'));
    expect(onQChange).toHaveBeenCalledWith('');
  });

  it('renders all status filter buttons', () => {
    render(<EvaluationHistoryFilterBar {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No pagado' })).toBeInTheDocument();
  });

  it('calls onStatusChange when a status button is clicked', async () => {
    const onStatusChange = jest.fn();
    render(<EvaluationHistoryFilterBar {...baseProps} onStatusChange={onStatusChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pagado' }));
    expect(onStatusChange).toHaveBeenCalledWith('pagado');
  });

  it('renders Desde and Hasta date inputs', () => {
    render(<EvaluationHistoryFilterBar {...baseProps} />);
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
  });

  it('shows the results label', () => {
    render(<EvaluationHistoryFilterBar {...baseProps} resultsLabel="3 resultados" />);
    expect(screen.getByText('3 resultados')).toBeInTheDocument();
  });
});
