import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MenuFormModal } from './MenuFormModal';

const noop = () => Promise.resolve();

const baseProps = {
  open: true,
  onClose: jest.fn(),
  date: '2026-06-16',
  dateLabel: 'Lunes 16 de junio',
  initial: null,
  onSave: noop,
  isSaving: false,
};

describe('MenuFormModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the date label as modal title', () => {
    render(<MenuFormModal {...baseProps} />);
    expect(screen.getByText('Lunes 16 de junio')).toBeInTheDocument();
  });

  it('renders all meal fields', () => {
    render(<MenuFormModal {...baseProps} />);
    expect(screen.getByLabelText(/desayuno/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/almuerzo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cena/i)).toBeInTheDocument();
  });

  it('pre-fills fields when initial data is provided', () => {
    render(
      <MenuFormModal
        {...baseProps}
        initial={{
          date: '2026-06-16',
          breakfast: 'Avena',
          morningSnack: null,
          salad: null,
          lunch: 'Pollo',
          afternoonSnack: null,
          dinner: null,
          juice: null,
        }}
      />,
    );
    expect(screen.getByDisplayValue('Avena')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pollo')).toBeInTheDocument();
  });

  it('shows a Guardar button', () => {
    render(<MenuFormModal {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('calls onSave and onClose when save button is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<MenuFormModal {...baseProps} onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = jest.fn();
    render(<MenuFormModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
