import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../services/api';
import { NewClientPage } from './NewClientPage';

jest.mock('../services/api', () => ({ default: { get: jest.fn(), post: jest.fn() } }));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

const makePlan = (overrides = {}) => ({
  id: 1,
  name: 'Completo',
  meals: [],
  price: 480,
  discount: 0,
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/clientes/nuevo']}>
      <Routes>
        <Route path="/clientes/nuevo" element={<NewClientPage />} />
        <Route path="/clientes" element={<div>Clientes list</div>} />
      </Routes>
    </MemoryRouter>,
  );

const fillStep1 = async () => {
  await userEvent.type(screen.getByLabelText(/nombre/i), 'María García');
  await userEvent.selectOptions(screen.getByLabelText(/sexo/i), 'female');
  fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
    target: { value: '1970-04-12' },
  });
  await userEvent.type(screen.getByLabelText(/teléfono/i), '+34 612 345 678');
  await userEvent.type(screen.getByLabelText(/dirección/i), 'Av. Centro 142');
  await userEvent.selectOptions(screen.getByLabelText(/zona/i), 'Centro');
  await userEvent.selectOptions(screen.getByLabelText(/delivery/i), 'La Oliva');
};

describe('NewClientPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: { data: [makePlan()] } });
    mockPost
      .mockResolvedValueOnce({ data: { data: { id: 1 } } })
      .mockResolvedValueOnce({ data: { data: {} } });
  });

  it('renders the Alta de cliente heading and Identidad form on load', () => {
    renderPage();
    expect(screen.getByText('Alta de cliente')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('shows validation error when advancing step 1 without filling name', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/nombre es requerido/i)).toBeInTheDocument();
  });

  it('advances to Restricciones after completing step 1', async () => {
    renderPage();
    await fillStep1();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByRole('heading', { name: 'Restricciones' })).toBeInTheDocument();
  });

  it('goes back to Identidad from Restricciones', async () => {
    renderPage();
    await fillStep1();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /atr/i }));
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('loads and shows plans on step 3', async () => {
    renderPage();
    await fillStep1();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/completo/i)).toBeInTheDocument());
  });

  it('creates client and subscription on confirm', async () => {
    renderPage();
    await fillStep1();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByLabelText(/plan/i)).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/plan/i), '1');
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));
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

  it('navigates to /clientes after successful submit', async () => {
    renderPage();
    await fillStep1();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByLabelText(/plan/i)).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/plan/i), '1');
    fireEvent.change(screen.getByLabelText(/fecha de inicio/i), {
      target: { value: '2026-06-01' },
    });
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    await waitFor(() => expect(screen.getByText('Clientes list')).toBeInTheDocument());
  });
});
