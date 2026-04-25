import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { DirectusListResponse, DirectusOperator, ProductionOrderStatus } from '@repo/shared';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';
import { DirectusBulkUpdateCommand } from '@shared/directus/commands/declarations/directus-bulk-update.command';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { RescheduleConflictsCommand } from '@modules/production-order/commands/declarations/reschedule-conflicts.command';
import { resolveConflicts } from '@modules/production-order/utils/conflict-resolver.util';

@CommandHandler(RescheduleConflictsCommand)
export class RescheduleConflictsHandler
  implements ICommandHandler<RescheduleConflictsCommand, { rescheduled: number }>
{
  private readonly collection = 'production_orders';

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(): Promise<{ rescheduled: number }> {
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

    const proposals = resolveConflicts(result.data);
    if (proposals.length === 0) return { rescheduled: 0 };

    await this.commandBus.execute<DirectusBulkUpdateCommand, void>(
      new DirectusBulkUpdateCommand(
        this.collection,
        proposals.map(p => ({ id: p.id, startDate: p.proposedStartDate, endDate: p.proposedEndDate })),
      ),
    );

    return { rescheduled: proposals.length };
  }
}
