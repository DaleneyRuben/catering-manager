import sequelize from '../../../database/sequelize';
import { findMonthSummary } from '../find-month-summary';

jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockedQuery = sequelize.query as jest.Mock;

// pg returns DECIMAL as a string — the shape every one of these queries actually comes back in.
// COUNT comes back a string too, for the same reason: it is a bigint.
const stubQueries = ({
  income = '0',
  expenses = '0',
  incomeCount = '0',
  expenseCount = '0',
  byCategory = [] as unknown[],
} = {}) => {
  mockedQuery.mockImplementation((sql: string) => {
    if (sql.includes('FROM payments'))
      return Promise.resolve([{ total: income, count: incomeCount }]);
    if (sql.includes('GROUP BY')) return Promise.resolve(byCategory);
    return Promise.resolve([{ total: expenses, count: expenseCount }]);
  });
};

describe('findMonthSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the three totals as numbers', async () => {
    stubQueries({ income: '4050.00', expenses: '1200.50' });

    const result = await findMonthSummary('2026-08');

    expect(result.income).toBe(4050);
    expect(result.expenses).toBe(1200.5);
  });

  it('reports the balance as income minus expenses', async () => {
    stubQueries({ income: '4050.00', expenses: '1200.50' });

    const result = await findMonthSummary('2026-08');

    expect(result.balance).toBe(2849.5);
  });

  it('reports a negative balance when the month spent more than it took in', async () => {
    stubQueries({ income: '500.00', expenses: '1200.00' });

    const result = await findMonthSummary('2026-08');

    expect(result.balance).toBe(-700);
  });

  it('returns zeroes for a month with no movements', async () => {
    stubQueries();

    const result = await findMonthSummary('2026-08');

    expect(result).toEqual({
      income: 0,
      expenses: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0,
      byCategory: [],
    });
  });

  // The tiles caption how many payments and how many gastos the month holds. That is the month's
  // truth and must not move when the list below is filtered, so it is counted here — beside the
  // totals it belongs to — rather than by measuring the filtered rows the list happens to show.
  it('counts the movements on each side of the month', async () => {
    stubQueries({ incomeCount: '17', expenseCount: '4' });

    const result = await findMonthSummary('2026-08');

    expect(result.incomeCount).toBe(17);
    expect(result.expenseCount).toBe(4);
  });

  it('counts in sql alongside each total', async () => {
    stubQueries();

    await findMonthSummary('2026-08');

    const counted = mockedQuery.mock.calls
      .map(([sql]: [string]) => sql)
      .filter((sql: string) => sql.includes('COUNT(*)'));

    expect(counted).toHaveLength(2);
  });

  it('returns the per-category breakdown with numeric totals', async () => {
    stubQueries({
      byCategory: [
        { categoryId: 1, categoryName: 'Insumos', total: '800.00', active: true },
        { categoryId: 2, categoryName: 'Transporte', total: '400.50', active: true },
      ],
    });

    const result = await findMonthSummary('2026-08');

    expect(result.byCategory).toEqual([
      { categoryId: 1, categoryName: 'Insumos', total: 800, active: true },
      { categoryId: 2, categoryName: 'Transporte', total: 400.5, active: true },
    ]);
  });

  // A category archived after the month closed still owns that month's spending, so the breakdown
  // keeps the line and flags it rather than dropping money out of the chart.
  it('reports a category archived since the month was spent', async () => {
    stubQueries({
      byCategory: [{ categoryId: 5, categoryName: 'Eventos', total: '300.00', active: false }],
    });

    const result = await findMonthSummary('2026-08');

    expect(result.byCategory).toEqual([
      { categoryId: 5, categoryName: 'Eventos', total: 300, active: false },
    ]);
  });

  it('groups by the category active flag so it can be selected', async () => {
    stubQueries();

    await findMonthSummary('2026-08');

    const grouped = mockedQuery.mock.calls
      .map(([sql]: [string]) => sql)
      .find((sql: string) => sql.includes('GROUP BY'));

    expect(grouped).toContain('c.active');
    expect(grouped).toContain('GROUP BY c.id, c.name, c.active');
  });

  it('bounds every query by the first and last day of the month', async () => {
    stubQueries();

    await findMonthSummary('2026-08');

    mockedQuery.mock.calls.forEach(([, options]) => {
      expect(options.replacements).toEqual({ start: '2026-08-01', end: '2026-08-31' });
    });
  });

  it('bounds february correctly on a leap year', async () => {
    stubQueries();

    await findMonthSummary('2028-02');

    expect(mockedQuery.mock.calls[0][1].replacements).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    });
  });

  it('sums in sql rather than reducing rows in javascript', async () => {
    stubQueries();

    await findMonthSummary('2026-08');

    const sums = mockedQuery.mock.calls.filter(([sql]: [string]) => sql.includes('SUM('));
    expect(sums).toHaveLength(3);
  });

  it('excludes soft-deleted expenses from both expense queries', async () => {
    stubQueries();

    await findMonthSummary('2026-08');

    const expenseQueries = mockedQuery.mock.calls
      .map(([sql]: [string]) => sql)
      .filter((sql: string) => sql.includes('FROM expenses'));

    expect(expenseQueries).toHaveLength(2);
    expenseQueries.forEach((sql: string) => expect(sql).toContain('"deletedAt" IS NULL'));
  });
});
