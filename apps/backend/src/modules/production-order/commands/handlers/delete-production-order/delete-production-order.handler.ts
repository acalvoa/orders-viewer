import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DirectusDeleteItemCommand } from '@shared/directus/commands/declarations/directus-delete-item.command';
import { DeleteProductionOrderCommand } from '@modules/production-order/commands/declarations/delete-production-order.command';

@CommandHandler(DeleteProductionOrderCommand)
export class DeleteProductionOrderHandler
  implements ICommandHandler<DeleteProductionOrderCommand, void>
{
  private readonly collection = 'production_orders';

  constructor(private readonly commandBus: CommandBus) {}

  execute(command: DeleteProductionOrderCommand): Promise<void> {
    return this.commandBus.execute<DirectusDeleteItemCommand, void>(
      new DirectusDeleteItemCommand(this.collection, command.id),
    );
  }
}
