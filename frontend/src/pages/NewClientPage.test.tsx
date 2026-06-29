import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '@/services/api';
import { NewClientPage } from '@/pages/NewClientPage';

jest.mock('@/services/api', () => ({ default: { get: jest.fn(), post: jest.fn() } }));
jest.mock('@/components/ui/DatePickerInput', () => ({
  DatePickerInput: ({
    id,
    value,
    onChange,
  }: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
  }) => <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />,
}));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

const makePlan = (overrides = {}) => ({
  id: 1,
  name: 'Completo',
  meals: ['breakfast', 'lunch'],
  price: 480,
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clientes/nuevo']}>
        <Routes>
          <Route path="/clientes/nuevo" element={<NewClientPage />} />
          <Route path="/clientes" element={<div>Clientes list</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const fillStep1 = async () => {
  await userEvent.type(screen.getByLabelText(/nombre/i), 'María García');
  await userEvent.selectOptions(screen.getByLabelText(/sexo/i), 'female');
  fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
    target: { value: '1970-04-12' },
  });
  await userEvent.type(screen.getByLabelText(/celular/i), '+34 612 345 678');
  await userEvent.type(screen.getByLabelText(/dirección/i), 'Av. Centro 142');
  await userEvent.click(screen.getByRole('button', { name: 'Centro' }));
  await userEvent.click(screen.getByRole('button', { name: 'La Oliva' }));
};

const navigateToStep2 = async () => {
  renderPage();
  await fillStep1();
  await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
};

const navigateToStep3 = async () => {
  renderPage();
  await fillStep1();
  await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /completo/i })).toBeInTheDocument(),
  );
};

describe('NewClientPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue([makePlan()]);
    mockPost.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({});
  });

  it('renders the Agregar cliente heading and Identidad form on load', () => {
    renderPage();
    expect(screen.getByText('Agregar cliente')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('shows validation error when advancing step 1 without filling name', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/nombre es requerido/i)).toBeInTheDocument();
  });

  it('shows a Cancelar link back to /clientes on step 1', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(await screen.findByText('Clientes list')).toBeInTheDocument();
  });

  it('shows the current step indicator', () => {
    renderPage();
    expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
  });

  it('advances to Restricciones after completing step 1', async () => {
    renderPage();
    await fillStep1();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByRole('heading', { name: /alergias/i })).toBeInTheDocument();
  });

  it('goes back to Identidad from Restricciones', async () => {
    renderPage();
    await fillStep1();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /atr/i }));
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('shows predefined disease chips on step 2', async () => {
    await navigateToStep2();
    expect(screen.getByRole('button', { name: 'Diabetes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hipertensión' })).toBeInTheDocument();
  });

  it('toggles a disease chip on click', async () => {
    await navigateToStep2();
    const btn = screen.getByRole('button', { name: 'Diabetes' });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('selected diseases are submitted in underlyingDiseases', async () => {
    await navigateToStep2();
    await userEvent.click(screen.getByRole('button', { name: 'Diabetes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Anemia' }));
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      '/clients',
      expect.objectContaining({ underlyingDiseases: ['Diabetes', 'Anemia'] }),
    );
  });

  it('loads and shows plan cards on step 3', async () => {
    await navigateToStep3();
    expect(screen.getByRole('button', { name: /completo/i })).toBeInTheDocument();
  });

  it('shows precio and billing fields on step 3', async () => {
    await navigateToStep3();
    expect(screen.getByLabelText(/precio final/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de inicio/i)).toBeInTheDocument();
  });

  it('shows calculated total when precio is entered', async () => {
    await navigateToStep3();
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    // plan price 480, precio 430 → descuento 50, total 430
    fireEvent.change(screen.getByLabelText(/precio final/i), { target: { value: '430' } });
    expect(screen.getByText('430')).toBeInTheDocument();
  });

  it('creates client and subscription on confirm', async () => {
    await navigateToStep3();
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      '/clients',
      expect.objectContaining({ name: 'María García', sex: 'female' }),
    );
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      '/clients/1/subscriptions',
      expect.objectContaining({ planId: 1, startDate: '2026-06-01' }),
    );
  });

  it('subscription POST defaults discount to 0', async () => {
    await navigateToStep3();
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      '/clients/1/subscriptions',
      expect.objectContaining({ discount: 0 }),
    );
  });

  it('subscription POST sends calculated discount when precio is entered', async () => {
    await navigateToStep3();
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    // plan price 480, precio 380 → discount = 100
    fireEvent.change(screen.getByLabelText(/precio final/i), { target: { value: '380' } });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      '/clients/1/subscriptions',
      expect.objectContaining({ discount: 100 }),
    );
  });

  it('subscription POST does not include contractEndDate', async () => {
    await navigateToStep3();
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
    expect(mockPost.mock.calls[1][1]).not.toHaveProperty('contractEndDate');
  });

  it('disables guardar button while submitting', async () => {
    mockPost.mockReset();
    let resolve!: () => void;
    mockPost.mockResolvedValueOnce({ id: 1 }).mockImplementationOnce(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );
    await navigateToStep3();
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /crear/i })).toBeDisabled());
    resolve();
  });

  it('navigates to /clientes after successful submit', async () => {
    await navigateToStep3();
    await userEvent.click(screen.getByRole('button', { name: /completo/i }));
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => expect(screen.getByText('Clientes list')).toBeInTheDocument());
  });
});
