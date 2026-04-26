import type { RescheduleProposal } from '@repo/shared';
import { MS_PER_DAY, msToDateString } from '@repo/shared';
import type { Interval } from '../../interfaces/interval.interface';
import type { OrderDateRange } from '../../interfaces/order-date-range.interface';
import { findSlot } from '../find-slot/find-slot';
import { insertInterval } from '../insert-interval/insert-interval';

export function resolveConflicts(orders: OrderDateRange[]): RescheduleProposal[] {
  if (orders.length < 2) return [];

  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const placed: Array<Interval> = [];
  const proposals: RescheduleProposal[] = [];

  for (const order of sorted) {
    const originalStart = new Date(order.startDate).getTime();
    const originalEnd   = new Date(order.endDate).getTime();
    const duration      = originalEnd - originalStart || MS_PER_DAY;

    const proposedStart = findSlot(placed, originalStart, duration);
    const proposedEnd   = proposedStart + duration;

    insertInterval(placed, proposedStart, proposedEnd);

    if (proposedStart !== originalStart || proposedEnd !== originalEnd) {
      proposals.push({
        id:               order.id,
        reference:        order.reference,
        product:          order.product,
        quantity:         order.quantity,
        status:           order.status,
        currentStartDate: order.startDate,
        currentEndDate:   order.endDate,
        proposedStartDate: msToDateString(proposedStart),
        proposedEndDate:   msToDateString(proposedEnd),
      });
    }
  }

  return proposals;
}
