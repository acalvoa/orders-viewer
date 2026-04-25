import { useQuery } from '@tanstack/react-query';
import type { ProductionOrder, Paginated } from '@repo/shared';
import { request } from '@/lib/axios';

export const ORDERS_QUERY_KEY = ['orders'] as const;

export interface OrdersParams {
  page: number;
  size: number;
}

async function getOrders(params: OrdersParams): Promise<Paginated<ProductionOrder>> {
  return request<Paginated<ProductionOrder>>(
    `/production-orders?page=${params.page}&size=${params.size}`,
  );
}

export function useOrders(params: OrdersParams) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, params],
    queryFn: () => getOrders(params),
  });
}
