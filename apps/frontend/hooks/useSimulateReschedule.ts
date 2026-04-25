import { useQuery } from '@tanstack/react-query';
import type { RescheduleProposal } from '@repo/shared';
import { request } from '@/lib/axios';

async function simulateReschedule(): Promise<RescheduleProposal[]> {
  return request<RescheduleProposal[]>('/production-orders/conflicts/reschedules');
}

export function useSimulateReschedule() {
  return useQuery({
    queryKey: ['simulate-reschedule'],
    queryFn: simulateReschedule,
    enabled: false,
    staleTime: 0,
    gcTime: 0,
  });
}
