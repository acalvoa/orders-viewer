import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { GetProductionOrderHandler } from './get-production-order.handler';

@Module({
  imports: [DirectusModule],
  providers: [GetProductionOrderHandler],
  exports: [GetProductionOrderHandler],
})
export class GetProductionOrderModule {}
