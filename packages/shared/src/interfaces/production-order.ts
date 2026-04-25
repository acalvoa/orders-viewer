import { ProductionOrderStatus } from '../enums/production-order-status';

export interface ProductionOrder {
  id: string;
  reference: string;
  product: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status: ProductionOrderStatus;
  createdAt: string;
}
