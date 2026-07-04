import { render, screen } from '@testing-library/react';
import { ConnectionsCard } from '@/features/dashboard/components/ConnectionsCard';
import type { Connection } from '@/features/dashboard/types';

const online = (username: string): Connection => ({
  username,
  lastLoginAt: new Date(Date.now() - 2 * 60_000).toISOString(),
  online: true,
  lastDeviceType: null,
  lastOs: null,
  lastBrowser: null,
});

const offline = (username: string): Connection => ({
  username,
  lastLoginAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  online: false,
  lastDeviceType: null,
  lastOs: null,
  lastBrowser: null,
});

const withDevice = (username: string): Connection => ({
  ...online(username),
  lastDeviceType: 'mobile',
  lastOs: 'Android 14',
  lastBrowser: 'Chrome 126',
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

  it('shows the last device under the connection stamp', () => {
    render(<ConnectionsCard connections={[withDevice('Caro')]} />);
    expect(screen.getByText('Chrome 126 · Android 14 · Móvil')).toBeInTheDocument();
  });

  it('omits the device line when no device is known', () => {
    render(<ConnectionsCard connections={[online('Caro')]} />);
    expect(screen.queryByText(/·.*·/)).not.toBeInTheDocument();
  });

  it('top-aligns the status dot so rows with a device line stay consistent', () => {
    render(<ConnectionsCard connections={[withDevice('Caro')]} />);
    const row = screen.getByText('Caro').closest('div')!.parentElement!;
    expect(row.className).toContain('items-start');
    expect(row.className).not.toContain('items-center');
  });
});
