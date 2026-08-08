import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { CategoryChips } from '@/features/finance/components/CategoryChips';
import { useCategoryMutations } from '@/features/finance/hooks/useCategories';
import type { ExpenseCategory } from '@/features/finance/types';

jest.mock('@/features/finance/hooks/useCategories');
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));

const mockMutations = useCategoryMutations as jest.MockedFunction<typeof useCategoryMutations>;
const mockToast = toast as unknown as { success: jest.Mock };

// The server already ranks the catalog by use this month, so this order is not alphabetical on
// purpose (backlog 3.24).
const categories: ExpenseCategory[] = [
  { id: 'CAT2', name: 'Transporte', active: true },
  { id: 'CAT1', name: 'Insumos', active: true },
  { id: 'CAT3', name: 'Alquiler', active: true },
  { id: 'CAT9', name: 'Eventos', active: false },
];

const create = jest.fn().mockResolvedValue({ id: 'CAT5', name: 'Mantenimiento', active: true });

const setup = (props: Partial<React.ComponentProps<typeof CategoryChips>> = {}) => {
  const onPick = jest.fn();
  const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault());
  render(
    // The chips live inside the expense form, which is what makes Enter inside the new-category
    // field a trap worth pinning.
    <form onSubmit={onSubmit}>
      <CategoryChips categories={categories} selectedId="CAT1" onPick={onPick} {...props} />
    </form>,
  );
  return { onPick, onSubmit };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockMutations.mockReturnValue({
    create,
    rename: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    isSaving: false,
  });
});

const chipNames = () =>
  within(screen.getByRole('group', { name: 'Categoría' }))
    .getAllByRole('button')
    .map((chip) => chip.textContent);

describe('CategoryChips', () => {
  it('labels the group so the chips read as one choice', () => {
    setup();

    expect(screen.getByRole('group', { name: 'Categoría' })).toBeInTheDocument();
  });

  // Whole list visible, one click — the whole point of dropping the select.
  it('renders a chip per active category in the order given', () => {
    setup();

    expect(chipNames()).toEqual(['Transporte', 'Insumos', 'Alquiler', 'Nueva']);
  });

  it('marks the selected chip', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Insumos' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Transporte' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reports the category a chip picks', async () => {
    const { onPick } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Transporte' }));

    expect(onPick).toHaveBeenCalledWith('CAT2');
  });

  it('leaves archived categories out', () => {
    setup();

    expect(screen.queryByRole('button', { name: 'Eventos' })).not.toBeInTheDocument();
  });

  // Editing an expense filed against a since-archived category must still show what it was filed
  // against, or the form would look like nothing was chosen.
  it('keeps an archived category on screen when it is the one selected', () => {
    setup({ selectedId: 'CAT9' });

    expect(screen.getByRole('button', { name: 'Eventos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('picking a chip does not submit the form around it', async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Transporte' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('adding a category without leaving the form', () => {
    const startAdding = () => userEvent.click(screen.getByRole('button', { name: 'Nueva' }));

    it('asks for a name only once Nueva is clicked', async () => {
      setup();
      expect(screen.queryByLabelText('Nombre de la nueva categoría')).not.toBeInTheDocument();

      await startAdding();

      expect(screen.getByLabelText('Nombre de la nueva categoría')).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Nueva' })).not.toBeInTheDocument();
    });

    it('refuses a blank name', async () => {
      setup();

      await startAdding();
      await userEvent.type(screen.getByLabelText('Nombre de la nueva categoría'), '   ');

      expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
      expect(create).not.toHaveBeenCalled();
    });

    it('creates the category and selects it', async () => {
      const { onPick } = setup();

      await startAdding();
      await userEvent.type(
        screen.getByLabelText('Nombre de la nueva categoría'),
        '  Mantenimiento  ',
      );
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      expect(create).toHaveBeenCalledWith('Mantenimiento');
      expect(onPick).toHaveBeenCalledWith('CAT5');
      expect(mockToast.success).toHaveBeenCalledWith('Categoría «Mantenimiento» creada');
      expect(screen.queryByLabelText('Nombre de la nueva categoría')).not.toBeInTheDocument();
    });

    // The field sits inside the expense form: Enter has to add the category, not file the expense.
    it('creates on Enter without submitting the expense', async () => {
      const { onSubmit } = setup();

      await startAdding();
      await userEvent.type(
        screen.getByLabelText('Nombre de la nueva categoría'),
        'Mantenimiento{Enter}',
      );

      expect(create).toHaveBeenCalledWith('Mantenimiento');
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('says so when the name folds onto a category that already exists', async () => {
      create.mockResolvedValueOnce({ id: 'CAT1', name: 'Insumos', active: true });
      const { onPick } = setup();

      await startAdding();
      await userEvent.type(screen.getByLabelText('Nombre de la nueva categoría'), 'insumos{Enter}');

      expect(mockToast.success).toHaveBeenCalledWith('Ya existe la categoría «Insumos»');
      expect(onPick).toHaveBeenCalledWith('CAT1');
    });

    it('reports a fold onto an archived category as a restore', async () => {
      create.mockResolvedValueOnce({ id: 'CAT9', name: 'Eventos', active: true });
      setup();

      await startAdding();
      await userEvent.type(screen.getByLabelText('Nombre de la nueva categoría'), 'eventos{Enter}');

      expect(mockToast.success).toHaveBeenCalledWith('Categoría «Eventos» restaurada');
    });

    it('backs out on Cancelar', async () => {
      setup();

      await startAdding();
      await userEvent.type(screen.getByLabelText('Nombre de la nueva categoría'), 'Mantenimiento');
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(create).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Nueva' })).toBeInTheDocument();
    });

    // Escape belongs to the field while it is open; the modal around it stays put.
    it('backs out on Escape without reaching the modal', async () => {
      // The modal closes itself on any Escape reaching `document`, so what matters is that this one
      // never gets there.
      const keys: string[] = [];
      const listener = (event: KeyboardEvent) => keys.push(event.key);
      document.addEventListener('keydown', listener);
      setup();

      await startAdding();
      await userEvent.type(screen.getByLabelText('Nombre de la nueva categoría'), 'Man{Escape}');

      expect(screen.getByRole('button', { name: 'Nueva' })).toBeInTheDocument();
      expect(keys).not.toContain('Escape');
      document.removeEventListener('keydown', listener);
    });

    it('forgets an abandoned draft', async () => {
      setup();

      await startAdding();
      await userEvent.type(screen.getByLabelText('Nombre de la nueva categoría'), 'Mantenimiento');
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      await startAdding();

      expect(screen.getByLabelText('Nombre de la nueva categoría')).toHaveValue('');
    });
  });
});
