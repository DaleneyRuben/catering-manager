import sequelize from '../../../database/sequelize';
import { findMovementsSubtotal } from '../find-movements-subtotal';

jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockedQuery = sequelize.query as jest.Mock;

describe('findMovementsSubtotal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedQuery.mockResolvedValue([{ count: '0', subtotal: '0' }]);
  });

  it('returns the count and signed subtotal of the filtered set', async () => {
    mockedQuery.mockResolvedValue([{ count: '18', subtotal: '-4140.00' }]);

    expect(await findMovementsSubtotal('2026-08')).toEqual({ count: 18, subtotal: -4140 });
  });

  it('returns zeroes for a set with no rows', async () => {
    expect(await findMovementsSubtotal('2026-08')).toEqual({ count: 0, subtotal: 0 });
  });

  // pg returns DECIMAL as a string; adding a few hundred of them in JS drifts (ADR-008). The
  // subtotal is a filtered SUM for exactly the same reason the tiles are.
  it('sums in SQL rather than reducing rows in JS', async () => {
    await findMovementsSubtotal('2026-08');

    expect(mockedQuery.mock.calls[0][0]).toContain('SUM(');
  });

  it('signs income positive and expenses negative, so no filter equals the month balance', async () => {
    await findMovementsSubtotal('2026-08');

    const sql = mockedQuery.mock.calls[0][0];
    expect(sql).toContain('p.amount');
    expect(sql).toContain('-e.amount');
  });

  it('counts only expenses when the direction is expense', async () => {
    await findMovementsSubtotal('2026-08', { direction: 'expense' });

    const sql = mockedQuery.mock.calls[0][0];
    expect(sql).toContain('FROM expenses');
    expect(sql).not.toContain('FROM payments');
  });

  // Mirrors findMovements: the contradictory pair has an empty answer, not a query with no halves.
  it('returns zeroes without querying when a category is asked of income', async () => {
    const result = await findMovementsSubtotal('2026-08', { direction: 'income', categoryId: 4 });

    expect(result).toEqual({ count: 0, subtotal: 0 });
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('counts only payments when the direction is income', async () => {
    await findMovementsSubtotal('2026-08', { direction: 'income' });

    const sql = mockedQuery.mock.calls[0][0];
    expect(sql).toContain('FROM payments');
    expect(sql).not.toContain('FROM expenses');
  });
});
