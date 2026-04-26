import { firstEndingAfter } from './first-ending-after';

const iv = (startMs: number, endMs: number) => ({ startMs, endMs });

describe('firstEndingAfter', () => {
  it('returns 0 for empty array', () => {
    expect(firstEndingAfter([], 1000)).toBe(0);
  });

  it('returns 0 when all intervals end after start', () => {
    const intervals = [iv(0, 10), iv(20, 30), iv(40, 50)];
    expect(firstEndingAfter(intervals, 5)).toBe(0);
  });

  it('returns length when all intervals end at or before start', () => {
    const intervals = [iv(0, 10), iv(20, 30), iv(40, 50)];
    expect(firstEndingAfter(intervals, 50)).toBe(3);
  });

  it('returns the correct mid-array index', () => {
    const intervals = [iv(0, 10), iv(20, 30), iv(40, 50)];
    // endMs <= 30 at index 0 (end=10) and index 1 (end=30) → lo moves past both
    expect(firstEndingAfter(intervals, 30)).toBe(2);
  });

  it('treats endMs === start as "not after" (boundary is exclusive)', () => {
    const intervals = [iv(0, 100)];
    // endMs(100) <= start(100) → lo advances past it → returns 1
    expect(firstEndingAfter(intervals, 100)).toBe(1);
  });

  it('treats endMs === start + 1 as "ending after"', () => {
    const intervals = [iv(0, 101)];
    expect(firstEndingAfter(intervals, 100)).toBe(0);
  });

  it('handles single-element array where interval ends after start', () => {
    expect(firstEndingAfter([iv(5, 15)], 10)).toBe(0);
  });

  it('handles single-element array where interval ends before start', () => {
    expect(firstEndingAfter([iv(5, 15)], 20)).toBe(1);
  });
});
