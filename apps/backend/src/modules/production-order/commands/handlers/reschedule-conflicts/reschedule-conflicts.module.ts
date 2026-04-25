import { Module } from '@nestjs/common';
import { DirectusModule } from '@shared/directus/directus.module';
import { RescheduleConflictsHandler } from './reschedule-conflicts.handler';

@Module({
  imports: [DirectusModule],
  providers: [RescheduleConflictsHandler],
  exports: [RescheduleConflictsHandler],
})
export class RescheduleConflictsModule {}
