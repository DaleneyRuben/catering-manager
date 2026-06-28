import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientFilterBar } from './ClientFilterBar';
import { CLIENT_STATUS } from '../../constants/clientStatus';

const baseProps = {
  q: '',
  onQChange: jest.fn(),
  restriction: '',
  onRestrictionChange: jest.fn(),
  filter: CLIENT_STATUS.ALL,
  onFilterChange: jest.fn(),
  resultsLabel: '3 resultados',
  isFetching: false,
};

describe('ClientFilterBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the name search input', () => {
    render(<ClientFilterBar {...baseProps} />);
    expect(screen.getByPlaceholderText('Buscar cliente…')).toBeInTheDocument();
  });

  it('calls onQChange when typing in the search input', async () => {
    const onQChange = jest.fn();
    render(<ClientFilterBar {...baseProps} onQChange={onQChange} />);
    await userEvent.type(screen.getByPlaceholderText('Buscar cliente…'), 'a');
    expect(onQChange).toHaveBeenCalledWith('a');
  });

  it('does not show a clear button when the name search is empty', () => {
    render(<ClientFilterBar {...baseProps} q="" />);
    expect(screen.queryByLabelText('Limpiar búsqueda de cliente')).not.toBeInTheDocument();
  });

  it('shows a clear button when the name search has a value, and clears it on click', async () => {
    const onQChange = jest.fn();
    render(<ClientFilterBar {...baseProps} q="Juan" onQChange={onQChange} />);
    const clearButton = screen.getByLabelText('Limpiar búsqueda de cliente');
    await userEvent.click(clearButton);
    expect(onQChange).toHaveBeenCalledWith('');
  });

  it('blurs the name search input on Enter so mobile keyboards dismiss', async () => {
    render(<ClientFilterBar {...baseProps} q="Juan" />);
    const input = screen.getByPlaceholderText('Buscar cliente…');
    input.focus();
    expect(input).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(input).not.toHaveFocus();
  });

  it('renders the allergy/restriction search input', () => {
    render(<ClientFilterBar {...baseProps} />);
    expect(screen.getByPlaceholderText('Buscar por alergia o restricción…')).toBeInTheDocument();
  });

  it('calls onRestrictionChange when typing in the allergy search input', async () => {
    const onRestrictionChange = jest.fn();
    render(<ClientFilterBar {...baseProps} onRestrictionChange={onRestrictionChange} />);
    await userEvent.type(screen.getByPlaceholderText('Buscar por alergia o restricción…'), 'l');
    expect(onRestrictionChange).toHaveBeenCalledWith('l');
  });

  it('blurs the allergy search input on Enter so mobile keyboards dismiss', async () => {
    render(<ClientFilterBar {...baseProps} restriction="maní" />);
    const input = screen.getByPlaceholderText('Buscar por alergia o restricción…');
    input.focus();
    expect(input).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(input).not.toHaveFocus();
  });

  it('does not show a clear button when the allergy search is empty', () => {
    render(<ClientFilterBar {...baseProps} restriction="" />);
    expect(screen.queryByLabelText('Limpiar búsqueda de alergia')).not.toBeInTheDocument();
  });

  it('shows a clear button when the allergy search has a value, and clears it on click', async () => {
    const onRestrictionChange = jest.fn();
    render(
      <ClientFilterBar
        {...baseProps}
        restriction="maní"
        onRestrictionChange={onRestrictionChange}
      />,
    );
    const clearButton = screen.getByLabelText('Limpiar búsqueda de alergia');
    await userEvent.click(clearButton);
    expect(onRestrictionChange).toHaveBeenCalledWith('');
  });

  it('renders all status filter buttons', () => {
    render(<ClientFilterBar {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Por vencer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausados' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizados' })).toBeInTheDocument();
  });

  it('calls onFilterChange when a status button is clicked', async () => {
    const onFilterChange = jest.fn();
    render(<ClientFilterBar {...baseProps} onFilterChange={onFilterChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Activos' }));
    expect(onFilterChange).toHaveBeenCalledWith(CLIENT_STATUS.ACTIVE);
  });

  it('shows the results label', () => {
    render(<ClientFilterBar {...baseProps} resultsLabel="7 resultados" />);
    expect(screen.getByText('7 resultados')).toBeInTheDocument();
  });
});
