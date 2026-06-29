import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmFinalizeModal } from './ConfirmFinalizeModal';

it('shows the client name in the message', () => {
  render(
    <ConfirmFinalizeModal clientName="Ana Torres" onClose={jest.fn()} onConfirm={jest.fn()} />,
  );
  expect(screen.getByText(/Ana Torres/)).toBeInTheDocument();
});

it('shows the Finalizar plan title', () => {
  render(
    <ConfirmFinalizeModal clientName="Ana Torres" onClose={jest.fn()} onConfirm={jest.fn()} />,
  );
  expect(screen.getByText('Finalizar plan')).toBeInTheDocument();
});

it('calls onClose when cancel button is clicked', async () => {
  const onClose = jest.fn();
  render(<ConfirmFinalizeModal clientName="Ana Torres" onClose={onClose} onConfirm={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('calls onConfirm when Finalizar button is clicked', async () => {
  const onConfirm = jest.fn().mockResolvedValue(undefined);
  render(
    <ConfirmFinalizeModal clientName="Ana Torres" onClose={jest.fn()} onConfirm={onConfirm} />,
  );
  await userEvent.click(screen.getByRole('button', { name: /finalizar/i }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
