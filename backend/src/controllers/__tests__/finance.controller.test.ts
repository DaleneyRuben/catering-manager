import request from 'supertest';
import app from '../../app';
import {
  createExpense,
  deleteExpense,
  findCategories,
  findEarliestMonth,
  findMonthSummary,
  findMovements,
  updateExpense,
} from '../../domains/finance';
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
    expect(findMovements).toHaveBeenCalledWith('2026-08');
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
  beforeEach(() => jest.clearAllMocks());

  it('returns the active category catalog', async () => {
    (findCategories as jest.Mock).mockResolvedValue([{ id: 1, name: 'Insumos', active: true }]);

    const res = await request(app).get('/api/finance/categories');

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ name: 'Insumos' });
    expect(res.body.data[0].id).toBe(encodeId(1));
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
