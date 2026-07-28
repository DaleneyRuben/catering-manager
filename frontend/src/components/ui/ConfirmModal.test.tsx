import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from '@ui/ConfirmModal';

const noop = () => {};
const noopAsync = () => Promise.resolve();

describe('ConfirmModal', () => {
  it('renders title and message', () => {
    render(
      <ConfirmModal
        title="Eliminar plan"
        message="¿Seguro que querés eliminar este plan?"
        confirmLabel="Eliminar"
        onClose={noop}
        onConfirm={noopAsync}
      />,
    );
    expect(screen.getByText('Eliminar plan')).toBeInTheDocument();
    expect(screen.getByText('¿Seguro que querés eliminar este plan?')).toBeInTheDocument();
  });

  it('renders a details block below the message when one is given', () => {
    render(
      <ConfirmModal
        title="Eliminar plan"
        message="¿Seguro?"
        details={<span>Plan Ligero · 20 días</span>}
        confirmLabel="Eliminar"
        onClose={noop}
        onConfirm={noopAsync}
      />,
    );

    const details = screen.getByText('Plan Ligero · 20 días');
    expect(details).toBeInTheDocument();
    // a block inside the message paragraph would be invalid markup
    expect(details.closest('p')).toBeNull();
  });

  it('renders a danger icon badge when an icon is given', () => {
    render(
      <ConfirmModal
        title="Eliminar plan"
        message="¿Seguro?"
        confirmLabel="Eliminar"
        icon="trash"
        onClose={noop}
        onConfirm={noopAsync}
      />,
    );
    const badge = screen.getByTestId('confirm-modal-icon-badge');
    expect(badge.className).toContain('bg-danger-bg');
  });

  it('does not render an icon badge when no icon is given', () => {
    render(
      <ConfirmModal
        title="Finalizar plan"
        message="¿Seguro?"
        confirmLabel="Finalizar"
        onClose={noop}
        onConfirm={noopAsync}
      />,
    );
    expect(screen.queryByTestId('confirm-modal-icon-badge')).not.toBeInTheDocument();
  });

  it('renders the confirm button with the given label', () => {
    render(
      <ConfirmModal
        title="Finalizar plan"
        message="Esta acción no se puede deshacer."
        confirmLabel="Finalizar"
        onClose={noop}
        onConfirm={noopAsync}
      />,
    );
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = jest.fn();
    render(
      <ConfirmModal
        title="Test"
        message="Test message"
        confirmLabel="Confirmar"
        onClose={onClose}
        onConfirm={noopAsync}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and then onClose when confirm is clicked', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
      <ConfirmModal
        title="Test"
        message="Test message"
        confirmLabel="Confirmar"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders an olive icon badge and primary confirm button when variant is primary', async () => {
    render(
      <ConfirmModal
        title="Confirmar pago"
        message="¿Confirmás el pago?"
        confirmLabel="Confirmar pago"
        icon="check"
        variant="primary"
        onClose={noop}
        onConfirm={noopAsync}
      />,
    );
    const badge = screen.getByTestId('confirm-modal-icon-badge');
    expect(badge.className).toContain('bg-ok-bg');
    const confirmButton = screen.getByRole('button', { name: /confirmar pago/i });
    expect(confirmButton.className).toContain('bg-olive-700');
  });

  it('disables buttons while loading', async () => {
    const onConfirm = jest.fn(() => new Promise<void>(() => {}));
    render(
      <ConfirmModal
        title="Test"
        message="Test message"
        confirmLabel="Confirmar"
        onClose={noop}
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });
});
