import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

function mockUserRole(role: string) {
  mockUseAuth.mockReturnValue({
    user: { id: 1, username: 'daleney', role },
    clearAuth: jest.fn(),
  });
}

describe('Layout', () => {
  beforeEach(() => {
    mockUserRole('admin');
  });

  it('renders children in the main area', () => {
    render(
      <MemoryRouter>
        <Layout>
          <p>page content</p>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('renders all nav items', () => {
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Planes')).toBeInTheDocument();
    expect(screen.getByText('Menú')).toBeInTheDocument();
    expect(screen.getByText('Informes')).toBeInTheDocument();
  });

  it('renders a hamburger button for mobile', () => {
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
  });

  it('sidebar starts closed on mobile and opens when hamburger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('-translate-x-full');

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(aside.className).not.toContain('-translate-x-full');
  });

  it('active nav link has the lime accent border', () => {
    render(
      <MemoryRouter initialEntries={['/clientes']}>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    const clientesLink = screen.getByRole('link', { name: /clientes/i });
    expect(clientesLink.className).toContain('border-olive-400');
  });

  it('renders the brand wordmark and tagline', () => {
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getAllByText('La Oliva').length).toBeGreaterThan(0);
    expect(screen.getByText('Catering · con altura')).toBeInTheDocument();
  });

  it('renders the Gestión nav group label', () => {
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Gestión')).toBeInTheDocument();
  });

  it('renders the Administración nav group label for super_admin', () => {
    mockUserRole('super_admin');
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  it('shows the user initial and role label in the footer', () => {
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('closes the sidebar when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByTestId('sidebar-backdrop'));
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('-translate-x-full');
  });

  it('shows only Menú and Informes for the kitchen role', () => {
    mockUserRole('kitchen');
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByText('Planes')).not.toBeInTheDocument();
    expect(screen.getByText('Menú')).toBeInTheDocument();
    expect(screen.getByText('Informes')).toBeInTheDocument();
  });

  it('does not show Usuarios/Health nav items for the admin role', () => {
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Health')).not.toBeInTheDocument();
  });

  it('shows Usuarios/Health nav items for the super_admin role', () => {
    mockUserRole('super_admin');
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('shows only Entregas for the delivery role', () => {
    mockUserRole('delivery');
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByText('Planes')).not.toBeInTheDocument();
    expect(screen.queryByText('Menú')).not.toBeInTheDocument();
    expect(screen.queryByText('Informes')).not.toBeInTheDocument();
    expect(screen.getByText('Entregas')).toBeInTheDocument();
  });

  it('shows Entregas alongside everything else for the admin role', () => {
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Entregas')).toBeInTheDocument();
  });

  it('shows Entregas alongside everything else for the super_admin role', () => {
    mockUserRole('super_admin');
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Entregas')).toBeInTheDocument();
  });

  it('shows the logout button for the delivery role', () => {
    mockUserRole('delivery');
    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });
});
