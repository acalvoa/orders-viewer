import dayjs from 'dayjs';

export function fmtDt(v: string | undefined): string {
  return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—';
}
