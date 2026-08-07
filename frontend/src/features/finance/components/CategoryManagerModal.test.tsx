import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { CategoryManagerModal } from '@/features/finance/components/CategoryManagerModal';
import { useCategoryCatalog, useCategoryMutations } from '@/features/finance/hooks/useCategories';
import type { CategoryTotal, ExpenseCategoryWithUsage } from '@/features/finance/types';

jest.mock('@/features/finance/hooks/useCategories');
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));

const mockCatalog = useCategoryCatalog as jest.MockedFunction<typeof useCategoryCatalog>;
const mockMutations = useCategoryMutations as jest.MockedFunction<typeof useCategoryMutations>;
const mockToast = toast as unknown as { success: jest.Mock };

const category = (over: Partial<ExpenseCategoryWithUsage>): ExpenseCategoryWithUsage => ({
  id: 'AB12CD',
  name: 'Insumos',
  active: true,
  usageThisMonth: 5,
  usageAllTime: 41,
  ...over,
});

const catalog = [
  category({ id: 'AB12CD', name: 'Insumos' }),
  category({ id: 'EF34GH', name: 'Transporte', usageThisMonth: 23, usageAllTime: 120 }),
  category({ id: 'IJ56KL', name: 'Eventos', active: false, usageThisMonth: 0, usageAllTime: 3 }),
];

const byCategory: CategoryTotal[] = [
  { categoryId: 'AB12CD', categoryName: 'Insumos', total: 7300, active: true },
  { categoryId: 'EF34GH', categoryName: 'Transporte', total: 4140, active: true },
];

const create = jest.fn().mockResolvedValue({ id: 'MN78OP', name: 'Mantenimiento', active: true });
const rename = jest.fn().mockResolvedValue(undefined);
const archive = jest.fn().mockResolvedValue(undefined);
const restore = jest.fn().mockResolvedValue(undefined);
const onClose = jest.fn();

const setup = (categories = catalog) => {
  mockCatalog.mockReturnValue({ categories, isLoading: false });
  return render(<CategoryManagerModal month="2026-07" byCategory={byCategory} onClose={onClose} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockMutations.mockReturnValue({ create, rename, archive, restore, isSaving: false });
});

