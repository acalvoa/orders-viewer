import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { UpdateProductionOrderHandler } from './update-production-order.handler';

@Module({
  imports: [DirectusModule],
  providers: [UpdateProductionOrderHandler],
  exports: [UpdateProductionOrderHandler],
})
export class UpdateProductionOrderModule {}
