import { DirectusListParams } from '@repo/shared';

export class DirectusListItemsQuery {
  constructor(
    public readonly collection: string,
    public readonly params: DirectusListParams,
  ) {}
}
