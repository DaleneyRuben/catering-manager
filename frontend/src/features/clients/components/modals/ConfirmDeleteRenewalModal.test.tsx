import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Subscription } from '@/features/clients/types';
import { ConfirmDeleteRenewalModal } from './ConfirmDeleteRenewalModal';

const renewal = (over: Partial<Subscription> = {}): Subscription =>
  ({
    id: 'renewal',
    startDate: '2026-07-02',
    contractEndDate: '2026-07-29',
    duration: 20,
    plan: { id: 'p1', name: 'Hiperproteico', meals: [], price: 1390 },
    ...over,
  }) as Subscription;

const baseProps = {
  clientName: 'Pablo Villarroel',
  renewal: renewal(),
  onClose: jest.fn(),
  onConfirm: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => jest.clearAllMocks());

it('names the contract that will be removed', () => {
  render(<ConfirmDeleteRenewalModal {...baseProps} />);

  expect(screen.getByText(/Pablo Villarroel/)).toBeInTheDocument();
  // once in the sentence, once in the recap block
  expect(screen.getAllByText(/02\/07\/2026 → 29\/07\/2026/)).toHaveLength(2);
  expect(screen.getAllByText(/Hiperproteico/)).toHaveLength(2);
});

it('describes a renewal without a start date', () => {
  render(
    <ConfirmDeleteRenewalModal
      {...baseProps}
      renewal={renewal({ startDate: null, contractEndDate: null })}
    />,
  );

  expect(screen.getAllByText(/sin fecha de inicio/i)).toHaveLength(2);
});

it('recaps the renewal being removed in its own block', () => {
  render(<ConfirmDeleteRenewalModal {...baseProps} />);

  expect(screen.getByText(/Renovación por eliminar/i)).toBeInTheDocument();
  expect(
    screen.getByText('Hiperproteico · 02/07/2026 → 29/07/2026 · 20 días hábiles'),
  ).toBeInTheDocument();
});

it('recaps a renewal without a start date', () => {
  render(
    <ConfirmDeleteRenewalModal
      {...baseProps}
      renewal={renewal({ startDate: null, contractEndDate: null })}
    />,
  );

  expect(
    screen.getByText('Hiperproteico · 20 días hábiles · sin fecha de inicio'),
  ).toBeInTheDocument();
});

it('says the running plan is not affected', () => {
  render(<ConfirmDeleteRenewalModal {...baseProps} />);

  expect(screen.getByText(/El plan vigente no cambia/)).toBeInTheDocument();
});

it('confirms the deletion', async () => {
  const onConfirm = jest.fn().mockResolvedValue(undefined);
  render(<ConfirmDeleteRenewalModal {...baseProps} onConfirm={onConfirm} />);

  await userEvent.click(screen.getByRole('button', { name: /eliminar renovación/i }));

  expect(onConfirm).toHaveBeenCalled();
});
