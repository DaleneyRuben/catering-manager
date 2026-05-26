import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';
import { HealthPage } from './HealthPage';

jest.mock('../services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

describe('HealthPage', () => {
  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <HealthPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Verificando...')).toBeInTheDocument();
  });

  it('shows connected when backend responds ok', async () => {
    mockGet.mockResolvedValue({ status: 'ok' });
    render(
      <MemoryRouter>
        <HealthPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Conectado')).toBeInTheDocument());
  });

  it('shows error when backend request fails', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));
    render(
      <MemoryRouter>
        <HealthPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Sin conexión')).toBeInTheDocument());
  });
});
