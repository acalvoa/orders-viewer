import { resolveConflicts } from './conflict-resolver.util';

const order = (
  id: string,
  product: string,
  startDate: string,
  endDate: string,
  createdAt = '2024-01-01T00:00:00',
) => ({ id, product, startDate, endDate, createdAt });

describe('resolveConflicts', () => {
  it('returns empty array when fewer than 2 orders', () => {
    expect(resolveConflicts([])).toEqual([]);
    expect(resolveConflicts([order('a', 'X', '2025-01-01T08:00:00', '2025-01-10T08:00:00')])).toEqual([]);
  });

  it('returns empty array when no orders overlap', () => {
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T08:00:00', '2025-01-10T08:00:00'),
      order('b', 'X', '2025-01-11T08:00:00', '2025-01-20T08:00:00'),
    ]);
    expect(result).toEqual([]);
  });

  it('reschedules the second order when two orders overlap', () => {
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T08:00:00', '2025-01-15T08:00:00'),
      order('b', 'X', '2025-01-10T08:00:00', '2025-01-20T08:00:00'),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('b');
    expect(result[0]!.proposedStartDate).toBe('2025-01-15T08:00:00');
  });

  it('chains multiple overlapping orders sequentially', () => {
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00'), // 4 days
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-08T00:00:00'), // 5 days — overlaps a
      order('c', 'X', '2025-01-06T00:00:00', '2025-01-10T00:00:00'), // 4 days — overlaps b
    ]);

    const ids = result.map((p) => p.id);
    expect(ids).toContain('b');
    expect(ids).toContain('c');

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-05T00:00:00'); // starts right after a ends

    const c = result.find((p) => p.id === 'c')!;
    expect(c.proposedStartDate).toBe(b.proposedEndDate); // starts right after b ends
  });

  it('handles two independent conflict groups independently', () => {
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-10T00:00:00'),
      order('b', 'X', '2025-01-05T00:00:00', '2025-01-15T00:00:00'), // conflicts with a
      order('x', 'Y', '2025-02-01T00:00:00', '2025-02-10T00:00:00'),
      order('y', 'Y', '2025-02-05T00:00:00', '2025-02-15T00:00:00'), // conflicts with x
    ]);

    const ids = result.map((p) => p.id);
    expect(ids).toContain('b');
    expect(ids).toContain('y');
    expect(ids).not.toContain('a');
    expect(ids).not.toContain('x');
  });

  it('preserves currentStartDate and currentEndDate from the original order', () => {
    const start = '2025-01-10T09:30:00';
    const end = '2025-01-20T09:30:00';
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-15T00:00:00'),
      order('b', 'X', start, end),
    ]);

    const b = result.find((p) => p.id === 'b')!;
    expect(b.currentStartDate).toBe(start);
    expect(b.currentEndDate).toBe(end);
  });

  it('does not include orders whose dates are unchanged', () => {
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-10T00:00:00'),
      order('b', 'X', '2025-01-05T00:00:00', '2025-01-15T00:00:00'),
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();
  });

  it('flags conflict between orders for different products when date ranges overlap', () => {
    const result = resolveConflicts([
      order('a', 'Widget-A', '2025-01-01T00:00:00', '2025-01-15T00:00:00'),
      order('b', 'Widget-B', '2025-01-01T00:00:00', '2025-01-15T00:00:00'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('b');
  });
});

describe('spec: sequential rescheduling prioritized by ascending createdAt', () => {
  it('gives the first slot to the order with the oldest createdAt, regardless of startDate order', () => {
    // A: created earlier, starts later. B: created later, starts earlier.
    // Priority = createdAt → A must occupy the anchor slot, B follows.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-10T00:00:00', '2025-01-20T00:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-05T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
    ]);

    // anchor = min(Jan 10, Jan 5) = Jan 5
    const a = result.find((p) => p.id === 'a')!;
    const b = result.find((p) => p.id === 'b')!;

    expect(a.proposedStartDate).toBe('2025-01-05T00:00:00'); // A gets anchor
    expect(b.proposedStartDate).toBe(a.proposedEndDate);     // B immediately after A
  });

  it('preserves the original duration of each order after rescheduling', () => {
    // A: 5 days, B: 3 days — both must keep their exact duration
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-06T00:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-06T00:00:00', '2025-01-02T00:00:00'),
    ]);

    const b = result.find((p) => p.id === 'b')!;
    const rescheduledMs = new Date(b.proposedEndDate).getTime() - new Date(b.proposedStartDate).getTime();
    const originalMs    = new Date('2025-01-06T00:00:00').getTime() - new Date('2025-01-03T00:00:00').getTime();

    expect(rescheduledMs).toBe(originalMs);
  });

  it('places each order immediately after the previous with no gap', () => {
    // Three overlapping orders. A is oldest → anchor; B and C follow in createdAt order.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-08T00:00:00', '2025-01-01T00:00:00'), // 7 days
      order('b', 'X', '2025-01-05T00:00:00', '2025-01-10T00:00:00', '2025-01-02T00:00:00'), // 5 days
      order('c', 'X', '2025-01-07T00:00:00', '2025-01-13T00:00:00', '2025-01-03T00:00:00'), // 6 days
    ]);

    // A is unchanged (already at anchor Jan 1-8), so it has no proposal
    const b = result.find((p) => p.id === 'b')!;
    const c = result.find((p) => p.id === 'c')!;

    expect(b.proposedStartDate).toBe('2025-01-08T00:00:00'); // right after A's original end
    expect(c.proposedStartDate).toBe(b.proposedEndDate);     // right after B's new end
  });

  it('anchors the block at the group earliest startDate, not the oldest-createdAt order own startDate', () => {
    // C is the oldest by createdAt but has the latest startDate.
    // The block must start at Jan 3 (B's startDate), not Jan 8 (C's startDate).
    const result = resolveConflicts([
      order('a', 'X', '2025-01-05T00:00:00', '2025-01-10T00:00:00', '2025-01-02T00:00:00'),
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-12T00:00:00', '2025-01-03T00:00:00'),
      order('c', 'X', '2025-01-08T00:00:00', '2025-01-15T00:00:00', '2025-01-01T00:00:00'),
    ]);

    // anchor = min(Jan 5, Jan 3, Jan 8) = Jan 3
    // c (oldest createdAt) → proposed Jan 3
    const c = result.find((p) => p.id === 'c')!;
    expect(c.proposedStartDate).toBe('2025-01-03T00:00:00');
  });

  it('omits from proposals the order that lands unchanged after createdAt-sorted scheduling', () => {
    // A is the oldest and already sits at the anchor — no date change needed
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-10T00:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-05T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();
    expect(result.find((p) => p.id === 'b')).toBeDefined();
  });

  it('handles three orders where createdAt order differs from startDate order', () => {
    // createdAt: C < A < B  —  startDate: A < B < C
    // Expected scheduling order: C, A, B
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-02T00:00:00'), // 4 days
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-09T00:00:00', '2025-01-03T00:00:00'), // 6 days
      order('c', 'X', '2025-01-06T00:00:00', '2025-01-10T00:00:00', '2025-01-01T00:00:00'), // 4 days — oldest
    ]);

    // anchor = Jan 1 (A's startDate)
    // Schedule: C (oldest) → Jan 1–5, A → Jan 5–9, B → Jan 9–15
    const a = result.find((p) => p.id === 'a')!;
    const b = result.find((p) => p.id === 'b')!;
    const c = result.find((p) => p.id === 'c')!;

    expect(c.proposedStartDate).toBe('2025-01-01T00:00:00');
    expect(a.proposedStartDate).toBe(c.proposedEndDate);
    expect(b.proposedStartDate).toBe(a.proposedEndDate);
  });
});

