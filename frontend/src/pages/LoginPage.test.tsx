import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockSetAuth = jest.fn();

function renderPage() {
  (useAuth as jest.Mock).mockReturnValue({ setAuth: mockSetAuth });
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables submit when fields are empty', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeDisabled();
  });

  it('enables submit when both fields are filled', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/usuario/i, { selector: 'input' }), 'admin');
    await userEvent.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'secret');
    expect(screen.getByRole('button', { name: 'Ingresar' })).not.toBeDisabled();
  });

  it('calls setAuth and navigates to / on successful manager login', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ token: 'tok', user: { id: 1, username: 'admin', role: 'manager' } }),
    }) as jest.Mock;

    renderPage();
    await userEvent.type(screen.getByLabelText(/usuario/i, { selector: 'input' }), 'admin');
    await userEvent.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(
        { id: 1, username: 'admin', role: 'manager' },
        'tok',
      );
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('navigates to /entregas for delivery role', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          token: 'tok',
          user: { id: 2, username: 'repartidor', role: 'delivery' },
        }),
    }) as jest.Mock;

    renderPage();
    await userEvent.type(screen.getByLabelText(/usuario/i, { selector: 'input' }), 'repartidor');
    await userEvent.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'pass');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/entregas', { replace: true });
    });
  });

  it('shows error message on failed login', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Credenciales inválidas' }),
    }) as jest.Mock;

    renderPage();
    await userEvent.type(screen.getByLabelText(/usuario/i, { selector: 'input' }), 'bad');
    await userEvent.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('shows network error on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as jest.Mock;

    renderPage();
    await userEvent.type(screen.getByLabelText(/usuario/i, { selector: 'input' }), 'admin');
    await userEvent.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('No se pudo conectar con el servidor')).toBeInTheDocument();
  });

  it('toggles password input visibility', async () => {
    renderPage();
    const input = screen.getByLabelText(/contraseña/i, { selector: 'input' });
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
