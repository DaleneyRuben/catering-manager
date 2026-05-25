import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn(),
  },
}));

describe('App', () => {
  it('renders the dashboard at root', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders the clients page at /clientes', () => {
    render(
      <MemoryRouter initialEntries={['/clientes']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('renders the plans page at /planes', () => {
    render(
      <MemoryRouter initialEntries={['/planes']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Planes' })).toBeInTheDocument();
  });
});
