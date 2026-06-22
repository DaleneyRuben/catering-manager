import sequelize from '../../database/sequelize';
import healthService from '../health.service';

jest.mock('../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockQuery = sequelize.query as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('healthService.getReport', () => {
  it('reports ok status with both services ok when the database responds', async () => {
    mockQuery.mockResolvedValue([[{ '?column?': 1 }], {}]);

    const report = await healthService.getReport();

    expect(report.status).toBe('ok');
    expect(report.services).toEqual([
      expect.objectContaining({ name: 'API La Oliva', status: 'ok' }),
      expect.objectContaining({ name: 'Base de datos', status: 'ok' }),
    ]);
  });

  it('reports down status when the database query throws', async () => {
    mockQuery.mockRejectedValue(new Error('connection refused'));

    const report = await healthService.getReport();

    expect(report.status).toBe('down');
    expect(report.services).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Base de datos', status: 'down' })]),
    );
  });

  it('includes a checkedAt ISO timestamp', async () => {
    mockQuery.mockResolvedValue([[], {}]);

    const report = await healthService.getReport();

    expect(() => new Date(report.checkedAt).toISOString()).not.toThrow();
  });

  it('includes real process uptime and memory metrics', async () => {
    mockQuery.mockResolvedValue([[], {}]);

    const report = await healthService.getReport();

    expect(report.process.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(report.process.memoryUsedMb).toBeGreaterThan(0);
  });

  it('reports degraded status when the database is slow', async () => {
    mockQuery.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([[], {}]), 510);
        }),
    );

    const report = await healthService.getReport();

    expect(report.status).toBe('degraded');
  }, 1000);
});
