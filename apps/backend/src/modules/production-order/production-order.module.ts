import { Module } from '@nestjs/common';
import { ProductionOrderController } from '@modules/production-order/controllers/production-order/production-order.controller';
import { ProductionOrderService } from '@modules/production-order/services/production-order/production-order.service';
import { GetProductionOrdersModule } from '@modules/production-order/queries/handlers/get-production-orders/get-production-orders.module';
import { GetProductionOrderModule } from '@modules/production-order/queries/handlers/get-production-order/get-production-order.module';
import { SimulateRescheduleModule } from '@modules/production-order/queries/handlers/simulate-reschedule/simulate-reschedule.module';
import { GetOrderStatsModule } from '@modules/production-order/queries/handlers/get-order-stats/get-order-stats.module';
import { RescheduleConflictsModule } from '@modules/production-order/commands/handlers/reschedule-conflicts/reschedule-conflicts.module';
import { CreateProductionOrderModule } from '@modules/production-order/commands/handlers/create-production-order/create-production-order.module';
import { UpdateProductionOrderModule } from '@modules/production-order/commands/handlers/update-production-order/update-production-order.module';
import { DeleteProductionOrderModule } from '@modules/production-order/commands/handlers/delete-production-order/delete-production-order.module';

@Module({
  imports: [
    GetProductionOrdersModule,
    GetProductionOrderModule,
    SimulateRescheduleModule,
    GetOrderStatsModule,
    RescheduleConflictsModule,
    CreateProductionOrderModule,
    UpdateProductionOrderModule,
    DeleteProductionOrderModule,
  ],
  controllers: [ProductionOrderController],
  providers: [ProductionOrderService],
})
export class ProductionOrderModule {}
