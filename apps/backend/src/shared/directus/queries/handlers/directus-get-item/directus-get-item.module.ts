import { Module } from '@nestjs/common';
import { DirectusHttpModule } from '@shared/directus/directus-http.module';
import { DirectusGetItemHandler } from './directus-get-item.handler';

@Module({
  imports: [DirectusHttpModule],
  providers: [DirectusGetItemHandler],
  exports: [DirectusGetItemHandler],
})
export class DirectusGetItemModule {}
