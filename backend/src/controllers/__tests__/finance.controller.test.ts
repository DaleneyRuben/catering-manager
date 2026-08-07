import request from 'supertest';
import app from '../../app';
import {
  createCategory,
  createExpense,
  deactivateCategory,
  deleteExpense,
  findCategories,
  findEarliestMonth,
  findMonthSummary,
  findMovements,
  findMovementsSubtotal,
  reactivateCategory,
  renameCategory,
  updateExpense,
} from '../../domains/finance';
import { ConflictError } from '../../utils/errors';
import { encodeId } from '../../utils/sqids';

jest.mock('../../domains/finance');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = { userId: 7, username: 'ada', role: 'admin' };
    next();
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockToday = jest.fn(() => '2026-08-06');
jest.mock('../../utils/date', () => ({
  ...jest.requireActual('../../utils/date'),
  appToday: () => mockToday(),
}));

const mockSummary = {
  income: 4050,
  expenses: 1200.5,
  balance: 2849.5,
  byCategory: [{ categoryId: 1, categoryName: 'Insumos', total: 800 }],
};

const mockMovements = [
  {
    kind: 'income',
    id: 3,
    date: '2026-08-05',
    amount: 650,
    label: 'Ana Flores',
    description: null,
  },
  {
    kind: 'expense',
    id: 9,
    date: '2026-08-04',
    amount: 120,
    label: 'Transporte',
    description: 'Delivery lunes',
  },
];

const stubOverview = () => {
  (findMonthSummary as jest.Mock).mockResolvedValue(mockSummary);
  (findMovements as jest.Mock).mockResolvedValue(mockMovements);
  (findEarliestMonth as jest.Mock).mockResolvedValue('2026-07');
  (findMovementsSubtotal as jest.Mock).mockResolvedValue({ count: 18, subtotal: -4140 });
};

describe('GET /api/finance', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the month summary, its movements and the selectable lower bound', async () => {
    stubOverview();

    const res = await request(app).get('/api/finance?month=2026-08');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      month: '2026-08',
      earliestMonth: '2026-07',
      income: 4050,
      expenses: 1200.5,
      balance: 2849.5,
    });
    expect(res.body.data.movements).toHaveLength(2);
  });

  it('defaults to the current month when none is given', async () => {
    stubOverview();

    const res = await request(app).get('/api/finance');

    expect(res.body.data.month).toBe('2026-08');
    expect(findMonthSummary).toHaveBeenCalledWith('2026-08');
    expect(findMovements).toHaveBeenCalledWith('2026-08', {});
  });

  it('returns the filtered count and subtotal alongside the rows', async () => {
    stubOverview();

    const res = await request(app).get('/api/finance?month=2026-08');

    expect(res.body.data).toMatchObject({ count: 18, subtotal: -4140 });
  });

  it('passes direction, category and search through to the query', async () => {
    stubOverview();

    await request(app).get(
      `/api/finance?month=2026-08&direction=expense&categoryId=${encodeId(4)}&q=verduleria`,
    );

    expect(findMovements).toHaveBeenCalledWith('2026-08', {
      direction: 'expense',
      categoryId: 4,
      q: 'verduleria',
    });
  });

  // The subtotal has to see exactly what the list sees, or the figure under the rows describes a
  // different set from the rows themselves.
  it('scopes the subtotal to the same filters as the rows', async () => {
    stubOverview();

    await request(app).get('/api/finance?month=2026-08&direction=expense');

    expect(findMovementsSubtotal).toHaveBeenCalledWith('2026-08', { direction: 'expense' });
  });

  // The month's truth does not move because someone narrowed a list — a "Balance" of one category
  // is not a balance of anything.
  it('leaves the three tiles unfiltered', async () => {
    stubOverview();

    const res = await request(app).get('/api/finance?month=2026-08&direction=expense&q=verduleria');

    expect(findMonthSummary).toHaveBeenCalledWith('2026-08');
    expect(res.body.data).toMatchObject({ income: 4050, expenses: 1200.5, balance: 2849.5 });
  });

  it('rejects a direction that is neither income nor expense', async () => {
    const res = await request(app).get('/api/finance?month=2026-08&direction=sideways');

    expect(res.status).toBe(400);
    expect(findMovements).not.toHaveBeenCalled();
  });

  // With nothing recorded yet the selector has nothing to page back to, so the current month is
  // its own floor rather than an open-ended range of empty months.
  it('falls back to the current month as the bound when the register is empty', async () => {
    stubOverview();
    (findEarliestMonth as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/finance');

    expect(res.body.data.earliestMonth).toBe('2026-08');
  });

  it('rejects a month that is not YYYY-MM', async () => {
    const res = await request(app).get('/api/finance?month=agosto');

    expect(res.status).toBe(400);
    expect(findMonthSummary).not.toHaveBeenCalled();
  });

  it('rejects a month past the current one', async () => {
    const res = await request(app).get('/api/finance?month=2026-09');

    expect(res.status).toBe(400);
    expect(findMonthSummary).not.toHaveBeenCalled();
  });
});

