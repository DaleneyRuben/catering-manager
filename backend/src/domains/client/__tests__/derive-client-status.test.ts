import { deriveClientStatus } from '../derive-client-status';

const TODAY = '2026-06-10';

const makeSub = (overrides = {}) => ({
  startDate: '2026-05-01' as string | null,
  contractEndDate: '2026-07-01' as string | null,
  suspendedDates: [] as string[],
  finalizedAt: null as string | null,
  pausedSince: null as Date | null,
  ...overrides,
});

describe('deriveClientStatus', () => {
  // --- ended ---
  it('returns ended when there is no subscription', () => {
    expect(deriveClientStatus(null, TODAY)).toBe('ended');
  });

  it('returns ended when contractEndDate is null but startDate is in the past (orphaned subscription)', () => {
    expect(
      deriveClientStatus(makeSub({ contractEndDate: null, startDate: '2026-05-01' }), TODAY),
    ).toBe('ended');
  });

  it('returns ended when finalizedAt is set even if contractEndDate is today', () => {
    expect(deriveClientStatus(makeSub({ contractEndDate: TODAY, finalizedAt: TODAY }), TODAY)).toBe(
      'ended',
    );
  });

  it('returns ended when contractEndDate was yesterday', () => {
    expect(deriveClientStatus(makeSub({ contractEndDate: '2026-06-09' }), TODAY)).toBe('ended');
  });

  it('returns ended when contractEndDate is in the past', () => {
    expect(deriveClientStatus(makeSub({ contractEndDate: '2026-06-01' }), TODAY)).toBe('ended');
  });

  it('ended takes precedence over pausedSince', () => {
    expect(
      deriveClientStatus(
        makeSub({ pausedSince: new Date('2026-06-05'), contractEndDate: '2026-06-08' }),
        TODAY,
      ),
    ).toBe('ended');
  });

  // --- paused ---
  // pausedSince now belongs to the subscription, so it describes THAT plan rather than the
  // client as a whole — which is what lets a running plan outlive a paused sin-fecha renewal.
  it('returns paused when the subscription itself is paused', () => {
    expect(deriveClientStatus(makeSub({ pausedSince: new Date('2026-06-05') }), TODAY)).toBe(
      'paused',
    );
  });

  it('returns paused for a sin-fecha renewal (null dates, pausedSince set)', () => {
    expect(
      deriveClientStatus(
        makeSub({
          pausedSince: new Date('2026-06-10'),
          startDate: null,
          contractEndDate: null,
        }),
        TODAY,
      ),
    ).toBe('paused');
  });

  it('paused takes precedence over future start date', () => {
    expect(
      deriveClientStatus(makeSub({ pausedSince: new Date(), startDate: '2026-06-15' }), TODAY),
    ).toBe('paused');
  });

  // --- future ---
  it('returns future when startDate is after today and the plan is not paused', () => {
    expect(deriveClientStatus(makeSub({ startDate: '2026-06-15' }), TODAY)).toBe('future');
  });

  it('returns future when startDate and contractEndDate are both null and the plan is not paused', () => {
    expect(deriveClientStatus(makeSub({ startDate: null, contractEndDate: null }), TODAY)).toBe(
      'future',
    );
  });

  // --- suspended ---
  it('returns suspended when today is in suspendedDates', () => {
    expect(deriveClientStatus(makeSub({ suspendedDates: [TODAY] }), TODAY)).toBe('suspended');
  });

  // --- expiring ---
  it('returns expiring when contractEndDate is within the threshold', () => {
    expect(deriveClientStatus(makeSub({ contractEndDate: '2026-06-12' }), TODAY)).toBe('expiring');
  });

  it('returns expiring when contractEndDate is exactly on the threshold day (Wed Jun 10 + 5 bd = Wed Jun 17)', () => {
    // EXPIRY_THRESHOLD_DAYS=5; addBusinessDays('2026-06-10', 5) = '2026-06-17'
    expect(deriveClientStatus(makeSub({ contractEndDate: '2026-06-17' }), TODAY)).toBe('expiring');
  });

  // --- active ---
  it('returns expiring (not ended) when contractEndDate is today — last delivery day is still within threshold', () => {
    expect(deriveClientStatus(makeSub({ contractEndDate: TODAY }), TODAY)).toBe('expiring');
  });

  it('returns active when contractEndDate is 1 business day past the threshold (Thu Jun 18)', () => {
    // '2026-06-18' > '2026-06-17' (threshold) → active
    expect(deriveClientStatus(makeSub({ contractEndDate: '2026-06-18' }), TODAY)).toBe('active');
  });

  it('returns active for a normal in-progress subscription', () => {
    expect(deriveClientStatus(makeSub(), TODAY)).toBe('active');
  });
});
