import type { RescheduleProposal } from '@repo/shared';
import type { OrderDateRange } from '../interfaces/order-date-range.interface';
import type { Interval } from '../interfaces/interval.interface';
import { MS_PER_DAY, msToDateString } from '@repo/shared';

/**
 * Binary search: index of the first interval whose endMs > start.
 * Valid because placed intervals are non-overlapping and sorted by startMs,
 * which makes endMs strictly increasing as well.
 */
function firstEndingAfter(intervals: ReadonlyArray<Interval>, start: number): number {
  let lo = 0;
  let hi = intervals.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (intervals[mid]!.endMs <= start) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Return the earliest start >= `from` where [start, start+duration) fits
 * without overlapping any placed interval.
 *
 * Because placed intervals are sorted and non-overlapping, once we push `s`
 * past interval[idx].endMs we only need to check the next index — no
 * second binary-search needed.
 */
function findSlot(intervals: ReadonlyArray<Interval>, from: number, duration: number): number {
  let s = from;
  let idx = firstEndingAfter(intervals, s);
  while (idx < intervals.length) {
    const e = s + duration;
    const iv = intervals[idx]!;
    if (iv.startMs >= e) break; // gap is wide enough
    s = iv.endMs;               // push past this interval
    idx++;
  }
  return s;
}

/** Binary-search insert maintaining sorted order by startMs. */
function insertInterval(intervals: Array<Interval>, startMs: number, endMs: number): void {
  let lo = 0;
  let hi = intervals.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (intervals[mid]!.startMs < startMs) lo = mid + 1;
    else hi = mid;
  }
  intervals.splice(lo, 0, { startMs, endMs });
}

/**
 * Greedy interval scheduling with priority by createdAt (oldest = highest priority).
 *
 * Each order is placed at its original slot when possible; if that slot is
 * already occupied it is pushed to the next clear position.  Because all
 * displacements—including cascading ones—are returned as proposals, a single
 * run always produces a fully conflict-free schedule.
 */
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
