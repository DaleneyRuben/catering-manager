import request from 'supertest';
import app from '../../app';
import * as healthService from '../../services/health';

jest.mock('../../services/health');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockGetReport = healthService.getReport as jest.Mock;

const sampleReport = {
  status: 'ok',
  checkedAt: '2026-06-22T12:00:00.000Z',
  services: [
    { name: 'API La Oliva', status: 'ok', latencyMs: 1 },
    { name: 'Base de datos', status: 'ok', latencyMs: 12 },
  ],
  process: { uptimeSeconds: 120, memoryUsedMb: 45 },
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/health', () => {
  it('returns the health report as json', async () => {
    mockGetReport.mockResolvedValue(sampleReport);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: sampleReport });
  });

  it('returns 500 when the health service throws', async () => {
    mockGetReport.mockRejectedValue(new Error('unexpected'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(500);
  });
});
