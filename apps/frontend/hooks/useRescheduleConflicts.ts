import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/axios';
import { ORDERS_QUERY_KEY } from './useOrders';
import { CONFLICTS_COUNT_KEY } from './useConflictsCount';

async function rescheduleConflicts(): Promise<{ rescheduled: number }> {
  return request<{ rescheduled: number }>(
    '/production-orders/conflicts/reschedules',
    { method: 'POST' },
  );
}

export function useRescheduleConflicts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rescheduleConflicts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONFLICTS_COUNT_KEY });
    },
  });
}
