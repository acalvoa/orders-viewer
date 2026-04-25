import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { CreateProductionOrderHandler } from './create-production-order.handler';

@Module({
  imports: [DirectusModule],
  providers: [CreateProductionOrderHandler],
  exports: [CreateProductionOrderHandler],
})
export class CreateProductionOrderModule {}
