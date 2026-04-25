import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { DirectusGetItemQuery } from '@shared/directus/queries/declarations/directus-get-item.query';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { GetProductionOrderQuery } from '@modules/production-order/queries/declarations/get-production-order.query';

@QueryHandler(GetProductionOrderQuery)
export class GetProductionOrderHandler
  implements IQueryHandler<GetProductionOrderQuery, DirectusProductionOrder | null>
{
  private readonly collection = 'production_orders';

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    query: GetProductionOrderQuery,
  ): Promise<DirectusProductionOrder | null> {
    try {
      return await this.queryBus.execute<
        DirectusGetItemQuery,
        DirectusProductionOrder
      >(new DirectusGetItemQuery(this.collection, query.id, ['*']));
    } catch (error: unknown) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
