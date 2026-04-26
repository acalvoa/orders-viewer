import type { Interval } from '../../interfaces/interval.interface';

export function insertInterval(intervals: Array<Interval>, startMs: number, endMs: number): void {
  let lo = 0;
  let hi = intervals.length;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (intervals[mid].startMs < startMs) lo = mid + 1;
    else hi = mid;
  }

  intervals.splice(lo, 0, { startMs, endMs });
}
