import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';

describe('Layout', () => {
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
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Planes')).toBeInTheDocument();
    expect(screen.getByText('Menú')).toBeInTheDocument();
    expect(screen.getByText('Informes')).toBeInTheDocument();
    expect(screen.getByText('Renovaciones')).toBeInTheDocument();
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
});
