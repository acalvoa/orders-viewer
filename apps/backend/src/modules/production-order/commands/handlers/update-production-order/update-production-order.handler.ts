import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DirectusUpdateItemCommand } from '@shared/directus/commands/declarations/directus-update-item.command';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { ProductionOrderDto } from '@modules/production-order/dtos/production-order.dto';
import { UpdateProductionOrderCommand } from '@modules/production-order/commands/declarations/update-production-order.command';

@CommandHandler(UpdateProductionOrderCommand)
export class UpdateProductionOrderHandler implements ICommandHandler<
  UpdateProductionOrderCommand,
  ProductionOrderDto
> {
  private readonly collection = 'production_orders';

  constructor(private readonly commandBus: CommandBus) {}

  async execute({
    id,
    dto,
  }: UpdateProductionOrderCommand): Promise<ProductionOrderDto> {
    const body: Record<string, unknown> = {};
    if (dto.reference !== undefined) body.reference = dto.reference;
    if (dto.product !== undefined) body.product = dto.product;
    if (dto.quantity !== undefined) body.quantity = dto.quantity;
    if (dto.startDate !== undefined) body.startDate = dto.startDate;
    if (dto.endDate !== undefined) body.endDate = dto.endDate;
    if (dto.status !== undefined) body.status = dto.status;

    const raw = await this.commandBus.execute<
      DirectusUpdateItemCommand,
      DirectusProductionOrder
    >(new DirectusUpdateItemCommand(this.collection, id, body));
    return ProductionOrderDto.fromDirectus(raw);
  }
}
