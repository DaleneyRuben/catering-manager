import * as Sentry from '@sentry/node';
import { isSentryEnabled, initSentry, captureError } from '../sentry';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('isSentryEnabled', () => {
  it('is enabled in production with a DSN set', () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://key@sentry.example/1';

    expect(isSentryEnabled()).toBe(true);
  });

  it('is disabled in production without a DSN', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SENTRY_DSN;

    expect(isSentryEnabled()).toBe(false);
  });

  it('is disabled outside production even with a DSN set', () => {
    process.env.NODE_ENV = 'development';
    process.env.SENTRY_DSN = 'https://key@sentry.example/1';

    expect(isSentryEnabled()).toBe(false);
  });
});

describe('initSentry', () => {
  it('initializes sentry with the DSN when enabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://key@sentry.example/1';

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith({ dsn: 'https://key@sentry.example/1' });
  });

  it('does nothing when disabled', () => {
    process.env.NODE_ENV = 'development';
    process.env.SENTRY_DSN = 'https://key@sentry.example/1';

    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
  });
});

describe('captureError', () => {
  it('captures and flushes the error when enabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://key@sentry.example/1';
    const err = new Error('db exploded');

    await captureError(err);

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(Sentry.flush).toHaveBeenCalled();
  });

  it('does nothing when disabled', async () => {
    process.env.NODE_ENV = 'development';

    await captureError(new Error('db exploded'));

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.flush).not.toHaveBeenCalled();
  });

  it('never throws even if flushing fails', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://key@sentry.example/1';
    (Sentry.flush as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    await expect(captureError(new Error('db exploded'))).resolves.toBeUndefined();
  });
});
