import type { Interval } from '../../interfaces/interval.interface';
import { firstEndingAfter } from '../first-ending-after/first-ending-after';

export function findSlot(intervals: ReadonlyArray<Interval>, from: number, duration: number): number {
  let s = from;
  let idx = firstEndingAfter(intervals, s);

  while (idx < intervals.length) {
    const e = s + duration;
    const iv = intervals[idx]!;
    if (iv.startMs >= e) break;
    s = iv.endMs;
    idx++;
  }

  return s;
}
