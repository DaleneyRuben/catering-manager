import sequelize from '../../../database/sequelize';
import { findEarliestMonth } from '../find-earliest-month';

jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockedQuery = sequelize.query as jest.Mock;

describe('findEarliestMonth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the month of the oldest movement in either direction', async () => {
    mockedQuery.mockResolvedValue([{ earliest: '2026-08-01' }]);

    expect(await findEarliestMonth()).toBe('2026-08');
  });

  // The register has no history before go-live and no backfill, so an empty one has no bound to
  // page back to — the caller falls back to the current month rather than offering empty months.
  it('returns null when the register is empty', async () => {
    mockedQuery.mockResolvedValue([{ earliest: null }]);

    expect(await findEarliestMonth()).toBeNull();
  });

  it('considers payments and expenses together', async () => {
    mockedQuery.mockResolvedValue([{ earliest: '2026-08-01' }]);

    await findEarliestMonth();

    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).toContain('FROM payments');
    expect(sql).toContain('FROM expenses');
  });

  it('ignores soft-deleted expenses', async () => {
    mockedQuery.mockResolvedValue([{ earliest: null }]);

    await findEarliestMonth();

    expect(mockedQuery.mock.calls[0][0]).toContain('"deletedAt" IS NULL');
  });
});
