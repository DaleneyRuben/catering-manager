import type { DayClients } from '@/features/production/types';

export function useProductionDay(_date: string | null): {
  dayClients: DayClients | null;
  isLoading: boolean;
  error: unknown;
} {
  throw new Error('not implemented');
}
