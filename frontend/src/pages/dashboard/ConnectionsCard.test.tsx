import { render, screen } from '@testing-library/react';
import { ConnectionsCard } from './ConnectionsCard';
import type { Connection } from '../../types/dashboard';

const onlineConnection: Connection = {
  username: 'cocina1',
  lastLoginAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  online: true,
};

const offlineConnection: Connection = {
  username: 'delivery1',
  lastLoginAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  online: false,
};

describe('ConnectionsCard', () => {
  it('shows the title', () => {
    render(<ConnectionsCard kitchen={null} delivery={null} />);
    expect(screen.getByText('Última conexión')).toBeInTheDocument();
  });

  it('shows role labels for both rows', () => {
    render(<ConnectionsCard kitchen={null} delivery={null} />);
    expect(screen.getByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
  });

  it('shows "Sin registro" when a connection is null', () => {
    render(<ConnectionsCard kitchen={null} delivery={null} />);
    expect(screen.getAllByText('Sin registro')).toHaveLength(2);
  });

  it('shows the username when a connection is present', () => {
    render(<ConnectionsCard kitchen={onlineConnection} delivery={null} />);
    expect(screen.getByText('cocina1')).toBeInTheDocument();
  });

  it('shows relative time when a connection is present', () => {
    render(<ConnectionsCard kitchen={onlineConnection} delivery={null} />);
    expect(screen.getByText(/hace \d+ min/)).toBeInTheDocument();
  });

  it('shows "Sin registro" only for the null connection when one is provided', () => {
    render(<ConnectionsCard kitchen={onlineConnection} delivery={null} />);
    expect(screen.getAllByText('Sin registro')).toHaveLength(1);
  });

  it('shows relative time for both when both connections are present', () => {
    render(<ConnectionsCard kitchen={onlineConnection} delivery={offlineConnection} />);
    expect(screen.queryByText('Sin registro')).not.toBeInTheDocument();
    expect(screen.getAllByText(/hace/)).toHaveLength(2);
  });
});