describe('GET /api/finance/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (findCategories as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Insumos', active: true, usageThisMonth: 4, usageAllTime: 31 },
    ]);
  });

  it('returns the active category catalog', async () => {
    const res = await request(app).get('/api/finance/categories');

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ name: 'Insumos' });
    expect(res.body.data[0].id).toBe(encodeId(1));
  });

  it('returns the usage counts the modal states before anyone archives', async () => {
    const res = await request(app).get('/api/finance/categories');

    expect(res.body.data[0]).toMatchObject({ usageThisMonth: 4, usageAllTime: 31 });
  });

  it('reads only active categories by default', async () => {
    await request(app).get('/api/finance/categories');

    expect(findCategories).toHaveBeenCalledWith(
      expect.objectContaining({ includeInactive: false }),
    );
  });

  // The modal's ARCHIVADAS section is the only reader that wants them, so it asks.
  it('includes archived categories when asked', async () => {
    await request(app).get('/api/finance/categories?includeArchived=true');

    expect(findCategories).toHaveBeenCalledWith(expect.objectContaining({ includeInactive: true }));
  });

  it('counts usage against the month asked for', async () => {
    await request(app).get('/api/finance/categories?month=2026-07');

    expect(findCategories).toHaveBeenCalledWith(expect.objectContaining({ month: '2026-07' }));
  });

  it('rejects a month that is not YYYY-MM', async () => {
    const res = await request(app).get('/api/finance/categories?month=julio');

    expect(res.status).toBe(400);
    expect(findCategories).not.toHaveBeenCalled();
  });
});

describe('POST /api/finance/categories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the category and returns it', async () => {
    (createCategory as jest.Mock).mockResolvedValue({
      category: { id: 9, name: 'Mantenimiento', active: true },
      created: true,
    });

    const res = await request(app).post('/api/finance/categories').send({ name: 'Mantenimiento' });

    expect(res.status).toBe(201);
    expect(createCategory).toHaveBeenCalledWith('Mantenimiento');
    expect(res.body.data.id).toBe(encodeId(9));
  });

  // Nothing was created, so the answer is not 201 — but it is the category the user meant, which
  // is what "+ Nueva" needs back in order to select it.
  it('answers 200 with the existing category when the name folds', async () => {
    (createCategory as jest.Mock).mockResolvedValue({
      category: { id: 3, name: 'Insumos', active: true },
      created: false,
    });

    const res = await request(app).post('/api/finance/categories').send({ name: 'insumos' });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(encodeId(3));
  });

  it('rejects an empty name', async () => {
    const res = await request(app).post('/api/finance/categories').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(createCategory).not.toHaveBeenCalled();
  });

  it('trims the name before storing it', async () => {
    (createCategory as jest.Mock).mockResolvedValue({ category: { id: 9 }, created: true });

    await request(app).post('/api/finance/categories').send({ name: '  Mantenimiento  ' });

    expect(createCategory).toHaveBeenCalledWith('Mantenimiento');
  });
});

describe('PATCH /api/finance/categories/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renames the category', async () => {
    (renameCategory as jest.Mock).mockResolvedValue({ id: 3, name: 'Insumos secos' });

    const res = await request(app)
      .patch(`/api/finance/categories/${encodeId(3)}`)
      .send({ name: 'Insumos secos' });

    expect(res.status).toBe(200);
    expect(renameCategory).toHaveBeenCalledWith(3, 'Insumos secos');
  });

  // Archivar, never Eliminar: the expenses already filed against it keep naming it.
  it('archives the category', async () => {
    (deactivateCategory as jest.Mock).mockResolvedValue({ id: 3, active: false });

    const res = await request(app)
      .patch(`/api/finance/categories/${encodeId(3)}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(deactivateCategory).toHaveBeenCalledWith(3);
  });

  it('restores the category', async () => {
    (reactivateCategory as jest.Mock).mockResolvedValue({ id: 3, active: true });

    const res = await request(app)
      .patch(`/api/finance/categories/${encodeId(3)}`)
      .send({ active: true });

    expect(res.status).toBe(200);
    expect(reactivateCategory).toHaveBeenCalledWith(3);
  });

  it('renames and restores in one request', async () => {
    (renameCategory as jest.Mock).mockResolvedValue({ id: 3, name: 'Eventos' });
    (reactivateCategory as jest.Mock).mockResolvedValue({ id: 3, name: 'Eventos', active: true });

    const res = await request(app)
      .patch(`/api/finance/categories/${encodeId(3)}`)
      .send({ name: 'Eventos', active: true });

    expect(res.status).toBe(200);
    expect(renameCategory).toHaveBeenCalledWith(3, 'Eventos');
    expect(reactivateCategory).toHaveBeenCalledWith(3);
    expect(res.body.data).toMatchObject({ active: true });
  });

  it('returns 409 when the new name is already taken', async () => {
    (renameCategory as jest.Mock).mockRejectedValue(new ConflictError('Category name taken'));

    const res = await request(app)
      .patch(`/api/finance/categories/${encodeId(3)}`)
      .send({ name: 'Transporte' });

    expect(res.status).toBe(409);
  });

  it('returns 404 when the category does not exist', async () => {
    (renameCategory as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/finance/categories/${encodeId(99)}`)
      .send({ name: 'Insumos secos' });

    expect(res.status).toBe(404);
  });

  it('rejects a request that changes nothing', async () => {
    const res = await request(app).patch(`/api/finance/categories/${encodeId(3)}`).send({});

    expect(res.status).toBe(400);
    expect(renameCategory).not.toHaveBeenCalled();
    expect(deactivateCategory).not.toHaveBeenCalled();
  });
});

