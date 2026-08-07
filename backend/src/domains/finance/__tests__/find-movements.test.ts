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
        clientId: null,
        clientArchived: false,
        categoryId: 2,
        registeredByName: 'Gilian',
        registeredAt: '2026-08-06T12:00:00.000Z',
      },
      {
        kind: 'income',
        id: 3,
        date: '2026-08-05',
        amount: '1350.00',
        label: 'Ana Pérez',
        description: null,
        clientId: 7,
        clientArchived: false,
        categoryId: null,
        registeredByName: 'Daleney',
        registeredAt: '2026-08-05T09:30:00.000Z',
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
        clientId: null,
        clientArchived: false,
        categoryId: 2,
        registeredByName: 'Gilian',
        registeredAt: '2026-08-06T12:00:00.000Z',
      },
      {
        kind: 'income',
        id: 3,
        date: '2026-08-05',
        amount: 1350,
        label: 'Ana Pérez',
        description: null,
        clientId: 7,
        clientArchived: false,
        categoryId: null,
        registeredByName: 'Daleney',
        registeredAt: '2026-08-05T09:30:00.000Z',
      },
    ]);
  });

  // Asserted through the UNION's placeholder column rather than the bare "p.\"clientId\"", which
  // already appears in the join condition and would pass without the column being selected at all.
  it('carries the client on an income row, so it can link to their profile', async () => {
    await findMovements('2026-08');

    const sql = mockedQuery.mock.calls[0][0];
    expect(sql).toContain('p."clientId"');
    expect(sql).toContain('NULL::integer AS "clientId"');
  });

  it('carries the category on an expense row, so its tag can filter the list', async () => {
    await findMovements('2026-08');

    const sql = mockedQuery.mock.calls[0][0];
    expect(sql).toContain('e."categoryId"');
    expect(sql).toContain('NULL::integer AS "categoryId"');
  });

  it('flags a payment whose client has since been soft-deleted', async () => {
    await findMovements('2026-08');

    expect(mockedQuery.mock.calls[0][0]).toContain('c."deletedAt" IS NOT NULL AS "clientArchived"');
  });

  // registeredBy is the numeric FK on both models; the stream carries the username instead, and
  // survives the user being hard-deleted (the column is ON DELETE SET NULL) via a LEFT JOIN.
  it('names the user who registered each side of the stream', async () => {
    await findMovements('2026-08');

    const sql = mockedQuery.mock.calls[0][0];
    expect(sql).toContain('u.username AS "registeredByName"');
    expect(sql).toContain('LEFT JOIN users u ON u.id = p."registeredBy"');
    expect(sql).toContain('LEFT JOIN users u ON u.id = e."registeredBy"');
  });

  // Backdating is allowed, so the day an expense was entered is not the day it is dated — and the
  // question "who recorded this?" is usually followed by "when?".
  it('carries when the row was recorded, separately from the day the money moved', async () => {
    await findMovements('2026-08');

    const sql = mockedQuery.mock.calls[0][0];
    expect(sql).toContain('p."createdAt" AS "registeredAt"');
    expect(sql).toContain('e."createdAt" AS "registeredAt"');
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

    // The column is now read to flag the row (see clientArchived above), but it must never be
    // filtered on: dropping those payments would quietly lower a closed month's income.
    expect(mockedQuery.mock.calls[0][0]).not.toContain('c."deletedAt" IS NULL');
  });
});
