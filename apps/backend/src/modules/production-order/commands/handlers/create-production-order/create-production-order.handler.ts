import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProductionOrderStatus } from '@repo/shared';
import { DirectusCreateItemCommand } from '@shared/directus/commands/declarations/directus-create-item.command';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { ProductionOrderDto } from '@modules/production-order/dtos/production-order.dto';
import { CreateProductionOrderCommand } from '@modules/production-order/commands/declarations/create-production-order.command';

@CommandHandler(CreateProductionOrderCommand)
export class CreateProductionOrderHandler
  implements ICommandHandler<CreateProductionOrderCommand, ProductionOrderDto>
{
  private readonly collection = 'production_orders';

  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: CreateProductionOrderCommand): Promise<ProductionOrderDto> {
    const { dto } = command;
    const raw = await this.commandBus.execute<DirectusCreateItemCommand, DirectusProductionOrder>(
      new DirectusCreateItemCommand(this.collection, {
        reference: dto.reference,
        product: dto.product,
        quantity: dto.quantity,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status ?? ProductionOrderStatus.PLANNED,
      }),
    );
    return ProductionOrderDto.fromDirectus(raw);
  }
}
