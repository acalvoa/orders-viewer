import dayjs from 'dayjs';
import type { RescheduleProposal } from '@repo/shared';

export function hours(start: string, end: string): string {
  const h = dayjs(end).diff(dayjs(start), 'hour');
  if (h < 24) return `${Math.max(1, h)}h`;
  const d = Math.round(h / 24);
  return `${d} día${d !== 1 ? 's' : ''}`;
}

export function computeConflictMap(proposals: RescheduleProposal[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (let i = 0; i < proposals.length; i++) {
    for (let j = i + 1; j < proposals.length; j++) {
      const a = proposals[i];
      const b = proposals[j];
      if (a.currentStartDate < b.currentEndDate && a.currentEndDate > b.currentStartDate) {
        if (!map.has(a.id)) map.set(a.id, []);
        if (!map.has(b.id)) map.set(b.id, []);
        map.get(a.id)!.push(b.id);
        map.get(b.id)!.push(a.id);
      }
    }
  }
  return map;
}
