import sequelize from '../../../database/sequelize';
import { findCategories } from '../find-categories';

jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => '2026-08-06',
}));

const mockedQuery = sequelize.query as jest.Mock;

const sqlOf = () => mockedQuery.mock.calls[0][0] as string;
const optionsOf = () => mockedQuery.mock.calls[0][1];

describe('findCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedQuery.mockResolvedValue([]);
  });

  it('returns only the categories still in use', async () => {
    await findCategories();

    expect(sqlOf()).toContain('c.active = true');
  });

  it('includes archived categories when asked, so past expenses can name theirs', async () => {
    await findCategories({ includeInactive: true });

    expect(sqlOf()).not.toContain('c.active = true');
  });

  // pg returns COUNT as a bigint, which comes back as a string — the same trap as the DECIMAL
  // totals, and a string here would sort and render as text.
  it('returns the usage counts as numbers', async () => {
    mockedQuery.mockResolvedValue([
      { id: 1, name: 'Insumos', active: true, usageThisMonth: '12', usageAllTime: '87' },
    ]);

    const result = await findCategories();

    expect(result).toEqual([
      { id: 1, name: 'Insumos', active: true, usageThisMonth: 12, usageAllTime: 87 },
    ]);
  });

  it('counts this month against the month asked for', async () => {
    await findCategories({ month: '2026-07' });

    expect(optionsOf().replacements).toMatchObject({ start: '2026-07-01', end: '2026-07-31' });
  });

  it('counts this month against the current month when none is given', async () => {
    await findCategories();

    expect(optionsOf().replacements).toMatchObject({ start: '2026-08-01', end: '2026-08-31' });
  });

  // A category with no expenses at all must still appear — it is the one the user just created.
  it('keeps a category that has never been used', async () => {
    await findCategories();

    expect(sqlOf()).toContain('LEFT JOIN expenses');
  });

  it('never counts a deleted expense towards usage', async () => {
    await findCategories();

    expect(sqlOf()).toContain('e."deletedAt" IS NULL');
  });

  // The chip row is ordered by the server (business-rules.md → Finanzas): what the user reaches
  // for most this month comes first, all-time breaks the tie, and alphabetical decides the rest.
  it('orders by use this month, then all-time, then name', async () => {
    await findCategories();

    expect(sqlOf()).toContain('ORDER BY');
    expect(sqlOf()).toMatch(/"usageThisMonth" DESC[\s\S]*"usageAllTime" DESC[\s\S]*c\.name ASC/);
  });

  // "Otros" is where anything unclassified lands, so ranking it by use would float the least
  // informative chip to the front of the row.
  it('pins otros last however much it is used', async () => {
    await findCategories();

    const order = sqlOf().slice(sqlOf().indexOf('ORDER BY'));
    expect(order).toMatch(/lower\(c\.name\) = 'otros'/);
    expect(order.indexOf("'otros'")).toBeLessThan(order.indexOf('"usageThisMonth"'));
  });
});
