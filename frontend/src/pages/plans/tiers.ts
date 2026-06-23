export type PlanTier = 'basic' | 'mid' | 'premium';

export const TIER_STYLES: Record<PlanTier, { band: string; bandBorder: string }> = {
  basic: { band: 'var(--color-olive-50)', bandBorder: 'var(--color-tier-basic-border)' },
  mid: { band: 'var(--color-tier-mid-bg)', bandBorder: 'var(--color-tier-mid-border)' },
  premium: {
    band: 'var(--color-tier-premium-bg)',
    bandBorder: 'var(--color-tier-premium-border)',
  },
};

export function getPlanTier(price: number, allPrices: number[]): PlanTier {
  const sorted = [...allPrices].sort((a, b) => a - b);
  const index = sorted.indexOf(price);
  const fraction = sorted.length <= 1 ? 0 : index / (sorted.length - 1);
  if (fraction < 1 / 3) return 'basic';
  if (fraction < 2 / 3) return 'mid';
  return 'premium';
}
