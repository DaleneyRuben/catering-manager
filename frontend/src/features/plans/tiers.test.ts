import { getPlanTier, TIER_STYLES } from '@/features/plans/tiers';

describe('getPlanTier', () => {
  it('classifies the cheapest plans as basic', () => {
    expect(getPlanTier(100, [100, 200, 300, 400, 500, 600])).toBe('basic');
  });

  it('classifies mid-priced plans as mid', () => {
    expect(getPlanTier(300, [100, 200, 300, 400, 500, 600])).toBe('mid');
  });

  it('classifies the most expensive plans as premium', () => {
    expect(getPlanTier(600, [100, 200, 300, 400, 500, 600])).toBe('premium');
  });

  it('classifies a single plan as basic', () => {
    expect(getPlanTier(500, [500])).toBe('basic');
  });

  it('classifies two plans as basic and premium', () => {
    expect(getPlanTier(100, [100, 900])).toBe('basic');
    expect(getPlanTier(900, [100, 900])).toBe('premium');
  });
});

describe('TIER_STYLES', () => {
  it('has band colors for all three tiers', () => {
    expect(TIER_STYLES.basic.band).toBeTruthy();
    expect(TIER_STYLES.mid.band).toBeTruthy();
    expect(TIER_STYLES.premium.band).toBeTruthy();
  });
});
