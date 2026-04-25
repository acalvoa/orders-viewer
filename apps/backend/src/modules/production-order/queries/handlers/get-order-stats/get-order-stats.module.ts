import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { GetOrderStatsHandler } from './get-order-stats.handler';

@Module({
  imports: [DirectusModule],
  providers: [GetOrderStatsHandler],
  exports: [GetOrderStatsHandler],
})
export class GetOrderStatsModule {}
