import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductionOrder, UpdateProductionOrderDto } from '@repo/shared';
import { request } from '@/lib/axios';
import { ORDERS_QUERY_KEY } from './useOrders';
import { CONFLICTS_COUNT_KEY } from './useConflictsCount';

async function updateOrder(id: string, data: UpdateProductionOrderDto): Promise<ProductionOrder> {
  return request<ProductionOrder>(`/production-orders/${id}`, {
    method: 'PATCH',
    data,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductionOrderDto }) =>
      updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONFLICTS_COUNT_KEY });
    },
  });
}
