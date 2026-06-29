import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { DeliveryRouteResponse } from '@/features/delivery/types';

export function useDeliveryRoute() {
  const query = useQuery({
    queryKey: ['delivery'],
    queryFn: (): Promise<DeliveryRouteResponse> => api.get<DeliveryRouteResponse>('/delivery'),
  });

  const dates = query.data ? Object.keys(query.data) : [];
  const [todayDate, tomorrowDate] = dates;

  return {
    todayDate,
    tomorrowDate,
    today: todayDate ? query.data?.[todayDate] : undefined,
    tomorrow: tomorrowDate ? query.data?.[tomorrowDate] : undefined,
    isLoading: query.isLoading,
  };
}
