import request from 'supertest';
import app from '../../app';
import menuService from '../../services/menu/menu.service';

jest.mock('../../services/menu/menu.service');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockMenu = {
  id: 1,
  date: '2026-06-05',
  breakfast: 'Queque de platano',
  morningSnack: null,
  salad: null,
  lunch: null,
  afternoonSnack: null,
  dinner: null,
  juice: null,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/menus', () => {
  it('returns 200 with all menus', async () => {
    (menuService.findAll as jest.Mock).mockResolvedValue([mockMenu]);

    const res = await request(app).get('/api/menus');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ date: '2026-06-05' });
  });

  it('returns 500 when service throws', async () => {
    (menuService.findAll as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/menus');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/menus/:date', () => {
  it('returns 200 with menu when found', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(mockMenu);

    const res = await request(app).get('/api/menus/2026-06-05');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ date: '2026-06-05' });
  });

  it('returns 404 when menu not found', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/menus/2026-06-05');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/menus', () => {
  const validPayload = {
    date: '2026-06-05',
    breakfast: 'Queque de platano',
  };

  it('returns 200 with upserted menu', async () => {
    (menuService.upsert as jest.Mock).mockResolvedValue(mockMenu);

    const res = await request(app).put('/api/menus').send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ date: '2026-06-05' });
  });

  it('returns 400 when date is missing', async () => {
    const res = await request(app).put('/api/menus').send({ breakfast: 'Queque' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(app)
      .put('/api/menus')
      .send({ date: '06-06-2026', breakfast: 'Queque' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when date is a saturday', async () => {
    const res = await request(app)
      .put('/api/menus')
      .send({ date: '2026-06-06', breakfast: 'Queque' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when date is a sunday', async () => {
    const res = await request(app)
      .put('/api/menus')
      .send({ date: '2026-06-07', breakfast: 'Queque' });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (menuService.upsert as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).put('/api/menus').send(validPayload);

    expect(res.status).toBe(500);
  });
});
