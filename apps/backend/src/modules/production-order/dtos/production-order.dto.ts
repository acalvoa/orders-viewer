import { ProductionOrder, ProductionOrderStatus } from '@repo/shared';
import type { DirectusProductionOrder } from '../interfaces/directus-production-order.interface';

export class ProductionOrderDto implements ProductionOrder {
  id!: string;
  reference!: string;
  product!: string;
  quantity!: number;
  startDate!: string;
  endDate!: string;
  status!: ProductionOrderStatus;
  createdAt!: string;

  static fromDirectus(raw: DirectusProductionOrder): ProductionOrderDto {
    const dto = new ProductionOrderDto();
    dto.id = raw.id;
    dto.reference = raw.reference;
    dto.product = raw.product;
    dto.quantity = raw.quantity;
    dto.startDate = raw.startDate;
    dto.endDate = raw.endDate;
    dto.status = raw.status;
    dto.createdAt = raw.createdAt;
    return dto;
  }
}
