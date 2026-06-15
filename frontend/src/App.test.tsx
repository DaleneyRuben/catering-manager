import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'daleney', role: 'manager' },
    token: 'fake-token',
    setAuth: jest.fn(),
    clearAuth: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn(),
  },
}));

function renderAt(path: string) {
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
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders the clients page at /clientes', async () => {
    renderAt('/clientes');
    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('renders the plans page at /planes', async () => {
    renderAt('/planes');
    expect(await screen.findByRole('heading', { name: 'Planes' })).toBeInTheDocument();
  });
});
