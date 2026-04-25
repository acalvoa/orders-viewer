import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/axios';
import { ORDERS_QUERY_KEY } from './useOrders';
import { CONFLICTS_COUNT_KEY } from './useConflictsCount';

async function deleteOrder(id: string): Promise<void> {
  return request<void>(`/production-orders/${id}`, { method: 'DELETE' });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONFLICTS_COUNT_KEY });
    },
  });
}
