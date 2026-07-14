import sequelize from '../../../database/sequelize';
import logger from '../../../utils/logger';
import { getReport } from '../get-report';

jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

const mockQuery = sequelize.query as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getReport', () => {
  it('reports ok status with both services ok when the database responds', async () => {
    mockQuery.mockResolvedValue([[{ '?column?': 1 }], {}]);

    const report = await getReport();

    expect(report.status).toBe('ok');
    expect(report.services).toEqual([
      expect.objectContaining({ name: 'API La Oliva', status: 'ok' }),
      expect.objectContaining({ name: 'Base de datos', status: 'ok' }),
    ]);
  });

  it('reports down status when the database query throws', async () => {
    mockQuery.mockRejectedValue(new Error('connection refused'));

    const report = await getReport();

    expect(report.status).toBe('down');
    expect(report.services).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Base de datos', status: 'down' })]),
    );
  });

  it('logs the underlying error when the database check fails', async () => {
    const err = new Error('connection refused');
    mockQuery.mockRejectedValue(err);

    await getReport();

    expect(logger.error).toHaveBeenCalledWith({ err }, 'database health check failed');
  });

  it('does not log when the database check succeeds', async () => {
    mockQuery.mockResolvedValue([[], {}]);

    await getReport();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('includes a checkedAt ISO timestamp', async () => {
    mockQuery.mockResolvedValue([[], {}]);

    const report = await getReport();

    expect(() => new Date(report.checkedAt).toISOString()).not.toThrow();
  });

  it('includes real process uptime and memory metrics', async () => {
    mockQuery.mockResolvedValue([[], {}]);

    const report = await getReport();

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

    const report = await getReport();

    expect(report.status).toBe('degraded');
  }, 1000);
});
