import { render, screen } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import type { DashboardSummary } from '../types/dashboard';
import { useDashboard } from '../hooks/useDashboard';

jest.mock('../hooks/useDashboard');
const mockUseDashboard = useDashboard as jest.MockedFunction<typeof useDashboard>;

const summary: DashboardSummary = {
  active: { today: 12, tomorrow: 15 },
  suspended: { today: 4, tomorrow: 3 },
  deliveriesToday: 9,
  contractEnding: { today: [], tomorrow: [] },
  birthdays: [],
  connections: { kitchen: null, delivery: null },
  menus: {
    today: { date: '2026-06-23', loaded: true },
    tomorrow: { date: '2026-06-24', loaded: false },
  },
};

describe('DashboardPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the Panel heading', () => {
    mockUseDashboard.mockReturnValue({ summary, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
  });

  it('shows a loading message while data is fetching', () => {
    mockUseDashboard.mockReturnValue({ summary: undefined, isLoading: true });
    render(<DashboardPage />);
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('renders all three KPI cards', () => {
    mockUseDashboard.mockReturnValue({ summary, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByText('Activos')).toBeInTheDocument();
    expect(screen.getByText('Suspendidos')).toBeInTheDocument();
    expect(screen.getByText('Entregas hoy')).toBeInTheDocument();
  });

  it('renders the contract ending card', () => {
    mockUseDashboard.mockReturnValue({ summary, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByText('Terminan contrato')).toBeInTheDocument();
  });

  it('renders the birthdays card', () => {
    mockUseDashboard.mockReturnValue({ summary, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByText('Cumpleaños')).toBeInTheDocument();
  });

  it('renders the connections card', () => {
    mockUseDashboard.mockReturnValue({ summary, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByText('Última conexión')).toBeInTheDocument();
  });

  it('renders the menu status card', () => {
    mockUseDashboard.mockReturnValue({ summary, isLoading: false });
    render(<DashboardPage />);
    expect(screen.getByText('Menú del día')).toBeInTheDocument();
  });
});
