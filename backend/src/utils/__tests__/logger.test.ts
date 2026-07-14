import logger, { buildLoggerOptions } from '../logger';

describe('buildLoggerOptions', () => {
  it('uses plain json output at info level in production', () => {
    const options = buildLoggerOptions('production');

    expect(options.level).toBe('info');
    expect(options.transport).toBeUndefined();
  });

  it('silences output in the test environment', () => {
    const options = buildLoggerOptions('test');

    expect(options.level).toBe('silent');
  });

  it('uses pretty output at debug level in local dev', () => {
    const options = buildLoggerOptions('development');

    expect(options.level).toBe('debug');
    expect(options.transport).toEqual({ target: 'pino-pretty' });
  });

  it('treats a missing NODE_ENV as local dev', () => {
    const options = buildLoggerOptions(undefined);

    expect(options.level).toBe('debug');
    expect(options.transport).toEqual({ target: 'pino-pretty' });
  });
});

describe('logger', () => {
  it('exposes the standard level methods', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});