describe('POST /api/finance/expenses', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    amount: 120.5,
    categoryId: encodeId(2),
    spentAt: '2026-08-04',
    description: 'Delivery lunes',
  };

  it('creates the expense and returns it', async () => {
    (createExpense as jest.Mock).mockResolvedValue({ id: 9, ...validBody, categoryId: 2 });

    const res = await request(app).post('/api/finance/expenses').send(validBody);

    expect(res.status).toBe(201);
    expect(createExpense).toHaveBeenCalledWith(
      { amount: 120.5, categoryId: 2, spentAt: '2026-08-04', description: 'Delivery lunes' },
      { userId: 7, username: 'ada' },
    );
  });

  it('rejects an amount of zero', async () => {
    const res = await request(app)
      .post('/api/finance/expenses')
      .send({ ...validBody, amount: 0 });

    expect(res.status).toBe(400);
    expect(createExpense).not.toHaveBeenCalled();
  });

  it('rejects a negative amount', async () => {
    const res = await request(app)
      .post('/api/finance/expenses')
      .send({ ...validBody, amount: -50 });

    expect(res.status).toBe(400);
  });

  // Money that has not moved yet is not a movement — the register is cash basis.
  it('rejects a date in the future', async () => {
    const res = await request(app)
      .post('/api/finance/expenses')
      .send({ ...validBody, spentAt: '2026-08-07' });

    expect(res.status).toBe(400);
    expect(createExpense).not.toHaveBeenCalled();
  });

  it('accepts a backdated expense', async () => {
    (createExpense as jest.Mock).mockResolvedValue({ id: 9 });

    const res = await request(app)
      .post('/api/finance/expenses')
      .send({ ...validBody, spentAt: '2026-07-30' });

    expect(res.status).toBe(201);
  });

  it('requires a category', async () => {
    const res = await request(app)
      .post('/api/finance/expenses')
      .send({ amount: 120.5, spentAt: '2026-08-04' });

    expect(res.status).toBe(400);
  });

  it('accepts an expense with no description', async () => {
    (createExpense as jest.Mock).mockResolvedValue({ id: 9 });

    const res = await request(app)
      .post('/api/finance/expenses')
      .send({ amount: 120.5, categoryId: encodeId(2), spentAt: '2026-08-04' });

    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/finance/expenses/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates the expense', async () => {
    (updateExpense as jest.Mock).mockResolvedValue({ id: 9, amount: 200 });

    const res = await request(app)
      .patch(`/api/finance/expenses/${encodeId(9)}`)
      .send({ amount: 200 });

    expect(res.status).toBe(200);
    expect(updateExpense).toHaveBeenCalledWith(9, { amount: 200 });
  });

  it('returns 404 when the expense does not exist', async () => {
    (updateExpense as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/finance/expenses/${encodeId(9)}`)
      .send({ amount: 200 });

    expect(res.status).toBe(404);
  });

  it('rejects an amount of zero', async () => {
    const res = await request(app)
      .patch(`/api/finance/expenses/${encodeId(9)}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
    expect(updateExpense).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/finance/expenses/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes the expense', async () => {
    (deleteExpense as jest.Mock).mockResolvedValue(true);

    const res = await request(app).delete(`/api/finance/expenses/${encodeId(9)}`);

    expect(res.status).toBe(200);
    expect(deleteExpense).toHaveBeenCalledWith(9);
  });

  it('returns 404 when the expense does not exist', async () => {
    (deleteExpense as jest.Mock).mockResolvedValue(false);

    const res = await request(app).delete(`/api/finance/expenses/${encodeId(9)}`);

    expect(res.status).toBe(404);
  });
});
