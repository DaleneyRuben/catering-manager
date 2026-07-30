import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Subscription } from '@/features/clients/types';
import { QueuedRenewalNotice } from './QueuedRenewalNotice';

const renewal = (over: Partial<Subscription> = {}): Subscription =>
  ({
    id: 'renewal',
    startDate: '2026-07-29',
    contractEndDate: '2026-08-25',
    finalizedAt: null,
    duration: 20,
    plan: { id: 'p1', name: 'Hiperproteico', meals: [], price: 1390 },
    ...over,
  }) as Subscription;

const noop = () => {};

describe('QueuedRenewalNotice', () => {
  it('announces the renewal with its start date', () => {
    render(
      <QueuedRenewalNotice
        renewal={renewal()}
        isPaused={false}
        onDelete={noop}
        onAssignStartDate={noop}
      />,
    );

    expect(screen.getByText(/Renovación registrada · inicia el 29\/07\/2026/)).toBeInTheDocument();
    expect(
      screen.getByText(/Hiperproteico · 29\/07\/2026 → 25\/08\/2026 · 20 días hábiles/),
    ).toBeInTheDocument();
  });

  it('stays to two lines — the "why Renovar is disabled" explanation lives in the header tooltip now', () => {
    render(
      <QueuedRenewalNotice
        renewal={renewal()}
        isPaused={false}
        onDelete={noop}
        onAssignStartDate={noop}
      />,
    );

    expect(screen.queryByText(/Renovar está inactivo/)).not.toBeInTheDocument();
  });

  it('calls onDelete when the renewal is deleted', async () => {
    const onDelete = jest.fn();
    render(
      <QueuedRenewalNotice
        renewal={renewal()}
        isPaused={false}
        onDelete={onDelete}
        onAssignStartDate={noop}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Eliminar renovación/ }));

    expect(onDelete).toHaveBeenCalled();
  });

  it('offers assigning a start date only when the renewal has none', async () => {
    const onAssignStartDate = jest.fn();
    const { rerender } = render(
      <QueuedRenewalNotice
        renewal={renewal()}
        isPaused={false}
        onDelete={noop}
        onAssignStartDate={onAssignStartDate}
      />,
    );

    expect(screen.queryByRole('button', { name: /Asignar fecha de inicio/ })).toBeNull();

    rerender(
      <QueuedRenewalNotice
        renewal={renewal({ startDate: null, contractEndDate: null })}
        isPaused
        onDelete={noop}
        onAssignStartDate={onAssignStartDate}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Asignar fecha de inicio/ }));

    expect(onAssignStartDate).toHaveBeenCalled();
  });

  it('describes a renewal that is still waiting for a start date', () => {
    render(
      <QueuedRenewalNotice
        renewal={renewal({ startDate: null, contractEndDate: null })}
        isPaused
        onDelete={noop}
        onAssignStartDate={noop}
      />,
    );

    expect(screen.getByText(/renovación sin fecha de inicio/)).toBeInTheDocument();
    expect(
      screen.getByText(/Hiperproteico · 20 días hábiles · sin fecha de inicio/),
    ).toBeInTheDocument();
  });

  it("renders the delete action in the banner's own palette, not the destructive one", () => {
    render(
      <QueuedRenewalNotice
        renewal={renewal()}
        isPaused={false}
        onDelete={noop}
        onAssignStartDate={noop}
      />,
    );

    const button = screen.getByRole('button', { name: /Eliminar renovación/ });

    // red is reserved for the confirmation modal that follows this click, not the banner itself
    expect(button.className).not.toMatch(/text-danger/);
    expect(button).toHaveClass('text-success-text');
  });

  it('gives the delete action the amber register when the banner is paused', () => {
    render(
      <QueuedRenewalNotice renewal={renewal()} isPaused onDelete={noop} onAssignStartDate={noop} />,
    );

    const button = screen.getByRole('button', { name: /Eliminar renovación/ });

    expect(button.className).not.toMatch(/text-danger/);
    expect(button).toHaveClass('text-warn-text');
  });

  it('keeps the assign-date action in the register of the banner it sits in', () => {
    const withoutDates = renewal({ startDate: null, contractEndDate: null });
    const { rerender } = render(
      <QueuedRenewalNotice
        renewal={withoutDates}
        isPaused={false}
        onDelete={noop}
        onAssignStartDate={noop}
      />,
    );

    const olive = screen.getByRole('button', { name: /Asignar fecha de inicio/ });
    expect(olive).toHaveClass('text-olive-800');
    expect(olive.className).not.toMatch(/text-olive-600/);

    rerender(
      <QueuedRenewalNotice
        renewal={withoutDates}
        isPaused
        onDelete={noop}
        onAssignStartDate={noop}
      />,
    );

    const amber = screen.getByRole('button', { name: /Asignar fecha de inicio/ });
    expect(amber).toHaveClass('text-warn-text-strong');
    expect(amber.className).not.toMatch(/text-olive/);
  });

  it('merges the pause notice into a single banner for a paused client', () => {
    render(
      <QueuedRenewalNotice renewal={renewal()} isPaused onDelete={noop} onAssignStartDate={noop} />,
    );

    // the paused-client reminder is already carried by the status pill next to the client's name —
    // repeating it here would push this banner past the two-line cap
    expect(screen.getByText(/Plan en pausa · renovación registrada/)).toBeInTheDocument();
    expect(screen.queryByText(/El cliente no recibe entregas/)).not.toBeInTheDocument();
  });
});
