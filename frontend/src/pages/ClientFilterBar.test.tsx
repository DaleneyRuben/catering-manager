import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientFilterBar } from './ClientFilterBar';
import { CLIENT_STATUS } from '../constants/clientStatus';

const baseProps = {
  q: '',
  onQChange: jest.fn(),
  birthMonth: 'all',
  onBirthMonthChange: jest.fn(),
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

  it('calls onBirthMonthChange when a month is selected', async () => {
    const onBirthMonthChange = jest.fn();
    render(<ClientFilterBar {...baseProps} onBirthMonthChange={onBirthMonthChange} />);
    const select = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(select, '3');
    expect(onBirthMonthChange).toHaveBeenCalledWith('3');
  });

  it('shows the results label', () => {
    render(<ClientFilterBar {...baseProps} resultsLabel="7 resultados" />);
    expect(screen.getByText('7 resultados')).toBeInTheDocument();
  });

  it('toggles secondary filters visibility on mobile filter button click', async () => {
    render(<ClientFilterBar {...baseProps} />);
    const toggle = screen.getByLabelText('Filtros');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Activos' })).toBeInTheDocument();
  });
});
