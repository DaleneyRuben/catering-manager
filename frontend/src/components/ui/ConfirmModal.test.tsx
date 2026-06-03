import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from './ConfirmModal';

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
