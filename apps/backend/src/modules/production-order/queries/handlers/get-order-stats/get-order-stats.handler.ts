import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { DirectusListResponse, DirectusMeta, DirectusOperator, OrderStats, ProductionOrderStatus } from '@repo/shared';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';
import { GetOrderStatsQuery } from '@modules/production-order/queries/declarations/get-order-stats.query';

@QueryHandler(GetOrderStatsQuery)
export class GetOrderStatsHandler implements IQueryHandler<GetOrderStatsQuery, OrderStats> {
  private readonly collection = 'production_orders';

  constructor(private readonly queryBus: QueryBus) {}

  async execute(): Promise<OrderStats> {
    const countOf = (status?: ProductionOrderStatus) =>
      this.queryBus.execute<DirectusListItemsQuery, DirectusListResponse<{ id: string }>>(
        new DirectusListItemsQuery(this.collection, {
          filter: status ? { status: { [DirectusOperator.EQ]: status } } : undefined,
          fields: ['id'],
          limit: 1,
          meta: DirectusMeta.FILTER_COUNT,
        }),
      ).then(r => r.meta?.filter_count ?? 0);

    const [total, planned, inProgress] = await Promise.all([
      countOf(),
      countOf(ProductionOrderStatus.PLANNED),
      countOf(ProductionOrderStatus.IN_PROGRESS),
    ]);

    return { total, planned, inProgress };
  }
}
