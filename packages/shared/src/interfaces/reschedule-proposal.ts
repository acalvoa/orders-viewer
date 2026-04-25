import type { ProductionOrderStatus } from '../enums/production-order-status';

export interface RescheduleProposal {
  id: string;
  reference: string;
  product: string;
  quantity: number;
  status: ProductionOrderStatus;
  currentStartDate: string;
  currentEndDate: string;
  proposedStartDate: string;
  proposedEndDate: string;
}
