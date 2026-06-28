import { render, screen, fireEvent } from '@testing-library/react';
import { ClientSuspensionsTab } from './ClientSuspensionsTab';
import type { Subscription } from '../../types/client';

const baseSub: Subscription = {
  id: '1',
  clientId: '1',
  planId: '2',
  contractDate: '2026-06-01',
  startDate: '2026-06-02',
  contractEndDate: '2026-07-02',
  discount: 0,
  duration: 20,
  suspendedDates: [],
  finalizedAt: null,
  pausedSince: null,
  remainingDays: null,
  plan: { id: '2', name: 'Plan A', price: 1200, meals: [] },
};

describe('ClientSuspensionsTab', () => {
  it('shows empty state when no suspended dates', () => {
    render(<ClientSuspensionsTab sub={baseSub} onSuspend={jest.fn()} />);
    expect(screen.getByText(/sin suspensiones registradas/i)).toBeInTheDocument();
  });

  it('shows count of suspended days', () => {
    const sub = { ...baseSub, suspendedDates: ['2026-06-10', '2026-06-11'] };
    render(<ClientSuspensionsTab sub={sub} onSuspend={jest.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders suspended date chips', () => {
    const sub = { ...baseSub, suspendedDates: ['2026-06-10'] };
    render(<ClientSuspensionsTab sub={sub} onSuspend={jest.fn()} />);
    expect(screen.getByText('10/06/2026')).toBeInTheDocument();
  });

  it('calls onSuspend when button is clicked', () => {
    const onSuspend = jest.fn();
    render(<ClientSuspensionsTab sub={baseSub} onSuspend={onSuspend} />);
    fireEvent.click(screen.getByRole('button', { name: /^suspender$/i }));
    expect(onSuspend).toHaveBeenCalledTimes(1);
  });

  it('shows the Suspensiones header label', () => {
    render(<ClientSuspensionsTab sub={baseSub} onSuspend={jest.fn()} />);
    expect(screen.getByText('Suspensiones')).toBeInTheDocument();
  });

  it('shows zero count and empty state when sub is undefined', () => {
    render(<ClientSuspensionsTab sub={undefined} onSuspend={jest.fn()} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/sin suspensiones registradas/i)).toBeInTheDocument();
  });
});
