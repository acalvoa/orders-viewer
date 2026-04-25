import type { CreateProductionOrderDto } from '@repo/shared';

export class CreateProductionOrderCommand {
  constructor(public readonly dto: CreateProductionOrderDto) {}
}
