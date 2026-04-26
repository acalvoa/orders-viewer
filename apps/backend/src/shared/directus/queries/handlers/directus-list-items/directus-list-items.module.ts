import { Module } from '@nestjs/common';
import { DirectusHttpModule } from '@shared/directus/directus-http.module';
import { DirectusListItemsHandler } from './directus-list-items.handler';

@Module({
  imports: [DirectusHttpModule],
  providers: [DirectusListItemsHandler],
  exports: [DirectusListItemsHandler],
})
export class DirectusListItemsModule {}
