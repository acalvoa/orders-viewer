import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { GetProductionOrdersHandler } from './get-production-orders.handler';

@Module({
  imports: [DirectusModule],
  providers: [GetProductionOrdersHandler],
  exports: [GetProductionOrdersHandler],
})
export class GetProductionOrdersModule {}
