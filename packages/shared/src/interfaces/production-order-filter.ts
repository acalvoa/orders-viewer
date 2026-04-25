import { ProductionOrderStatus } from '../enums/production-order-status';

export interface ProductionOrderFilter {
  status?: ProductionOrderStatus;
  product?: string;
  reference?: string;
  startDateFrom?: string;
  startDateTo?: string;
}
