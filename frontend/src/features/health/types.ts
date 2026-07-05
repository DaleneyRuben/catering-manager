export type ServiceCheck = {
  name: string;
  status: 'ok' | 'down';
  latencyMs: number;
};

export type HealthReport = {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: string;
  services: ServiceCheck[];
  process: {
    uptimeSeconds: number;
    memoryUsedMb: number;
  };
};
