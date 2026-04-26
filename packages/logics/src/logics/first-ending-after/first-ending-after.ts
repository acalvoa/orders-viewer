import type { Interval } from '../../interfaces/interval.interface';

export function firstEndingAfter(intervals: ReadonlyArray<Interval>, start: number): number {
  let lo = 0;
  let hi = intervals.length;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (intervals[mid].endMs <= start) lo = mid + 1;
    else hi = mid;
  }

  return lo;
}
