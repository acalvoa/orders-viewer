import { insertInterval } from './insert-interval';

describe('insertInterval', () => {
  it('inserts into an empty array', () => {
    const arr: { startMs: number; endMs: number }[] = [];
    insertInterval(arr, 10, 20);
    expect(arr).toEqual([{ startMs: 10, endMs: 20 }]);
  });

  it('inserts at the beginning when new start is smallest', () => {
    const arr = [{ startMs: 20, endMs: 30 }, { startMs: 40, endMs: 50 }];
    insertInterval(arr, 5, 15);
    expect(arr[0]).toEqual({ startMs: 5, endMs: 15 });
    expect(arr).toHaveLength(3);
  });

  it('inserts at the end when new start is largest', () => {
    const arr = [{ startMs: 10, endMs: 20 }, { startMs: 30, endMs: 40 }];
    insertInterval(arr, 50, 60);
    expect(arr[arr.length - 1]).toEqual({ startMs: 50, endMs: 60 });
    expect(arr).toHaveLength(3);
  });

  it('inserts in the middle in sorted order', () => {
    const arr = [{ startMs: 10, endMs: 20 }, { startMs: 40, endMs: 50 }];
    insertInterval(arr, 25, 35);
    expect(arr).toEqual([
      { startMs: 10, endMs: 20 },
      { startMs: 25, endMs: 35 },
      { startMs: 40, endMs: 50 },
    ]);
  });

  it('preserves sort order when inserting equal startMs (inserts after existing equal)', () => {
    const arr = [{ startMs: 10, endMs: 20 }];
    insertInterval(arr, 10, 30);
    // binary search: startMs(10) < 10 is false → hi=0 → inserts at 0 (before existing)
    expect(arr[0]).toEqual({ startMs: 10, endMs: 30 });
    expect(arr[1]).toEqual({ startMs: 10, endMs: 20 });
  });

  it('preserves the endMs value correctly', () => {
    const arr: { startMs: number; endMs: number }[] = [];
    insertInterval(arr, 100, 999);
    expect(arr[0]!.endMs).toBe(999);
  });
});