describe('CategoryManagerModal', () => {
  // Both consequences are stated before anything is clicked, because both are the questions
  // someone opening this modal is about to ask.
  it('states what renaming and archiving each do', () => {
    setup();

    expect(
      screen.getByText(/Renombrar corrige el nombre en todo el historial/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Archivar la saca del formulario sin tocar los gastos ya registrados/),
    ).toBeInTheDocument();
  });

  it('reads the catalog for the month on screen', () => {
    setup();

    expect(mockCatalog).toHaveBeenCalledWith('2026-07');
  });

  it('splits the catalog into active and archived, each counted', () => {
    setup();

    expect(screen.getByText('Activas · 2')).toBeInTheDocument();
    expect(screen.getByText('Archivadas · 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archivar Insumos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar Eventos' })).toBeInTheDocument();
  });

  // With nothing archived the section is noise: there is nothing to restore.
  it('omits the archived section when nothing is archived', () => {
    setup(catalog.filter((c) => c.active));

    expect(screen.queryByText(/Archivadas/)).not.toBeInTheDocument();
  });

  it('adds a category by name and clears the field', async () => {
    setup();

    await userEvent.type(screen.getByLabelText('Nueva categoría'), 'Mantenimiento');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(create).toHaveBeenCalledWith('Mantenimiento');
    expect(mockToast.success).toHaveBeenCalledWith('Categoría «Mantenimiento» creada');
    expect(screen.getByLabelText('Nueva categoría')).toHaveValue('');
  });

  it('refuses to add an empty name', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
  });

  // A duplicate name folds onto the category that already answers to it rather than erroring, and
  // a fold onto an archived one restores it — so the message has to say what actually happened.
  it('reports a fold onto an archived category as a restore', async () => {
    create.mockResolvedValueOnce({ id: 'IJ56KL', name: 'Eventos', active: true });
    setup();

    await userEvent.type(screen.getByLabelText('Nueva categoría'), 'eventos');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(mockToast.success).toHaveBeenCalledWith('Categoría «Eventos» restaurada');
  });

  it('reports a fold onto an active category as already existing', async () => {
    create.mockResolvedValueOnce({ id: 'AB12CD', name: 'Insumos', active: true });
    setup();

    await userEvent.type(screen.getByLabelText('Nueva categoría'), 'insumos');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(mockToast.success).toHaveBeenCalledWith('Ya existe la categoría «Insumos»');
  });

  it('renames a category and says the historial moved with it', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));
    await userEvent.type(screen.getByLabelText('Nuevo nombre'), ' secos{Enter}');

    expect(rename).toHaveBeenCalledWith('AB12CD', 'Insumos secos');
    expect(mockToast.success).toHaveBeenCalledWith('Nombre actualizado en todo el historial');
  });

  it('restores an archived category', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Restaurar Eventos' }));

    expect(restore).toHaveBeenCalledWith('IJ56KL');
    expect(mockToast.success).toHaveBeenCalledWith('Categoría restaurada');
  });

  it('closes on Listo', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Listo' }));

    expect(onClose).toHaveBeenCalled();
  });

  describe('archiving', () => {
    // Archiving never destroys anything, so the dialog states the arithmetic that stays put
    // instead of warning vaguely — and the word is never "Eliminar".
    it('states the month the category keeps counting toward', async () => {
      setup();

      await userEvent.click(screen.getByRole('button', { name: 'Archivar Transporte' }));

      expect(screen.getByText('Archivar Transporte')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Los 23 gastos de julio 2026 en Transporte no cambian: siguen sumando Bs 4.140 a los egresos del mes y siguen apareciendo en el desglose y en el historial.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Deja de aparecer al registrar un gasto nuevo. Puedes restaurarla cuando quieras.',
        ),
      ).toBeInTheDocument();
    });

    it('reads a single expense in the singular', async () => {
      setup([category({ id: 'EF34GH', name: 'Transporte', usageThisMonth: 1 })]);

      await userEvent.click(screen.getByRole('button', { name: 'Archivar Transporte' }));

      expect(
        screen.getByText(
          'El gasto de julio 2026 en Transporte no cambia: sigue sumando Bs 4.140 a los egresos del mes y sigue apareciendo en el desglose y en el historial.',
        ),
      ).toBeInTheDocument();
    });

    it('says so plainly when nothing was spent on it this month', async () => {
      setup([category({ id: 'AB12CD', name: 'Insumos', usageThisMonth: 0, usageAllTime: 9 })]);

      await userEvent.click(screen.getByRole('button', { name: 'Archivar Insumos' }));

      expect(
        screen.getByText(
          'No hay gastos de julio 2026 en Insumos. Los del historial, si los hay, no cambian.',
        ),
      ).toBeInTheDocument();
    });

    it('archives only once confirmed', async () => {
      setup();

      await userEvent.click(screen.getByRole('button', { name: 'Archivar Transporte' }));
      expect(archive).not.toHaveBeenCalled();

      // A bare "Archivar" is the confirm's primary; the row's own button names its category.
      await userEvent.click(screen.getByRole('button', { name: 'Archivar' }));

      expect(archive).toHaveBeenCalledWith('EF34GH');
      expect(mockToast.success).toHaveBeenCalledWith('Categoría archivada');
    });

    it('leaves the category alone when the confirm is cancelled', async () => {
      setup();

      await userEvent.click(screen.getByRole('button', { name: 'Archivar Transporte' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(archive).not.toHaveBeenCalled();
      expect(screen.queryByText('Archivar Transporte')).not.toBeInTheDocument();
    });

    // The list is what the modal is for; the confirm sits on top of it rather than replacing it.
    it('keeps the modal open behind the confirm', async () => {
      setup();

      await userEvent.click(screen.getByRole('button', { name: 'Archivar Transporte' }));

      expect(screen.getByText('Categorías de gasto')).toBeInTheDocument();
    });
  });
});
