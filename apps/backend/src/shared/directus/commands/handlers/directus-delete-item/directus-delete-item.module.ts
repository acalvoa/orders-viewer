import { Module } from '@nestjs/common';
import { DirectusHttpModule } from '@shared/directus/directus-http.module';
import { DirectusDeleteItemHandler } from './directus-delete-item.handler';

@Module({
  imports: [DirectusHttpModule],
  providers: [DirectusDeleteItemHandler],
  exports: [DirectusDeleteItemHandler],
})
export class DirectusDeleteItemModule {}
