import sequelize from '../../database/sequelize';
import logger from '../../utils/logger';

type ServiceStatus = 'ok' | 'down';

type ServiceCheck = {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
};

const DEGRADED_LATENCY_MS = 500;

export type HealthReport = {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: string;
  services: ServiceCheck[];
  process: {
    uptimeSeconds: number;
    memoryUsedMb: number;
  };
};

const timeIt = async (fn: () => Promise<unknown>): Promise<number> => {
  const start = performance.now();
  await fn();
  return Math.round(performance.now() - start);
};

const checkApi = async (): Promise<ServiceCheck> => ({
  name: 'API La Oliva',
  status: 'ok',
  latencyMs: await timeIt(() => Promise.resolve()),
});

const checkDatabase = async (): Promise<ServiceCheck> => {
  try {
    const latencyMs = await timeIt(() => sequelize.query('SELECT 1'));
    return { name: 'Base de datos', status: 'ok', latencyMs };
  } catch (err) {
    // swallowed on purpose (the report itself carries the "down" status),
    // so the cause must be logged here — it never reaches the error handler
    logger.error({ err }, 'database health check failed');
    return { name: 'Base de datos', status: 'down', latencyMs: 0 };
  }
};

export const getReport = async (): Promise<HealthReport> => {
  const [api, database] = await Promise.all([checkApi(), checkDatabase()]);

  let status: HealthReport['status'] = 'ok';
  if (database.status === 'down') status = 'down';
  else if (database.latencyMs > DEGRADED_LATENCY_MS) status = 'degraded';

  return {
    status,
    checkedAt: new Date().toISOString(),
    services: [api, database],
    process: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };
};
