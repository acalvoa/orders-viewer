import {
  BadGatewayException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { DirectusErrorResponse, DirectusListParams } from '@repo/shared';

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

export function directusAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function translateDirectusError(
  error: AxiosError<DirectusErrorResponse>,
): Error {
  const status: number | undefined = error.response?.status;
  const message: string =
    error.response?.data?.errors?.[0]?.message ?? error.message;
  if (status === 404) return new NotFoundException(message);
  if (status === 401 || status === 403) {
    return new UnauthorizedException(message);
  }
  return new BadGatewayException(`Directus: ${message}`);
}
