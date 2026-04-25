import type { ProductionOrderStatus } from '@repo/shared';

export interface OrderDateRange {
  id: string;
  reference: string;
  product: string;
  quantity: number;
  status: ProductionOrderStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
}
