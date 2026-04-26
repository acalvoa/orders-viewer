import { ProductionOrderStatus } from '@repo/shared';
import { resolveConflicts } from './resolve-conflicts';

const order = (
  id: string,
  product: string,
  startDate: string,
  endDate: string,
  createdAt = '2024-01-01T00:00:00',
) => ({
  id,
  reference: `REF-${id}`,
  product,
  quantity: 1,
  status: ProductionOrderStatus.PLANNED,
  startDate,
  endDate,
  createdAt,
});

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

  it('embeds order metadata (reference, product, quantity, status) into the proposal', () => {
    const result = resolveConflicts([
      order('a', 'Widget-A', '2025-01-01T00:00:00', '2025-01-10T00:00:00', '2025-01-01T00:00:00'),
      order('b', 'Widget-B', '2025-01-05T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
    ]);

    const b = result.find((p) => p.id === 'b')!;
    expect(b.reference).toBe('REF-b');
    expect(b.product).toBe('Widget-B');
    expect(b.quantity).toBe(1);
    expect(b.status).toBe(ProductionOrderStatus.PLANNED);
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
  it('oldest order keeps its original slot; newer conflicting order is pushed forward', () => {
    // A: created earlier (Jan 1), starts later (Jan 10).
    // B: created later  (Jan 2), starts earlier (Jan 5) — overlaps A.
    // A has priority → stays at Jan 10–20. B is pushed to Jan 20.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-10T00:00:00', '2025-01-20T00:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-05T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined(); // A unchanged
    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-20T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-30T00:00:00');
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

  it('oldest order keeps its own startDate even when others have earlier start dates', () => {
    // C is the oldest (createdAt Jan 1) but starts latest (Jan 8).
    // C stays at Jan 8–15. A and B are pushed sequentially after C.
    // createdAt order: C(Jan1) → A(Jan2) → B(Jan3)
    // A tries Jan5–10: overlaps C(Jan8–15) → pushed to Jan15–20.
    // B tries Jan3–12: overlaps C(Jan8–15) → pushed to Jan15; overlaps A_new(Jan15–20) → pushed to Jan20–29.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-05T00:00:00', '2025-01-10T00:00:00', '2025-01-02T00:00:00'), // 5 days
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-12T00:00:00', '2025-01-03T00:00:00'), // 9 days
      order('c', 'X', '2025-01-08T00:00:00', '2025-01-15T00:00:00', '2025-01-01T00:00:00'), // 7 days
    ]);

    expect(result.find((p) => p.id === 'c')).toBeUndefined(); // C unchanged
    const a = result.find((p) => p.id === 'a')!;
    const b = result.find((p) => p.id === 'b')!;
    expect(a.proposedStartDate).toBe('2025-01-15T00:00:00');
    expect(a.proposedEndDate).toBe('2025-01-20T00:00:00');
    expect(b.proposedStartDate).toBe('2025-01-20T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-29T00:00:00');
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
    // createdAt: C(Jan1) < A(Jan2) < B(Jan3)  —  startDate: A(Jan1) < B(Jan3) < C(Jan6)
    // C (oldest) placed first at Jan 6–10 (its original, no conflict yet).
    // A tries Jan 1–5: no conflict → stays unchanged.
    // B tries Jan 3–9: overlaps A(Jan1–5) → pushed to Jan 5; overlaps C(Jan6–10) → pushed to Jan 10–16.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-02T00:00:00'), // 4 days
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-09T00:00:00', '2025-01-03T00:00:00'), // 6 days
      order('c', 'X', '2025-01-06T00:00:00', '2025-01-10T00:00:00', '2025-01-01T00:00:00'), // 4 days — oldest
    ]);

    expect(result.find((p) => p.id === 'c')).toBeUndefined(); // C unchanged
    expect(result.find((p) => p.id === 'a')).toBeUndefined(); // A unchanged
    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-10T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-16T00:00:00');
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
    // A: created at 06:00 (older), starts Jan 10 09:00.
    // B: created at 14:30 (newer), starts Jan 5 14:00 — overlaps A.
    // A has priority → stays at Jan 10 09:00–Jan 15 17:00 (unchanged).
    // B is pushed to start right after A ends: Jan 15 17:00.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-10T09:00:00', '2025-01-15T17:00:00', '2025-01-01T06:00:00'), // 5d 8h
      order('b', 'X', '2025-01-05T14:00:00', '2025-01-12T18:00:00', '2025-01-02T14:30:00'), // 7d 4h
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined(); // A unchanged
    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-15T17:00:00');
    expect(b.proposedEndDate).toBe('2025-01-22T21:00:00'); // +7d4h
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

describe('fixed-interval avoidance', () => {
  it('cascades displacements into originally conflict-free orders when pushed order lands on them', () => {
    // A (oldest) is placed first at Jan1–5, unchanged.
    // B tries Jan2–6: overlaps A → pushed to Jan5–9.
    // C tries Jan7–11: now overlaps B's new slot (Jan5–9) → pushed to Jan9–13.
    // Result is a fully conflict-free chain; all displacements appear as proposals.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-01T00:00:00'), // 4 days
      order('b', 'X', '2025-01-02T00:00:00', '2025-01-06T00:00:00', '2025-01-02T00:00:00'), // 4 days — overlaps a
      order('c', 'X', '2025-01-07T00:00:00', '2025-01-11T00:00:00', '2025-01-03T00:00:00'), // 4 days — free originally
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-05T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-09T00:00:00');

    const c = result.find((p) => p.id === 'c')!;
    expect(c.proposedStartDate).toBe('2025-01-09T00:00:00');
    expect(c.proposedEndDate).toBe('2025-01-13T00:00:00');
  });

  it('cascades through multiple originally-free orders in createdAt order', () => {
    // A (oldest) stays at Jan1–5.
    // B (7d) tries Jan3: blocked by A → Jan5–12.
    // F1 (4d) tries Jan11: blocked by B's new slot → Jan12–16.
    // F2 (4d) tries Jan15: blocked by F1's new slot → Jan16–20.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-01T00:00:00'), // 4 days
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-10T00:00:00', '2025-01-02T00:00:00'), // 7 days — overlaps a
      order('f1', 'Y', '2025-01-11T00:00:00', '2025-01-15T00:00:00', '2025-01-03T00:00:00'), // 4 days — free originally
      order('f2', 'Y', '2025-01-15T00:00:00', '2025-01-19T00:00:00', '2025-01-04T00:00:00'), // 4 days — free originally
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-05T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-12T00:00:00');

    const f1 = result.find((p) => p.id === 'f1')!;
    expect(f1.proposedStartDate).toBe('2025-01-12T00:00:00');
    expect(f1.proposedEndDate).toBe('2025-01-16T00:00:00');

    const f2 = result.find((p) => p.id === 'f2')!;
    expect(f2.proposedStartDate).toBe('2025-01-16T00:00:00');
    expect(f2.proposedEndDate).toBe('2025-01-20T00:00:00');
  });
});

describe('edge cases: zero duration', () => {
  it('treats a zero-duration order (startDate === endDate) as 1 day', () => {
    // duration = 0 → falls back to MS_PER_DAY so it has a schedulable footprint
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-03T00:00:00', '2025-01-02T00:00:00'), // zero duration
    ]);

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-05T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-06T00:00:00'); // treated as 1 day
  });
});

describe('edge cases: identical createdAt tie-breaking', () => {
  it('retains the slot of the first order in input when createdAt timestamps are identical', () => {
    // Stable sort preserves input order for equal keys.
    // A appears before B in the array → A is placed first and keeps its slot.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-01T00:00:00'),
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-08T00:00:00', '2025-01-01T00:00:00'), // same createdAt
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();
    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-05T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-10T00:00:00');
  });
});

describe('edge cases: gap fitting', () => {
  it('places an order in a middle gap without pushing it past the following interval', () => {
    // placed after sorting: A(Jan1–5), C(Jan10–15), then B.
    // B(Jan6–9, 3d) tries Jan6: gap [Jan5–Jan10] is 5d wide, 3d fits → B stays unchanged.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-01T00:00:00'),
      order('c', 'X', '2025-01-10T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
      order('b', 'X', '2025-01-06T00:00:00', '2025-01-09T00:00:00', '2025-01-03T00:00:00'), // 3 days — fits in gap
    ]);

    expect(result).toEqual([]); // all three remain at their original slots
  });

  it('accepts a slot whose end lands exactly on the next interval start (touching boundary)', () => {
    // placed after sorting: A(Jan1–5), C(Jan10–15), then B.
    // B(Jan3–8, 5d) → pushed to Jan5; proposedEnd = Jan10 = C's startMs exactly.
    // iv.startMs >= e: Jan10 >= Jan10 → true → break. B placed at Jan5–10, C untouched.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-01T00:00:00'),
      order('c', 'X', '2025-01-10T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
      order('b', 'X', '2025-01-03T00:00:00', '2025-01-08T00:00:00', '2025-01-03T00:00:00'), // 5 days — fills gap exactly
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();
    expect(result.find((p) => p.id === 'c')).toBeUndefined();

    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-05T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-10T00:00:00'); // lands exactly on C's start
  });

  it('falls through to the next gap when the first gap is too narrow', () => {
    // A(Jan1–5), C(Jan7–15). B has 4 days, starts Jan6.
    // Gap between A and C is only 2 days (Jan5–7) — too narrow for 4d.
    // B is pushed past C: Jan15–19.
    const result = resolveConflicts([
      order('a', 'X', '2025-01-01T00:00:00', '2025-01-05T00:00:00', '2025-01-01T00:00:00'),
      order('c', 'X', '2025-01-07T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
      order('b', 'X', '2025-01-06T00:00:00', '2025-01-10T00:00:00', '2025-01-03T00:00:00'), // 4 days — gap too narrow
    ]);

    expect(result.find((p) => p.id === 'a')).toBeUndefined();
    expect(result.find((p) => p.id === 'c')).toBeUndefined();
    const b = result.find((p) => p.id === 'b')!;
    expect(b.proposedStartDate).toBe('2025-01-15T00:00:00');
    expect(b.proposedEndDate).toBe('2025-01-19T00:00:00');
  });
});

describe('edge cases: more than two independent conflict groups', () => {
  it('resolves three non-overlapping conflict groups without cross-group interference', () => {
    // Three groups in Jan, Feb, Mar — each has one conflict pair.
    // Sorting order: all "first" orders (Jan1 createdAt) then all "second" (Jan2).
    const result = resolveConflicts([
      order('a1', 'X', '2025-01-01T00:00:00', '2025-01-10T00:00:00', '2025-01-01T00:00:00'),
      order('a2', 'X', '2025-01-05T00:00:00', '2025-01-15T00:00:00', '2025-01-02T00:00:00'),
      order('b1', 'X', '2025-02-01T00:00:00', '2025-02-10T00:00:00', '2025-01-01T00:00:00'),
      order('b2', 'X', '2025-02-05T00:00:00', '2025-02-15T00:00:00', '2025-01-02T00:00:00'),
      order('c1', 'X', '2025-03-01T00:00:00', '2025-03-10T00:00:00', '2025-01-01T00:00:00'),
      order('c2', 'X', '2025-03-05T00:00:00', '2025-03-15T00:00:00', '2025-01-02T00:00:00'),
    ]);

    expect(result.find((p) => p.id === 'a1')).toBeUndefined();
    expect(result.find((p) => p.id === 'b1')).toBeUndefined();
    expect(result.find((p) => p.id === 'c1')).toBeUndefined();

    expect(result.find((p) => p.id === 'a2')!.proposedStartDate).toBe('2025-01-10T00:00:00');
    expect(result.find((p) => p.id === 'b2')!.proposedStartDate).toBe('2025-02-10T00:00:00');
    expect(result.find((p) => p.id === 'c2')!.proposedStartDate).toBe('2025-03-10T00:00:00');
  });
});
