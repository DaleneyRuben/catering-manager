import request from 'supertest';
import app from '../../app';
import * as menuService from '../../services/menu';
import * as reportService from '../../services/report';
import * as kitchenReportBuilder from '../../utils/kitchenReportBuilder';

jest.mock('../../services/menu');
jest.mock('../../services/report');
jest.mock('../../utils/kitchenReportBuilder');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockMenu = {
  id: 1,
  date: '2026-06-05',
  breakfast: 'Queque de platano',
  morningSnack: 'Flan de chocolate',
  salad: 'Vainitas con zuccini',
  lunch: 'Boloñesa',
  afternoonSnack: 'Manzana asada',
  dinner: 'Tortilla de coliflor',
  juice: 'Limonada',
};

describe('GET /api/reports/active-clients/download', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an xlsx file with correct headers', async () => {
    (reportService.findDeliveryClientsForDate as jest.Mock).mockResolvedValue([
      'Ana López',
      'Carlos Ríos',
    ]);

    const res = await request(app).get('/api/reports/active-clients/download?date=15/06/2026');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(
      /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/,
    );
    expect(res.headers['content-disposition']).toMatch(/attachment.*\.xlsx/);
  });

  it('calls service with date converted to YYYY-MM-DD', async () => {
    (reportService.findDeliveryClientsForDate as jest.Mock).mockResolvedValue([]);

    await request(app).get('/api/reports/active-clients/download?date=19/06/2026');

    expect(reportService.findDeliveryClientsForDate).toHaveBeenCalledWith('2026-06-19');
  });

  it('returns 400 when date is a saturday', async () => {
    const res = await request(app).get('/api/reports/active-clients/download?date=06/06/2026');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date is a sunday', async () => {
    const res = await request(app).get('/api/reports/active-clients/download?date=07/06/2026');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date param is missing', async () => {
    const res = await request(app).get('/api/reports/active-clients/download');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date param is invalid', async () => {
    const res = await request(app).get('/api/reports/active-clients/download?date=notadate');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date param is YYYY-MM-DD format', async () => {
    const res = await request(app).get('/api/reports/active-clients/download?date=2026-06-15');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/reports/menu-card/download', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a docx file with correct headers when menu exists', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(mockMenu);

    const res = await request(app).get('/api/reports/menu-card/download?date=2026-06-05');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(
      /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/,
    );
    expect(res.headers['content-disposition']).toMatch(/attachment.*\.docx/);
  });

  it('calls menuService with the given date', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(mockMenu);

    await request(app).get('/api/reports/menu-card/download?date=2026-06-05');

    expect(menuService.findByDate).toHaveBeenCalledWith('2026-06-05');
  });

  it('returns 404 when no menu exists for the date', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/reports/menu-card/download?date=2026-06-05');

    expect(res.status).toBe(404);
  });

  it('returns 400 when date param is missing', async () => {
    const res = await request(app).get('/api/reports/menu-card/download');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(app).get('/api/reports/menu-card/download?date=06/06/2026');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date is a weekend', async () => {
    const res = await request(app).get('/api/reports/menu-card/download?date=2026-06-06');

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (menuService.findByDate as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/reports/menu-card/download?date=2026-06-05');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/reports/kitchen-report/download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (kitchenReportBuilder.buildKitchenReport as jest.Mock).mockResolvedValue(Buffer.from('docx'));
    (kitchenReportBuilder.kitchenReportFileName as jest.Mock).mockReturnValue('Jueves 0506.docx');
  });

  it('returns a docx file with correct headers when menu and clients exist', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(mockMenu);
    (reportService.findActiveClientsWithPlansForDate as jest.Mock).mockResolvedValue([
      { name: 'Ana López', planMeals: ['breakfast', 'lunch'], restrictions: [] },
    ]);

    const res = await request(app).get('/api/reports/kitchen-report/download?date=2026-06-05');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(
      /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/,
    );
    expect(res.headers['content-disposition']).toMatch(/attachment.*\.docx/);
  });

  it('calls services with the given date', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(mockMenu);
    (reportService.findActiveClientsWithPlansForDate as jest.Mock).mockResolvedValue([]);

    await request(app).get('/api/reports/kitchen-report/download?date=2026-06-05');

    expect(menuService.findByDate).toHaveBeenCalledWith('2026-06-05');
    expect(reportService.findActiveClientsWithPlansForDate).toHaveBeenCalledWith('2026-06-05');
  });

  it('returns 404 when no menu exists for the date', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(null);
    (reportService.findActiveClientsWithPlansForDate as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/reports/kitchen-report/download?date=2026-06-05');

    expect(res.status).toBe(404);
  });

  it('returns 400 when date param is missing', async () => {
    const res = await request(app).get('/api/reports/kitchen-report/download');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(app).get('/api/reports/kitchen-report/download?date=06/06/2026');

    expect(res.status).toBe(400);
  });

  it('returns 400 when date is a weekend', async () => {
    const res = await request(app).get('/api/reports/kitchen-report/download?date=2026-06-06');

    expect(res.status).toBe(400);
  });
});
