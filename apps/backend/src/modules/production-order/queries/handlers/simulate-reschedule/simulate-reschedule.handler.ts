import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { DirectusListResponse, DirectusOperator, ProductionOrderStatus, RescheduleProposal } from '@repo/shared';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { SimulateRescheduleQuery } from '@modules/production-order/queries/declarations/simulate-reschedule.query';
import { resolveConflicts } from '@modules/production-order/utils/conflict-resolver.util';

@QueryHandler(SimulateRescheduleQuery)
export class SimulateRescheduleHandler
  implements IQueryHandler<SimulateRescheduleQuery, RescheduleProposal[]>
{
  private readonly collection = 'production_orders';

  constructor(private readonly queryBus: QueryBus) {}

  async execute(): Promise<RescheduleProposal[]> {
    const result = await this.queryBus.execute<
      DirectusListItemsQuery,
      DirectusListResponse<DirectusProductionOrder>
    >(
      new DirectusListItemsQuery(this.collection, {
        filter: { status: { [DirectusOperator.EQ]: ProductionOrderStatus.PLANNED } },
        sort: ['createdAt'],
        fields: ['*'],
        limit: -1,
      }),
    );

    return resolveConflicts(result.data);
  }
}
