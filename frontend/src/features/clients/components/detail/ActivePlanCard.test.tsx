import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivePlanCard } from '@/features/clients/components/detail/ActivePlanCard';
import { usePlans } from '@/features/plans/hooks/usePlans';
import type { Subscription } from '@/features/clients/types';

jest.mock('@/features/plans/hooks/usePlans');

const plans = [
  { id: '1', name: 'Completo', price: 150, meals: ['breakfast', 'lunch'] },
  { id: '2', name: 'Ligero', price: 100, meals: ['lunch'] },
  { id: '3', name: 'Premium', price: 300, meals: ['breakfast', 'lunch', 'dinner'] },
];

(usePlans as jest.Mock).mockReturnValue({ plans, isLoading: false });

const sub: Subscription = {
  id: '1',
  clientId: '42',
  planId: '1',
  contractDate: '2026-01-01',
  startDate: '2026-01-02',
  contractEndDate: '2026-03-01',
  duration: 40,
  price: 140,
  suspendedDates: [],
  finalizedAt: null,
  plan: {
    id: '1',
    name: 'Completo',
    price: 150,
    meals: ['breakfast', 'lunch'],
  },
};

const onUpdateTerms = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  (usePlans as jest.Mock).mockReturnValue({ plans, isLoading: false });
});

it('renders plan name and total', () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  expect(screen.getByText('Completo')).toBeInTheDocument();
  expect(screen.getAllByText('140')).toHaveLength(2); // header + grid row
});

it('formats prices over 1000 with a dot thousands separator', () => {
  const bigSub: Subscription = {
    ...sub,
    price: 1390,
    plan: { ...sub.plan, price: 1390 },
  };
  render(<ActivePlanCard sub={bigSub} onUpdateTerms={onUpdateTerms} />);
  expect(screen.getAllByText('1.390')).toHaveLength(3);
});

it('renders meal pills', () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  expect(screen.getByText('Desayuno')).toBeInTheDocument();
  expect(screen.getByText('Almuerzo')).toBeInTheDocument();
});

it('shows the plan price, the gap against it and the total in read mode', () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  expect(screen.getByText('150')).toBeInTheDocument();
  expect(screen.getByText('Descuento')).toBeInTheDocument();
  expect(screen.getByText('10')).toBeInTheDocument();
});

// A plan's price is quoted for 20 delivery days, so a longer contract legitimately costs more
// than the plan it came from — something the old discount-only model could not represent.
it('calls the gap a surcharge when the agreed price is above the plan price', () => {
  const longer: Subscription = { ...sub, price: 220, duration: 30 };
  render(<ActivePlanCard sub={longer} onUpdateTerms={onUpdateTerms} />);
  expect(screen.getByText('Recargo')).toBeInTheDocument();
  expect(screen.getByText('70')).toBeInTheDocument();
});

it('does not cap the price input at the plan price', () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  expect(screen.getByDisplayValue('140')).not.toHaveAttribute('max');
});

it('opens edit form when pencil is clicked', () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  expect(screen.getByDisplayValue('140')).toBeInTheDocument();
});

it('calls onUpdateTerms with the agreed price on save', async () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  const input = screen.getByDisplayValue('140');
  fireEvent.change(input, { target: { value: '120' } });
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  await waitFor(() => expect(onUpdateTerms).toHaveBeenCalledWith({ price: 120 }));
});

it('saves a price above the plan price rather than clamping it', async () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.change(screen.getByDisplayValue('140'), { target: { value: '220' } });
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  await waitFor(() => expect(onUpdateTerms).toHaveBeenCalledWith({ price: 220 }));
});

it('cancels edit without saving', () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onUpdateTerms).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
});

it('renders the salad toggle with an icon tile when the plan includes salad', () => {
  const subWithSalad: Subscription = { ...sub, plan: { ...sub.plan, meals: ['salad'] } };
  render(<ActivePlanCard sub={subWithSalad} onUpdateTerms={onUpdateTerms} />);
  const toggleLabel = screen.getByLabelText('Ensalada grande').closest('label')!;
  expect(toggleLabel.querySelector('svg')).toBeInTheDocument();
});

