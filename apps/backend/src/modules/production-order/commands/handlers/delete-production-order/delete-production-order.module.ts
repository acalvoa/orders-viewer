import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { DeleteProductionOrderHandler } from './delete-production-order.handler';

@Module({
  imports: [DirectusModule],
  providers: [DeleteProductionOrderHandler],
  exports: [DeleteProductionOrderHandler],
})
export class DeleteProductionOrderModule {}
