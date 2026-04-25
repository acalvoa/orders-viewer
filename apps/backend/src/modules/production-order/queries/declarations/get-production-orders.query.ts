import type { PageOptions, ProductionOrderFilter } from '@repo/shared';

export class GetProductionOrdersQuery {
  constructor(
    public readonly filters: ProductionOrderFilter,
    public readonly pagination: PageOptions,
  ) {}
}
