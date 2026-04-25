import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/axios';
import type { RescheduleProposal } from '@repo/shared';

export const CONFLICTS_COUNT_KEY = ['conflicts-count'] as const;

export function useConflictsCount() {
  return useQuery({
    queryKey: CONFLICTS_COUNT_KEY,
    queryFn: () => request<RescheduleProposal[]>('/production-orders/conflicts/reschedules'),
    select: (data) => data.length,
    staleTime: 30_000,
  });
}
