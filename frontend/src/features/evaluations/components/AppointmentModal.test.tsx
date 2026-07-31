import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentModal } from '@/features/evaluations/components/AppointmentModal';
import { useClientSearch } from '@/features/evaluations/hooks/useClientSearch';
import type { Appointment } from '@/features/evaluations/types';

jest.mock('@/features/evaluations/hooks/useClientSearch');
jest.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: unknown) => v }));

const mockUseClientSearch = useClientSearch as jest.Mock;

const existingAppointment: Appointment = {
  id: '1',
  name: 'Ana Pérez',
  phone: '71234567',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
  clientId: null,
};

beforeEach(() => {
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 100,
    bottom: 50,
    top: 0,
    width: 100,
    height: 50,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  });
  mockUseClientSearch.mockReturnValue({ results: [], isSearching: false });
});

afterEach(() => jest.restoreAllMocks());

describe('AppointmentModal — create mode', () => {
  it('renders "Nueva cita" heading', () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Nueva cita')).toBeInTheDocument();
  });

  it('starts with empty name and phone fields', () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('');
    expect(screen.getByLabelText(/tel[eé]fono/i)).toHaveValue('');
  });

  it('calls onSave with the draft and then onClose when Crear cita is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<AppointmentModal mode="create" isSaving={false} onSave={onSave} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Ana Pérez');
    await userEvent.type(screen.getByLabelText(/tel[eé]fono/i), '71234567');
    await userEvent.type(screen.getByLabelText(/hora/i), '0900AM');
    await userEvent.click(screen.getByRole('button', { name: /crear cita/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana Pérez', phone: '71234567', time: '09:00' }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('reverts an invalid typed hora back to empty on blur', async () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    const horaInput = screen.getByLabelText(/hora/i);
    await userEvent.type(horaInput, 'zzzzzzzz');
    await userEvent.tab();
    expect(horaInput).toHaveValue('');
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const onClose = jest.fn();
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('defaults to Cliente nuevo with the toggle visible', () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Cliente nuevo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cliente existente' })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('switching to Cliente existente hides the free-text name/phone fields and shows a search input', async () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cliente existente' }));

    expect(screen.queryByLabelText(/^nombre/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por nombre o tel[eé]fono/i)).toBeInTheDocument();
  });

  it('shows search results returned by useClientSearch', async () => {
    mockUseClientSearch.mockReturnValue({
      results: [{ id: '5', name: 'Fernando Daleney', phoneNumber: '76637732' }],
      isSearching: false,
    });
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cliente existente' }));
    await userEvent.type(
      screen.getByPlaceholderText(/buscar por nombre o tel[eé]fono/i),
      'fernando',
    );

    expect(screen.getByText('Fernando Daleney')).toBeInTheDocument();
  });

  it('selecting a search result locks name/phone as read-only and submits with clientId', async () => {
    mockUseClientSearch.mockReturnValue({
      results: [{ id: '5', name: 'Fernando Daleney', phoneNumber: '76637732' }],
      isSearching: false,
    });
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<AppointmentModal mode="create" isSaving={false} onSave={onSave} onClose={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cliente existente' }));
    await userEvent.type(
      screen.getByPlaceholderText(/buscar por nombre o tel[eé]fono/i),
      'fernando',
    );
    await userEvent.click(screen.getByText('Fernando Daleney'));

    expect(screen.getByText('76637732')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/buscar por nombre o tel[eé]fono/i),
    ).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/hora/i), '0900AM');
    await userEvent.click(screen.getByRole('button', { name: /crear cita/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ clientId: '5', time: '09:00' }));
    expect(onSave).not.toHaveBeenCalledWith(expect.objectContaining({ name: expect.anything() }));
  });

  it('shows a non-blocking warning when the typed phone matches an existing client', async () => {
    mockUseClientSearch.mockReturnValue({
      results: [{ id: '9', name: 'Existing Person', phoneNumber: '76637732' }],
      isSearching: false,
    });
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );

    await userEvent.type(screen.getByLabelText(/tel[eé]fono/i), '76637732');

    expect(screen.getByText(/ya existe un cliente con este n[uú]mero/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cita/i })).not.toBeDisabled();
  });

  it('does not show the phone-match warning when there is no matching client', async () => {
    mockUseClientSearch.mockReturnValue({ results: [], isSearching: false });
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );

    await userEvent.type(screen.getByLabelText(/tel[eé]fono/i), '71234567');

    expect(screen.queryByText(/ya existe un cliente con este n[uú]mero/i)).not.toBeInTheDocument();
  });
});

describe('AppointmentModal — edit mode', () => {
  it('renders "Editar cita" heading, prefilled from the appointment prop', () => {
    render(
      <AppointmentModal
        mode="edit"
        appointment={existingAppointment}
        isSaving={false}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('Editar cita')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Ana Pérez');
    expect(screen.getByLabelText(/tel[eé]fono/i)).toHaveValue('71234567');
    expect(screen.getByLabelText(/hora/i)).toHaveValue('09:00 AM');
  });

  it('calls onSave with the updated draft and then onClose when Guardar cambios is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
      <AppointmentModal
        mode="edit"
        appointment={existingAppointment}
        isSaving={false}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana Pérez' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('locks name/phone as read-only when the appointment is linked to an existing client', () => {
    render(
      <AppointmentModal
        mode="edit"
        appointment={{ ...existingAppointment, clientId: '5' }}
        isSaving={false}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText(/^nombre/i)).not.toBeInTheDocument();
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('71234567')).toBeInTheDocument();
  });

  it('submits only date/time for an existing-client appointment, not name/phone', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <AppointmentModal
        mode="edit"
        appointment={{ ...existingAppointment, clientId: '5' }}
        isSaving={false}
        onSave={onSave}
        onClose={jest.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(onSave).toHaveBeenCalledWith({ date: '2026-08-03', time: '09:00' });
  });
});
