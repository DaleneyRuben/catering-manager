import pino, { LoggerOptions } from 'pino';

export function buildLoggerOptions(nodeEnv: string | undefined): LoggerOptions {
  if (nodeEnv === 'production') {
    return { level: 'info' };
  }
  // jest sets NODE_ENV=test — keep test output clean
  if (nodeEnv === 'test') {
    return { level: 'silent' };
  }
  return { level: 'debug', transport: { target: 'pino-pretty' } };
}

const logger = pino(buildLoggerOptions(process.env.NODE_ENV));

export default logger;
