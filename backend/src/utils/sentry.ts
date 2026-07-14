import * as Sentry from '@sentry/node';

const FLUSH_TIMEOUT_MS = 2000;

export function isSentryEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(process.env.SENTRY_DSN);
}

export function initSentry(): void {
  if (!isSentryEnabled()) return;
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

export async function captureError(err: Error): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    Sentry.captureException(err);
    // Vercel freezes the function as soon as the response is sent, so the
    // event must be flushed before the error handler responds
    await Sentry.flush(FLUSH_TIMEOUT_MS);
  } catch {
    // sentry being unreachable must never block the error response
  }
}
