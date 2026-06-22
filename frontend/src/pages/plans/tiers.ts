export type PlanTier = 'basic' | 'mid' | 'premium';

export const TIER_STYLES: Record<PlanTier, { band: string; bandBorder: string }> = {
  basic: { band: '#f3f6ec', bandBorder: '#e4e8d6' },
  mid: { band: '#eaf0dd', bandBorder: '#d7e1bd' },
  premium: { band: '#e0e9cb', bandBorder: '#c9d8a4' },
};

export function getPlanTier(price: number, allPrices: number[]): PlanTier {
  const sorted = [...allPrices].sort((a, b) => a - b);
  const index = sorted.indexOf(price);
  const fraction = sorted.length <= 1 ? 0 : index / (sorted.length - 1);
  if (fraction < 1 / 3) return 'basic';
  if (fraction < 2 / 3) return 'mid';
  return 'premium';
}
