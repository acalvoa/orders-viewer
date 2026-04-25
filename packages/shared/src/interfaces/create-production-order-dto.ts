import { ProductionOrderStatus } from '../enums/production-order-status';

export interface CreateProductionOrderDto {
  reference: string;
  product: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status?: ProductionOrderStatus;
}
