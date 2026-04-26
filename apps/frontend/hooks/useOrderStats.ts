import { useQuery } from '@tanstack/react-query';
import type { OrderStats } from '@repo/shared';
import { request } from '@/lib/axios';
import { ORDERS_QUERY_KEY } from './useOrders';

export const ORDER_STATS_KEY = [...ORDERS_QUERY_KEY, 'stats'] as const;

export function useOrderStats() {
  return useQuery({
    queryKey: ORDER_STATS_KEY,
    queryFn: () => request<OrderStats>('/production-orders/stats'),
    refetchInterval: 30_000,
  });
}