describe('non-midnight times', () => {
  it('detects overlap and reschedules when orders share intra-day time ranges', () => {
    // A: Jan 1 08:00 → Jan 5 16:00 (4d 8h). B: Jan 3 10:00 → Jan 8 14:00 (5d 4h).
    // A is older and already at the anchor — only B should be rescheduled.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T08:00:00', '2025-01-05T16:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-03T10:00:00', '2025-01-08T14:00:00', '2025-01-02T00:00:00'),
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-05T16:00:00'); // cursor = A's end
    expect(b.proposedEndDate).toBe('2025-01-10T20:00:00');   // + 5d4h original duration
  });

  it('does not flag as conflict when one order ends exactly as another begins (non-midnight boundary)', () => {
    // endA === startB → the strict inequality endA > startB is false → no overlap
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T14:30:00'),
      order('b', 'X', '2025-01-05T14:30:00', '2025-01-10T00:00:00'),
    ]);

    expect(result).toEqual([]);
  });

  it('preserves duration down to the minute after rescheduling with non-midnight times', () => {
    // A: Jan 1 09:00 → Jan 3 15:30 (2d 6h 30m). B: Jan 2 11:00 → Jan 5 18:00 (3d 7h).
    // A unchanged; B rescheduled from cursor Jan 3 15:30 → end Jan 6 22:30.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T09:00:00', '2025-01-03T15:30:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-02T11:00:00', '2025-01-05T18:00:00', '2025-01-02T00:00:00'),
    ]);

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-03T15:30:00');
    expect(b.proposedEndDate).toBe('2025-01-06T22:30:00');

    const rescheduledMs = new Date(b.proposedEndDate).getTime() - new Date(b.proposedStartDate).getTime();
    const originalMs    = new Date('2025-01-05T18:00:00').getTime() - new Date('2025-01-02T11:00:00').getTime();
    expect(rescheduledMs).toBe(originalMs);
  });

  it('respects createdAt priority expressed with non-midnight timestamps', () => {
    // A: created at 06:00, starts later (Jan 10 09:00). B: created at 14:30, starts earlier (Jan 5 14:00).
    // Priority → A occupies the anchor (Jan 5 14:00), B follows.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-10T09:00:00', '2025-01-15T17:00:00', '2025-01-01T06:00:00'), // 5d 8h
      order('b', 'X', '2025-01-05T14:00:00', '2025-01-12T18:00:00', '2025-01-02T14:30:00'), // 7d 4h
    ]);

    // anchor = min(Jan 10 09:00, Jan 5 14:00) = Jan 5 14:00
    // A (createdAt 06:00) → Jan 5 14:00 to Jan 10 22:00 (+5d8h)
    // B (createdAt 14:30) → Jan 10 22:00 to Jan 18 02:00 (+7d4h)
    const a = result.find((p) => p.id === 'a')!;
    const b = result.find((p) => p.id === 'b')!;

    expect(a.proposedStartDate).toBe('2025-01-05T14:00:00');
    expect(a.proposedEndDate).toBe('2025-01-10T22:00:00');
    expect(b.proposedStartDate).toBe('2025-01-10T22:00:00');
    expect(b.proposedEndDate).toBe('2025-01-18T02:00:00');
  });

  it('chains three orders with mixed intra-day times in createdAt order', () => {
    // createdAt: B < C < A — so scheduling order is B, C, A
    // All three overlap; anchor = Jan 2 07:00 (B's startDate, the earliest)
    const result = resolveConflicts([
      order('a', 'X', '2025-01-04T06:00:00', '2025-01-07T18:00:00', '2025-01-03T12:00:00'), // 3d 12h, createdAt last
      order('b', 'X', '2025-01-02T07:00:00', '2025-01-05T13:00:00', '2025-01-01T08:00:00'), // 3d 6h, createdAt first
      order('c', 'X', '2025-01-03T09:00:00', '2025-01-06T21:00:00', '2025-01-02T16:00:00'), // 3d 12h, createdAt second
    ]);

    // Scheduling: B (anchor Jan 2 07:00) → Jan 2 07:00 + 3d6h = Jan 5 13:00
    //             C → Jan 5 13:00 + 3d12h = Jan 9 01:00
    //             A → Jan 9 01:00 + 3d12h = Jan 12 13:00
    const b = result.find((p) => p.id === 'b');
    const c = result.find((p) => p.id === 'c')!;
    const a = result.find((p) => p.id === 'a')!;

    // B is already at the anchor with unchanged dates → no proposal
    expect(b).toBeUndefined();
    expect(c.proposedStartDate).toBe('2025-01-05T13:00:00');
    expect(c.proposedEndDate).toBe('2025-01-09T01:00:00');
    expect(a.proposedStartDate).toBe('2025-01-09T01:00:00');
    expect(a.proposedEndDate).toBe('2025-01-12T13:00:00');
  });
});

