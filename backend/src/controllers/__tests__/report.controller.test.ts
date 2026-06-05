import request from 'supertest';
import app from '../../app';
import reportService from '../../services/report.service';

jest.mock('../../services/report.service');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

describe('GET /api/reports/active-clients/download', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a docx file with correct headers', async () => {
    (reportService.findDeliveryClientsForDate as jest.Mock).mockResolvedValue([
      'Ana López',
      'Carlos Ríos',
    ]);

    const res = await request(app).get('/api/reports/active-clients/download?date=15/06/2026');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(
      /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/,
    );
    expect(res.headers['content-disposition']).toMatch(/attachment.*\.docx/);
  });

  it('calls service with date converted to YYYY-MM-DD', async () => {
    (reportService.findDeliveryClientsForDate as jest.Mock).mockResolvedValue([]);

    await request(app).get('/api/reports/active-clients/download?date=20/06/2026');

    expect(reportService.findDeliveryClientsForDate).toHaveBeenCalledWith('2026-06-20');
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
