import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DirectusListItemsHandler } from './directus-list-items.handler';

@Module({
  imports: [HttpModule],
  providers: [DirectusListItemsHandler],
  exports: [DirectusListItemsHandler],
})
export class DirectusListItemsModule {}