describe('sub-day slot rescheduling', () => {
  it('reschedules a 2-hour order to the next 2-hour slot when its window is taken', () => {
    // A occupies 08:00–10:00; B tries the same window → B moves to 10:00–12:00
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T08:00:00', '2025-01-01T10:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-01T09:00:00', '2025-01-01T11:00:00', '2025-01-01T01:00:00'),
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-01T10:00:00');
    expect(b.proposedEndDate).toBe('2025-01-01T12:00:00');
  });

  it('chains three 2-hour orders that all start at the same time within the same day', () => {
    // All three claim 08:00–10:00 → they get 08–10, 10–12, 12–14
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T08:00:00', '2025-01-01T10:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-01T08:00:00', '2025-01-01T10:00:00', '2025-01-01T01:00:00'),
      order('c', 'X', '2025-01-01T08:00:00', '2025-01-01T10:00:00', '2025-01-01T02:00:00'),
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined(); // oldest stays at anchor

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-01T10:00:00');
    expect(b.proposedEndDate).toBe('2025-01-01T12:00:00');

    const c = result.find((p) => p.id === 'c')!;
    expect(c.proposedStartDate).toBe('2025-01-01T12:00:00');
    expect(c.proposedEndDate).toBe('2025-01-01T14:00:00');
  });

  it('preserves 30-minute duration and moves to the next 30-minute slot', () => {
    // A: 09:00–09:30. B: 09:15–09:45 → B moves to 09:30–10:00
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T09:00:00', '2025-01-01T09:30:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-01T09:15:00', '2025-01-01T09:45:00', '2025-01-01T01:00:00'),
    ]);

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-01T09:30:00');
    expect(b.proposedEndDate).toBe('2025-01-01T10:00:00');

    const rescheduledMs = new Date(b.proposedEndDate).getTime() - new Date(b.proposedStartDate).getTime();
    expect(rescheduledMs).toBe(30 * 60 * 1000); // 30 min preserved
  });

  it('handles mixed durations: 2-hour and 4-hour orders overlapping intra-day', () => {
    // A: 08:00–10:00 (2h). B: 09:00–13:00 (4h) → B moves to 10:00–14:00
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T08:00:00', '2025-01-01T10:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-01T09:00:00', '2025-01-01T13:00:00', '2025-01-01T01:00:00'),
    ]);

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-01T10:00:00');
    expect(b.proposedEndDate).toBe('2025-01-01T14:00:00');

    const rescheduledMs = new Date(b.proposedEndDate).getTime() - new Date(b.proposedStartDate).getTime();
    expect(rescheduledMs).toBe(4 * 60 * 60 * 1000); // 4h preserved
  });

  it('reschedules into the next day when the last intra-day slot pushes past midnight', () => {
    // A: 22:00–23:00 (1h). B: 22:30–23:30 (1h) → B moves to 23:00–00:00+1
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T22:00:00', '2025-01-01T23:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-01T22:30:00', '2025-01-01T23:30:00', '2025-01-01T01:00:00'),
    ]);

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-01T23:00:00');
    expect(b.proposedEndDate).toBe('2025-01-02T00:00:00');
  });

  it('does not treat touching intra-day slots as a conflict', () => {
    // A ends at 10:00, B starts at 10:00 → endA > startB is false → no conflict
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T08:00:00', '2025-01-01T10:00:00'),
      order('b', 'X', '2025-01-01T10:00:00', '2025-01-01T12:00:00'),
    ]);

    expect(result).toEqual([]);
  });
});
