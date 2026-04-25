import { DirectusMeta } from '../enums/directus-meta';
import type { DirectusFilter } from './directus-filter';

export interface DirectusListParams {
  filter?: DirectusFilter;
  sort?: string[];
  limit?: number;
  offset?: number;
  page?: number;
  fields?: string[];
  search?: string;
  meta?: DirectusMeta;
}
