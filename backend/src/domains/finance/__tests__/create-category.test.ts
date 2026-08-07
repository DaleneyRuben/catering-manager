import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../../models/ExpenseCategory';
import { createCategory } from '../create-category';

jest.mock('../../../models/ExpenseCategory');

const mockedCreate = ExpenseCategory.create as jest.Mock;
const mockedFindOne = ExpenseCategory.findOne as jest.Mock;

describe('createCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindOne.mockResolvedValue(null);
    mockedCreate.mockResolvedValue({ id: 9, name: 'Mantenimiento', active: true });
  });

  it('creates the category active when the name is new', async () => {
    const result = await createCategory('Mantenimiento');

    expect(mockedCreate).toHaveBeenCalledWith(
      { name: 'Mantenimiento', active: true },
      expect.anything(),
    );
    expect(result).toEqual({
      category: { id: 9, name: 'Mantenimiento', active: true },
      created: true,
    });
  });

  // "+ Nueva" is a one-field form with no catalog in front of it, so typing a name that already
  // exists is a routine mistake rather than an error worth a dialog. It resolves to the category
  // the user meant instead of growing a second row with the same label.
  it('folds onto an existing category instead of creating a duplicate', async () => {
    const existing = { id: 3, name: 'Insumos', active: true, update: jest.fn() };
    mockedFindOne.mockResolvedValue(existing);

    const result = await createCategory('insumos');

    expect(mockedCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ category: existing, created: false });
  });

  it('matches an existing name whatever its accents and case', async () => {
    await createCategory('LOGISTICA');

    expect(mockedFindOne).toHaveBeenCalled();
    expect(JSON.stringify(mockedFindOne.mock.calls[0][0])).toContain('logistica');
  });

  // Folding onto an archived category has to restore it: the user asked for a category by that
  // name and expects to file against it, and answering with an archived row it cannot use would
  // read as the button doing nothing.
  it('restores the category when the name folds onto an archived one', async () => {
    const update = jest.fn().mockResolvedValue({ id: 3, name: 'Eventos', active: true });
    mockedFindOne.mockResolvedValue({ id: 3, name: 'Eventos', active: false, update });

    const result = await createCategory('Eventos');

    expect(update).toHaveBeenCalledWith({ active: true }, expect.anything());
    expect(result.created).toBe(false);
  });

  it('leaves an already active category untouched when folding', async () => {
    const update = jest.fn();
    mockedFindOne.mockResolvedValue({ id: 3, name: 'Insumos', active: true, update });

    await createCategory('Insumos');

    expect(update).not.toHaveBeenCalled();
  });

  it('joins the caller transaction when one is given', async () => {
    const transaction = {} as Transaction;

    await createCategory('Mantenimiento', transaction);

    expect(mockedFindOne).toHaveBeenCalledWith(expect.objectContaining({ transaction }));
    expect(mockedCreate).toHaveBeenCalledWith(expect.any(Object), { transaction });
  });
});
