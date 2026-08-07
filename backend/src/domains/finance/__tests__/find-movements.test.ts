import sequelize from '../../../database/sequelize';
import { findMovements } from '../find-movements';

jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockedQuery = sequelize.query as jest.Mock;

describe('findMovements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedQuery.mockResolvedValue([]);
  });

  it('returns income and expenses as one interleaved stream', async () => {
    mockedQuery.mockResolvedValue([
      {
        kind: 'expense',
        id: 5,
        date: '2026-08-06',
        amount: '250.00',
        label: 'Insumos',
        description: 'Verduras',
      },
      {
        kind: 'income',
        id: 3,
        date: '2026-08-05',
        amount: '1350.00',
        label: 'Ana Pérez',
        description: null,
      },
    ]);

    const result = await findMovements('2026-08');

    expect(result).toEqual([
      {
        kind: 'expense',
        id: 5,
        date: '2026-08-06',
        amount: 250,
        label: 'Insumos',
        description: 'Verduras',
      },
      {
        kind: 'income',
        id: 3,
        date: '2026-08-05',
        amount: 1350,
        label: 'Ana Pérez',
        description: null,
      },
    ]);
  });

  it('returns an empty list for a month with no movements', async () => {
    const result = await findMovements('2026-08');

    expect(result).toEqual([]);
  });

  it('bounds the query by the first and last day of the month', async () => {
    await findMovements('2026-08');

    expect(mockedQuery.mock.calls[0][1].replacements).toEqual({
      start: '2026-08-01',
      end: '2026-08-31',
    });
  });

  it('orders the stream newest first', async () => {
    await findMovements('2026-08');

    expect(mockedQuery.mock.calls[0][0]).toContain('ORDER BY date DESC');
  });

  it('excludes soft-deleted expenses', async () => {
    await findMovements('2026-08');

    expect(mockedQuery.mock.calls[0][0]).toContain('"deletedAt" IS NULL');
  });

  it("keeps a soft-deleted client's payments in the stream", async () => {
    await findMovements('2026-08');

    // A default Sequelize include would drop them and quietly lower a closed month's income; the
    // raw join must not filter clients."deletedAt".
    expect(mockedQuery.mock.calls[0][0]).not.toContain('c."deletedAt"');
  });
});
