import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../../models/ExpenseCategory';
import { deactivateCategory } from '../deactivate-category';

jest.mock('../../../models/ExpenseCategory');

const mockedFindByPk = ExpenseCategory.findByPk as jest.Mock;

describe('deactivateCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks the category inactive rather than destroying it', async () => {
    const update = jest.fn().mockResolvedValue({});
    const destroy = jest.fn();
    mockedFindByPk.mockResolvedValue({ update, destroy });

    await deactivateCategory(3);

    expect(update).toHaveBeenCalledWith({ active: false }, expect.anything());
    expect(destroy).not.toHaveBeenCalled();
  });

  it('returns the deactivated category', async () => {
    const deactivated = { id: 3, active: false };
    mockedFindByPk.mockResolvedValue({ update: jest.fn().mockResolvedValue(deactivated) });

    const result = await deactivateCategory(3);

    expect(result).toEqual(deactivated);
  });

  it('returns null when the category does not exist', async () => {
    mockedFindByPk.mockResolvedValue(null);

    const result = await deactivateCategory(99);

    expect(result).toBeNull();
  });

  it('joins the caller transaction when one is given', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindByPk.mockResolvedValue({ update });
    const transaction = {} as Transaction;

    await deactivateCategory(3, transaction);

    expect(mockedFindByPk).toHaveBeenCalledWith(3, { transaction });
    expect(update).toHaveBeenCalledWith({ active: false }, { transaction });
  });
});
