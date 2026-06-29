import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserModal } from '@/features/users/components/UserModal';
import type { AppUser } from '@/features/users/hooks/useUsers';

const existingUser: AppUser = { id: '1', username: 'daleney', role: 'kitchen' };

const createProps = {
  mode: 'create' as const,
  isSaving: false,
  onSave: jest.fn().mockResolvedValue(undefined),
  onClose: jest.fn(),
};

const editProps = {
  mode: 'edit' as const,
  user: existingUser,
  isSaving: false,
  onSave: jest.fn().mockResolvedValue(undefined),
  onDelete: jest.fn().mockResolvedValue(undefined),
  onClose: jest.fn(),
};

describe('UserModal — create mode', () => {
  it('renders "Nuevo usuario" heading', () => {
    render(<UserModal {...createProps} />);
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument();
  });

  it('disables Crear button when fields are empty', () => {
    render(<UserModal {...createProps} />);
    expect(screen.getByRole('button', { name: /crear/i })).toBeDisabled();
  });

  it('calls onSave with the draft when Crear is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<UserModal mode="create" isSaving={false} onSave={onSave} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/^usuario/i, { selector: 'input' }), 'nuevo');
    await userEvent.type(screen.getByLabelText(/^contraseña/i, { selector: 'input' }), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));

    expect(onSave).toHaveBeenCalledWith({
      username: 'nuevo',
      password: 'pass123',
      role: 'admin',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('UserModal — edit mode', () => {
  it('renders "Editar usuario" heading', () => {
    render(<UserModal {...editProps} />);
    expect(screen.getByText('Editar usuario')).toBeInTheDocument();
  });

  it('prefills the username field from the user prop', () => {
    render(<UserModal {...editProps} />);
    expect(screen.getByLabelText(/^usuario/i, { selector: 'input' })).toHaveValue('daleney');
  });

  it('shows Eliminar button initially', () => {
    render(<UserModal {...editProps} />);
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('hides Eliminar when isSelf is true', () => {
    render(<UserModal {...editProps} isSelf />);
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('shows a confirmation dialog after clicking Eliminar', async () => {
    render(<UserModal {...editProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText('Eliminar usuario')).toBeInTheDocument();
    expect(screen.getByText(/no se puede deshacer/i)).toBeInTheDocument();
  });

  it('returns to the edit form when the confirmation dialog is cancelled', async () => {
    render(<UserModal {...editProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByText('Editar usuario')).toBeInTheDocument();
  });

  it('calls onSave with updated draft when Guardar is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
      <UserModal
        mode="edit"
        user={existingUser}
        isSaving={false}
        onSave={onSave}
        onDelete={jest.fn()}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ username: 'daleney' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('includes password in draft when password field is filled', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <UserModal
        mode="edit"
        user={existingUser}
        isSaving={false}
        onSave={onSave}
        onDelete={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'newpass');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ password: 'newpass' }));
  });

  it('calls onDelete and onClose when the deletion is confirmed', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
      <UserModal
        mode="edit"
        user={existingUser}
        isSaving={false}
        onSave={jest.fn()}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
