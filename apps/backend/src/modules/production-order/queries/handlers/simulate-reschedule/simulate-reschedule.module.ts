import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { SimulateRescheduleHandler } from './simulate-reschedule.handler';

@Module({
  imports: [DirectusModule],
  providers: [SimulateRescheduleHandler],
  exports: [SimulateRescheduleHandler],
})
export class SimulateRescheduleModule {}
