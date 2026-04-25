import type { RescheduleProposal } from '@repo/shared';
import type { OrderDateRange } from '../interfaces/order-date-range.interface';
import { MS_PER_DAY, msToDateString } from '@repo/shared';

export function resolveConflicts(orders: OrderDateRange[]): RescheduleProposal[] {
  const n = orders.length;
  if (n < 2) return [];

  // Pre-compute timestamps once — avoids 4×Date() per pair in the O(n²) loop
  const ts = orders.map(o => ({
    startMs: new Date(o.startDate).getTime(),
    endMs: new Date(o.endDate).getTime(),
    createdAtMs: new Date(o.createdAt).getTime(),
  }));

  // Union-Find with path compression
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  };

  // Conflict = any two planned orders with overlapping date range
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (
        ts[i]!.startMs < ts[j]!.endMs &&
        ts[i]!.endMs > ts[j]!.startMs
      ) {
        parent[find(i)] = find(j);
      }
    }
  }

  // Group orders by their conflict cluster root
  const groups = new Map<number, Array<{ order: OrderDateRange; startMs: number; endMs: number; createdAtMs: number }>>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push({ order: orders[i]!, startMs: ts[i]!.startMs, endMs: ts[i]!.endMs, createdAtMs: ts[i]!.createdAtMs });
  }

  // Sequential scheduling within each conflicting group
  const proposals: RescheduleProposal[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;

    // Priority = ascending createdAt; anchor at the group's earliest startDate
    const anchorMs = Math.min(...group.map(g => g.startMs));
    group.sort((a, b) => a.createdAtMs - b.createdAtMs);

    let cursorMs = anchorMs;
    for (const { order, startMs, endMs } of group) {
      const durationMs = endMs - startMs || MS_PER_DAY;
      const proposedStartMs = cursorMs;
      const proposedEndMs = cursorMs + durationMs;

      if (proposedStartMs !== startMs || proposedEndMs !== endMs) {
        proposals.push({
          id: order.id,
          currentStartDate: order.startDate,
          currentEndDate: order.endDate,
          proposedStartDate: msToDateString(proposedStartMs),
          proposedEndDate: msToDateString(proposedEndMs),
        });
      }

      cursorMs = proposedEndMs;
    }
  }

  return proposals;
}
