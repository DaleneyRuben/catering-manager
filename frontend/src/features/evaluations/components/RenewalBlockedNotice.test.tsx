import { render, screen } from '@testing-library/react';
import { RenewalBlockedNotice } from './RenewalBlockedNotice';

describe('RenewalBlockedNotice', () => {
  it('keeps the action label but renders it dead', () => {
    render(<RenewalBlockedNotice hasStartDate />);

    expect(screen.getByRole('button', { name: /renovar plan/i })).toBeDisabled();
  });

  it('explains why and where to escalate', () => {
    render(<RenewalBlockedNotice hasStartDate />);

    expect(
      screen.getByText(
        'Este cliente ya tiene una renovación registrada. No puedes registrar otra. Si hay que cambiarla, pide a administración que la elimine.',
      ),
    ).toBeInTheDocument();
  });

  it('says the registered renewal is still waiting for a start date', () => {
    render(<RenewalBlockedNotice hasStartDate={false} />);

    expect(
      screen.getByText(
        'Este cliente ya tiene una renovación registrada, pendiente de fecha de inicio. Si hay que cambiarla, pide a administración que la elimine.',
      ),
    ).toBeInTheDocument();
  });

  it('explains the block on hover too', () => {
    render(<RenewalBlockedNotice hasStartDate />);

    expect(screen.getByRole('button', { name: /renovar plan/i })).toHaveAttribute(
      'title',
      'Ya hay una renovación registrada para este cliente.',
    );
  });
});
