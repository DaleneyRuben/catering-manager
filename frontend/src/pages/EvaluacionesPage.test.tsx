import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EvaluacionesPage } from '@/pages/EvaluacionesPage';
import { useAuth } from '@/features/auth/AuthContext';

jest.mock('@/features/auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

function mockUserRole(role: string) {
  (useAuth as jest.Mock).mockReturnValue({ user: { id: '1', username: 'x', role } });
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EvaluacionesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EvaluacionesPage', () => {
  it('renders the admin view, with a Nueva cita button, for admin roles', async () => {
    mockUserRole('admin');
    renderPage();
    expect(await screen.findAllByRole('button', { name: /nueva cita/i })).not.toHaveLength(0);
  });

  it('renders the admin view for super_admin', async () => {
    mockUserRole('super_admin');
    renderPage();
    expect(await screen.findAllByRole('button', { name: /nueva cita/i })).not.toHaveLength(0);
  });

  it('renders the nutricionista view, with no Nueva cita button, for the nutritionist role', async () => {
    mockUserRole('nutritionist');
    renderPage();
    expect(await screen.findByRole('heading', { name: /evaluaciones/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nueva cita/i })).not.toBeInTheDocument();
  });
});
