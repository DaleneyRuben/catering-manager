import { render, screen } from '@testing-library/react';
import { ConnectionsCard } from './ConnectionsCard';
import type { Connection } from '../../types/dashboard';

const online = (username: string): Connection => ({
  username,
  lastLoginAt: new Date(Date.now() - 2 * 60_000).toISOString(),
  online: true,
});

const offline = (username: string): Connection => ({
  username,
  lastLoginAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  online: false,
});

describe('ConnectionsCard', () => {
  it('shows the title', () => {
    render(<ConnectionsCard connections={[]} />);
    expect(screen.getByText('Última conexión')).toBeInTheDocument();
  });

  it('shows "Sin registro" when the list is empty', () => {
    render(<ConnectionsCard connections={[]} />);
    expect(screen.getByText('Sin registro')).toBeInTheDocument();
  });

  it('renders a row for each connection', () => {
    render(<ConnectionsCard connections={[online('Caro'), online('Randy')]} />);
    expect(screen.getByText('Caro')).toBeInTheDocument();
    expect(screen.getByText('Randy')).toBeInTheDocument();
  });

  it('shows relative time for each connection', () => {
    render(<ConnectionsCard connections={[online('Caro'), offline('Randy')]} />);
    expect(screen.getAllByText(/hace/)).toHaveLength(2);
  });

  it('does not show "Sin registro" when connections are present', () => {
    render(<ConnectionsCard connections={[online('Caro')]} />);
    expect(screen.queryByText('Sin registro')).not.toBeInTheDocument();
  });

  it('renders all connections including multiple from the same role', () => {
    render(<ConnectionsCard connections={[online('Caro'), online('Susy'), offline('Randy')]} />);
    expect(screen.getByText('Caro')).toBeInTheDocument();
    expect(screen.getByText('Susy')).toBeInTheDocument();
    expect(screen.getByText('Randy')).toBeInTheDocument();
  });
});
