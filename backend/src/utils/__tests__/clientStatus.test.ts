import { deriveClientStatus } from '../clientStatus';

const TODAY = '2026-06-10';

const makeSub = (overrides = {}) => ({
  startDate: '2026-05-01',
  contractEndDate: '2026-07-01',
  suspendedDates: [] as string[],
  finalizedAt: null as string | null,
  ...overrides,
});

describe('deriveClientStatus', () => {
  // --- ended ---
  it('returns ended when there is no subscription', () => {
    expect(deriveClientStatus({ pausedSince: null, sub: null }, TODAY)).toBe('ended');
  });

  it('returns ended when contractEndDate is null but startDate is in the past (orphaned subscription)', () => {
    expect(
      deriveClientStatus(
        { pausedSince: null, sub: makeSub({ contractEndDate: null, startDate: '2026-05-01' }) },
        TODAY,
      ),
    ).toBe('ended');
  });

  it('returns ended when finalizedAt is set even if contractEndDate is today', () => {
    expect(
      deriveClientStatus(
        {
          pausedSince: null,
          sub: makeSub({ contractEndDate: TODAY, finalizedAt: TODAY }),
        },
        TODAY,
      ),
    ).toBe('ended');
  });

  it('returns ended when contractEndDate was yesterday', () => {
    expect(
      deriveClientStatus(
        { pausedSince: null, sub: makeSub({ contractEndDate: '2026-06-09' }) },
        TODAY,
      ),
    ).toBe('ended');
  });

  it('returns ended when contractEndDate is in the past', () => {
    expect(
      deriveClientStatus(
        { pausedSince: null, sub: makeSub({ contractEndDate: '2026-06-01' }) },
        TODAY,
      ),
    ).toBe('ended');
  });

  it('ended takes precedence over pausedSince', () => {
    expect(
      deriveClientStatus(
        { pausedSince: new Date('2026-06-05'), sub: makeSub({ contractEndDate: '2026-06-08' }) },
        TODAY,
      ),
    ).toBe('ended');
  });

  // --- paused ---
  it('returns paused when pausedSince is set and subscription is current', () => {
    expect(deriveClientStatus({ pausedSince: new Date('2026-06-05'), sub: makeSub() }, TODAY)).toBe(
      'paused',
    );
  });

  it('returns paused for sin-fecha client (null dates, pausedSince set)', () => {
    expect(
      deriveClientStatus(
        {
          pausedSince: new Date('2026-06-10'),
          sub: makeSub({ startDate: null, contractEndDate: null }),
        },
        TODAY,
      ),
    ).toBe('paused');
  });

  it('paused takes precedence over future start date', () => {
    expect(
      deriveClientStatus(
        { pausedSince: new Date(), sub: makeSub({ startDate: '2026-06-15' }) },
        TODAY,
      ),
    ).toBe('paused');
  });

  // --- future ---
  it('returns future when startDate is after today and client is not paused', () => {
    expect(
      deriveClientStatus({ pausedSince: null, sub: makeSub({ startDate: '2026-06-15' }) }, TODAY),
    ).toBe('future');
  });

  it('returns future when startDate and contractEndDate are both null and client is not paused', () => {
    expect(
      deriveClientStatus(
        { pausedSince: null, sub: makeSub({ startDate: null, contractEndDate: null }) },
        TODAY,
      ),
    ).toBe('future');
  });

  // --- suspended ---
  it('returns suspended when today is in suspendedDates', () => {
    expect(
      deriveClientStatus({ pausedSince: null, sub: makeSub({ suspendedDates: [TODAY] }) }, TODAY),
    ).toBe('suspended');
  });

  // --- expiring ---
  it('returns expiring when contractEndDate is within the threshold', () => {
    expect(
      deriveClientStatus(
        { pausedSince: null, sub: makeSub({ contractEndDate: '2026-06-12' }) },
        TODAY,
      ),
    ).toBe('expiring');
  });

  // --- active ---
  it('returns expiring (not ended) when contractEndDate is today — last delivery day is still within threshold', () => {
    expect(
      deriveClientStatus({ pausedSince: null, sub: makeSub({ contractEndDate: TODAY }) }, TODAY),
    ).toBe('expiring');
  });

  it('returns active for a normal in-progress subscription', () => {
    expect(deriveClientStatus({ pausedSince: null, sub: makeSub() }, TODAY)).toBe('active');
  });
});
