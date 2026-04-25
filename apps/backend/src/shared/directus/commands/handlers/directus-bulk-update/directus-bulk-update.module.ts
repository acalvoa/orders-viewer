import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DirectusBulkUpdateHandler } from './directus-bulk-update.handler';

@Module({
  imports: [HttpModule],
  providers: [DirectusBulkUpdateHandler],
  exports: [DirectusBulkUpdateHandler],
})
export class DirectusBulkUpdateModule {}
