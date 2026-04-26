import { Module } from '@nestjs/common';
import { DirectusHttpModule } from '@shared/directus/directus-http.module';
import { DirectusBulkUpdateHandler } from './directus-bulk-update.handler';

@Module({
  imports: [DirectusHttpModule],
  providers: [DirectusBulkUpdateHandler],
  exports: [DirectusBulkUpdateHandler],
})
export class DirectusBulkUpdateModule {}
