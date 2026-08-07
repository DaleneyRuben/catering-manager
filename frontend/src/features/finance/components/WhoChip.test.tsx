import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhoChip } from '@/features/finance/components/WhoChip';

const setup = (name: string | null = 'Gilian Roca') =>
  render(<WhoChip name={name} registeredAt="2026-08-04T18:05:00.000Z" />);

describe('WhoChip', () => {
  it('stands for whoever registered the movement by their initials', () => {
    setup();

    expect(screen.getByRole('button', { name: /gilian roca/i })).toHaveTextContent('GR');
  });

  it('keeps provenance out of the way until it is asked for', () => {
    setup();

    expect(screen.queryByText('Registrado por')).not.toBeInTheDocument();
  });

  // Hover-only content is the defect v2 exists to fix, so the answer opens on click — which is
  // also the only thing a touch device can do.
  it('answers on click, naming who registered it and when', async () => {
    setup();

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Registrado por')).toBeInTheDocument();
    expect(screen.getByText('Gilian Roca')).toBeInTheDocument();
    expect(screen.getByText('el 04/08')).toBeInTheDocument();
  });

  it('closes again on a second click', async () => {
    setup();
    const chip = screen.getByRole('button');

    await userEvent.click(chip);
    await userEvent.click(chip);

    expect(screen.queryByText('Registrado por')).not.toBeInTheDocument();
  });

  it('closes when the click lands outside it', async () => {
    render(
      <div>
        <WhoChip name="Gilian Roca" registeredAt="2026-08-04T18:05:00.000Z" />
        <span data-testid="elsewhere">elsewhere</span>
      </div>,
    );
    await userEvent.click(screen.getByRole('button'));

    await userEvent.click(screen.getByTestId('elsewhere'));

    expect(screen.queryByText('Registrado por')).not.toBeInTheDocument();
  });

  // The movement was registered by someone, but that user has since been deleted. There is nobody
  // to name, so the chip holds the row's alignment and opens nothing.
  it('offers nothing to open when the registering user is gone', () => {
    setup(null);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
