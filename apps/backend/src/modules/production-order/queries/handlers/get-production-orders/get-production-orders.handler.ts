import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import {
  DirectusFieldCondition,
  DirectusFilter,
  DirectusListResponse,
  DirectusOperator,
  ProductionOrderFilter,
} from '@repo/shared';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { GetProductionOrdersQuery } from '@modules/production-order/queries/declarations/get-production-orders.query';

@QueryHandler(GetProductionOrdersQuery)
export class GetProductionOrdersHandler implements IQueryHandler<
  GetProductionOrdersQuery,
  DirectusListResponse<DirectusProductionOrder>
> {
  private readonly collection = 'production_orders';

  constructor(private readonly queryBus: QueryBus) {}

  execute(
    query: GetProductionOrdersQuery,
  ): Promise<DirectusListResponse<DirectusProductionOrder>> {
    const { filters, pagination } = query;
    const sort = pagination.sort ? [pagination.sort] : ['-createdAt'];
    const filter = this.buildFilter(filters);

    return this.queryBus.execute<
      DirectusListItemsQuery,
      DirectusListResponse<DirectusProductionOrder>
    >(
      new DirectusListItemsQuery(this.collection, {
        filter,
        sort,
        page: pagination.page,
        limit: pagination.size,
        fields: ['*'],
      }),
    );
  }

  private buildFilter(f: ProductionOrderFilter): DirectusFilter | undefined {
    const filter: DirectusFilter = {};

    if (f.status) filter['status'] = { [DirectusOperator.EQ]: f.status };
    if (f.product) filter['product'] = { [DirectusOperator.EQ]: f.product };
    if (f.reference)
      filter['reference'] = { [DirectusOperator.CONTAINS]: f.reference };

    if (f.startDateFrom ?? f.startDateTo) {
      const cond: DirectusFieldCondition = {};
      if (f.startDateFrom) cond[DirectusOperator.GTE] = f.startDateFrom;
      if (f.startDateTo) cond[DirectusOperator.LTE] = f.startDateTo;
      filter['startDate'] = cond;
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }
}
