import type { DirectusFilter } from './directus-filter';

export interface DirectusLogicalGroup {
  _and?: DirectusFilter[];
  _or?: DirectusFilter[];
}
