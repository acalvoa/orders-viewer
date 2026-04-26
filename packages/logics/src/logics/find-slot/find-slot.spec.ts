import { findSlot } from './find-slot';

const iv = (startMs: number, endMs: number) => ({ startMs, endMs });

describe('findSlot', () => {
  it('returns from when no intervals exist', () => {
    expect(findSlot([], 100, 50)).toBe(100);
  });

  it('returns from when duration fits before the first interval', () => {
    // from=0, duration=50 → end=50, interval starts at 100 → fits
    expect(findSlot([iv(100, 200)], 0, 50)).toBe(0);
  });

  it('returns from when duration fits exactly up to the first interval start', () => {
    // from=50, duration=50 → end=100, interval starts at 100 → fits (touching)
    expect(findSlot([iv(100, 200)], 50, 50)).toBe(50);
  });

  it('returns end of first interval when duration does not fit before it', () => {
    // from=60, duration=50 → end=110, interval(100–200) starts before end → blocked → s=200
    expect(findSlot([iv(100, 200)], 60, 50)).toBe(200);
  });

  it('skips multiple consecutive intervals until a gap fits', () => {
    // intervals: 0–10, 10–20, 20–30. duration=5, from=0.
    // Each interval blocks until s=30 → fits after last one.
    expect(findSlot([iv(0, 10), iv(10, 20), iv(20, 30)], 0, 5)).toBe(30);
  });

  it('places into a gap between two intervals when it fits', () => {
    // intervals: 0–10, 20–30. duration=5, from=0.
    // 0–10 blocks → s=10; gap 10–20 is 10 wide, 5 fits → return 10
    expect(findSlot([iv(0, 10), iv(20, 30)], 0, 5)).toBe(10);
  });

  it('skips a gap that is too narrow and uses the next one', () => {
    // intervals: 0–10, 12–30. duration=5, from=0.
    // 0–10 blocks → s=10; gap 10–12 is 2 wide, 5 does not fit (10+5=15 > 12) → s=30 → fits
    expect(findSlot([iv(0, 10), iv(12, 30)], 0, 5)).toBe(30);
  });

  it('returns from when intervals all end before from', () => {
    // from=100, all intervals end before 100 → firstEndingAfter returns length → loop skips
    expect(findSlot([iv(0, 10), iv(20, 30)], 100, 50)).toBe(100);
  });

  it('handles from inside an interval (slot starts at interval end)', () => {
    // from=5, duration=10, interval 0–20 covers from → end=20 → s=20
    expect(findSlot([iv(0, 20)], 5, 10)).toBe(20);
  });
});
