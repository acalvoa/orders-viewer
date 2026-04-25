import { ProductionOrderStatus } from '@repo/shared';

export interface DirectusProductionOrder {
  id: string;
  reference: string;
  product: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status: ProductionOrderStatus;
  createdAt: string;
}
