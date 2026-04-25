import type { DirectusFieldCondition } from './directus-field-condition';
import type { DirectusLogicalGroup } from './directus-logical-group';

export type DirectusFilter = Record<string, DirectusFieldCondition | DirectusLogicalGroup>;
