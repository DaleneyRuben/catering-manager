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

  describe('filters', () => {
    it('returns both halves of the stream when nothing is filtered', async () => {
      await findMovements('2026-08');

      const sql = mockedQuery.mock.calls[0][0];
      expect(sql).toContain('FROM payments');
      expect(sql).toContain('FROM expenses');
      expect(sql).toContain('UNION ALL');
    });

    it('drops the expense half when the direction is income', async () => {
      await findMovements('2026-08', { direction: 'income' });

      const sql = mockedQuery.mock.calls[0][0];
      expect(sql).toContain('FROM payments');
      expect(sql).not.toContain('FROM expenses');
      expect(sql).not.toContain('UNION ALL');
    });

    it('drops the income half when the direction is expense', async () => {
      await findMovements('2026-08', { direction: 'expense' });

      const sql = mockedQuery.mock.calls[0][0];
      expect(sql).toContain('FROM expenses');
      expect(sql).not.toContain('FROM payments');
    });

    it('narrows expenses to one category', async () => {
      await findMovements('2026-08', { categoryId: 4 });

      expect(mockedQuery.mock.calls[0][0]).toContain('e."categoryId" = :categoryId');
      expect(mockedQuery.mock.calls[0][1].replacements.categoryId).toBe(4);
    });

    // Income carries no category, so asking for one is an expenses-only question. The UI keeps the
    // two controls consistent; the query must not answer with payments regardless.
    it('drops the income half entirely when a category is filtered', async () => {
      await findMovements('2026-08', { categoryId: 4 });

      expect(mockedQuery.mock.calls[0][0]).not.toContain('FROM payments');
    });

    it("searches an expense's description and an income row's client name", async () => {
      await findMovements('2026-08', { q: 'verduleria' });

      const sql = mockedQuery.mock.calls[0][0];
      expect(sql).toContain('c.name');
      expect(sql).toContain('e.description');
      expect(sql).toContain('LIKE :q');
    });

    // translate() rather than the unaccent extension: no migration, nothing to install.
    it('folds accents on both sides of the comparison', async () => {
      await findMovements('2026-08', { q: 'Verdulería' });

      expect(mockedQuery.mock.calls[0][0]).toContain("translate(lower(");
      expect(mockedQuery.mock.calls[0][1].replacements.q).toBe('%verduleria%');
    });

    it('escapes LIKE wildcards in the search term', async () => {
      await findMovements('2026-08', { q: '50%' });

      expect(mockedQuery.mock.calls[0][1].replacements.q).toBe('%50\\%%');
    });

    // Asking for income in one category is a contradiction: income carries no category. The set is
    // empty by definition, so it answers empty rather than building a query with no halves left.
    it('returns nothing without querying when a category is asked of income', async () => {
      const result = await findMovements('2026-08', { direction: 'income', categoryId: 4 });

      expect(result).toEqual([]);
      expect(mockedQuery).not.toHaveBeenCalled();
    });

    it('combines a category and a search term rather than replacing one with the other', async () => {
      await findMovements('2026-08', { categoryId: 4, q: 'verduleria' });

      const sql = mockedQuery.mock.calls[0][0];
      expect(sql).toContain('e."categoryId" = :categoryId');
      expect(sql).toContain('LIKE :q');
    });
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
