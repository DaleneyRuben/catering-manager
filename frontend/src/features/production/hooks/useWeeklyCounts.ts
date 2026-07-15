import type { WeeklyCounts } from '@/features/production/types';

export function useWeeklyCounts(_offset: number): {
  weeklyCounts: WeeklyCounts | null;
  isLoading: boolean;
  error: unknown;
} {
  throw new Error('not implemented');
}
