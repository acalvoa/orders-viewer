import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductionOrder, CreateProductionOrderDto } from '@repo/shared';
import { request } from '@/lib/axios';
import { ORDERS_QUERY_KEY } from './useOrders';
import { CONFLICTS_COUNT_KEY } from './useConflictsCount';

async function createOrder(data: CreateProductionOrderDto): Promise<ProductionOrder> {
  return request<ProductionOrder>('/production-orders', {
    method: 'POST',
    data,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONFLICTS_COUNT_KEY });
    },
  });
}
