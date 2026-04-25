import type { UpdateProductionOrderDto } from '@repo/shared';

export class UpdateProductionOrderCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateProductionOrderDto,
  ) {}
}
