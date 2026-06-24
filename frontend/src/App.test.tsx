import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { useAuth } from './contexts/AuthContext';

jest.mock('./contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.Mock;

function renderAt(path: string, role: string = 'admin') {
  mockUseAuth.mockReturnValue({
    user: { id: 1, username: 'daleney', role },
    token: 'fake-token',
    setAuth: jest.fn(),
    clearAuth: jest.fn(),
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the dashboard at root', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
  });

  it('renders the clients page at /clientes', async () => {
    renderAt('/clientes');
    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('renders the plans page at /planes', async () => {
    renderAt('/planes');
    expect(await screen.findByRole('heading', { name: 'Planes' })).toBeInTheDocument();
  });

  it('lets kitchen role reach the menu page', async () => {
    renderAt('/menu', 'kitchen');
    expect(await screen.findByRole('heading', { name: 'Menú del día' })).toBeInTheDocument();
  });

  it('lets kitchen role reach the reports page', async () => {
    renderAt('/informes', 'kitchen');
    expect(await screen.findByRole('heading', { name: 'Informes' })).toBeInTheDocument();
  });

  it('blocks kitchen role from the clients page', async () => {
    renderAt('/clientes', 'kitchen');
    expect(await screen.findByText('No tenés acceso a esta sección.')).toBeInTheDocument();
  });

  it('lets delivery role reach /entregas', async () => {
    renderAt('/entregas', 'delivery');
    expect(await screen.findByRole('heading', { name: 'Entregas' })).toBeInTheDocument();
  });

  it('blocks delivery role from the menu page', async () => {
    renderAt('/menu', 'delivery');
    expect(await screen.findByText('No tenés acceso a esta sección.')).toBeInTheDocument();
  });

  it('lets admin role reach /entregas', async () => {
    renderAt('/entregas', 'admin');
    expect(await screen.findByRole('heading', { name: 'Entregas' })).toBeInTheDocument();
  });

  it('lets super_admin role reach /entregas', async () => {
    renderAt('/entregas', 'super_admin');
    expect(await screen.findByRole('heading', { name: 'Entregas' })).toBeInTheDocument();
  });
});
