import { DirectusListParams } from '@repo/shared';

export function buildDirectusQuery(p: DirectusListParams): string {
  const parts: string[] = [];
  
  if (p.filter) {
    parts.push(`filter=${encodeURIComponent(JSON.stringify(p.filter))}`);
  }
  
  if (p.sort?.length) {
    parts.push(`sort=${encodeURIComponent(p.sort.join(','))}`);
  }
  
  if (p.fields?.length) {
    parts.push(`fields=${encodeURIComponent(p.fields.join(','))}`);
  }
  
  if (p.limit !== undefined) parts.push(`limit=${p.limit}`);
  if (p.offset !== undefined) parts.push(`offset=${p.offset}`);
  if (p.page !== undefined) parts.push(`page=${p.page}`);
  if (p.search) parts.push(`search=${encodeURIComponent(p.search)}`);
  if (p.meta) parts.push(`meta=${p.meta}`);
  
  return parts.join('&');
}
