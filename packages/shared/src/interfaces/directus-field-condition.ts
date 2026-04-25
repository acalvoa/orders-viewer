import { DirectusOperator } from '../enums/directus-operator';

export type DirectusFieldCondition = Partial<Record<DirectusOperator, unknown>>;
