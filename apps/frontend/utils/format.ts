import dayjs from '@/lib/dayjs';

export function fmtDt(v: string | undefined): string {
  return v ? dayjs.utc(v).local().format('DD/MM/YYYY HH:mm') : '—';
}