describe('cambio de plan', () => {
  // startDate is a Monday; 20 delivery days from it lands on Fri 28/08, 18 of them still ahead
  const running: Subscription = {
    ...sub,
    startDate: '2026-08-03',
    contractEndDate: '2026-08-28',
    duration: 20,
  };

  const openEdit = (s: Subscription = running) => {
    render(<ActivePlanCard sub={s} onUpdateTerms={onUpdateTerms} />);
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  };

  const planSelect = () => screen.getByLabelText('Plan');
  const durationInput = () => screen.getByLabelText('Duración');
  const priceInput = () => screen.getByLabelText(/precio/i);
  const cell = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-04T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('labels the section Plan y precio', () => {
    render(<ActivePlanCard sub={running} onUpdateTerms={onUpdateTerms} />);
    expect(screen.getByText('Plan y precio')).toBeInTheDocument();
  });

  it('lists every plan with the assigned one selected', () => {
    openEdit();
    expect(planSelect()).toHaveValue('1');
    expect(screen.getByRole('option', { name: 'Ligero' })).toBeInTheDocument();
  });

  it('preloads the duration from the subscription', () => {
    openEdit();
    expect(durationInput()).toHaveValue('20');
  });

  it('shows the stored end date and remaining days when the form opens', () => {
    openEdit();
    expect(screen.getByText(/vence el/i)).toHaveTextContent('Vence el 28/08/2026 · 18 días');
  });

  it('recalculates the end date and remaining days as the duration is typed', () => {
    openEdit();
    fireEvent.change(durationInput(), { target: { value: '12' } });
    expect(screen.getByText(/vence el/i)).toHaveTextContent('Vence el 18/08/2026 · 10 días');
  });

  it('adds a delivery day per suspended date to the projected end date', () => {
    openEdit({ ...running, suspendedDates: ['2026-08-10'] });
    fireEvent.change(durationInput(), { target: { value: '12' } });
    expect(screen.getByText(/vence el/i)).toHaveTextContent('Vence el 19/08/2026');
  });

  it('shows a dash instead of a stale date when the duration is emptied', () => {
    openEdit();
    fireEvent.change(durationInput(), { target: { value: '' } });
    expect(screen.queryByText(/vence el/i)).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('does not cap the price input at the plan price while the plan is untouched', () => {
    openEdit();
    expect(priceInput()).not.toHaveAttribute('max');
  });

  // a plan change moves no money in either direction, so the total the client pays is frozen
  it('freezes what the client pays when the plan changes', () => {
    openEdit();
    fireEvent.change(planSelect(), { target: { value: '2' } });

    expect(screen.queryByRole('spinbutton', { name: /precio/i })).not.toBeInTheDocument();
    expect(cell('Precio')).toBe('140');
    expect(cell('Total')).toBe('140');
  });

  it('absorbs an upgrade into the gap, leaving the total alone', () => {
    openEdit({ ...running, price: 150 });
    fireEvent.change(planSelect(), { target: { value: '3' } }); // Premium 300, client pays 150

    expect(cell('Descuento')).toBe('150'); // 300 − 150
    expect(cell('Total')).toBe('150');
  });

  // paying more than the new plan lists is a surcharge, not a discount — the label has to say so
  it('shows a surcharge when the new plan lists below what the client pays', () => {
    openEdit();
    fireEvent.change(planSelect(), { target: { value: '2' } }); // Ligero 100, client pays 140

    expect(cell('Recargo')).toBe('40'); // 140 − 100
    expect(screen.queryByText('Descuento')).not.toBeInTheDocument();
    expect(cell('Total')).toBe('140');
  });

  it('sends the frozen price so the client keeps paying what they paid', async () => {
    openEdit();
    fireEvent.change(planSelect(), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(onUpdateTerms).toHaveBeenCalledWith({ price: 140, planId: '2' }));
  });

  it('explains that a plan change moves no money, naming both plans', () => {
    openEdit();
    fireEvent.change(planSelect(), { target: { value: '2' } });
    expect(screen.getByText('Completo → Ligero')).toBeInTheDocument();
    expect(
      screen.getByText(/no genera cobro ni devolución; ajusta la duración/i),
    ).toBeInTheDocument();
  });

  it('hides the no-money note while the assigned plan is still selected', () => {
    openEdit();
    expect(screen.queryByText(/no genera cobro ni devolución/i)).not.toBeInTheDocument();
  });

  it('sends the plan and duration alongside the frozen price when both moved', async () => {
    openEdit();
    fireEvent.change(planSelect(), { target: { value: '2' } });
    fireEvent.change(durationInput(), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(onUpdateTerms).toHaveBeenCalledWith({ price: 140, planId: '2', duration: 12 }),
    );
  });

  // an untouched plan must not write a spurious terms_changed on the backend
  it('omits the plan and duration when only the price moved', async () => {
    openEdit();
    fireEvent.change(priceInput(), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(onUpdateTerms).toHaveBeenCalledWith({ price: 120 }));
  });

  it('restores plan, duration and price on cancel', () => {
    openEdit();
    fireEvent.change(planSelect(), { target: { value: '2' } });
    fireEvent.change(durationInput(), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(planSelect()).toHaveValue('1');
    expect(durationInput()).toHaveValue('20');
    expect(priceInput()).toHaveValue(140);
  });

  // a surcharge is as real as a discount — read mode has to show it, not a dash
  it('shows a stored surcharge in read mode', () => {
    render(<ActivePlanCard sub={{ ...running, price: 860 }} onUpdateTerms={onUpdateTerms} />);

    expect(cell('Recargo')).toBe('710');
    expect(screen.queryByText('Descuento')).not.toBeInTheDocument();
  });

  it('does not save while the duration is invalid', () => {
    openEdit();
    fireEvent.change(durationInput(), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onUpdateTerms).not.toHaveBeenCalled();
  });
});

it('right-aligns the cancelar/guardar buttons', () => {
  render(<ActivePlanCard sub={sub} onUpdateTerms={onUpdateTerms} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
  expect(cancelBtn.parentElement).toHaveClass('justify-end');
});
