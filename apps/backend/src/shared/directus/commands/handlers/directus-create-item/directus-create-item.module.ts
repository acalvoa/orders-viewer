import { Module } from '@nestjs/common';
import { DirectusHttpModule } from '@shared/directus/directus-http.module';
import { DirectusCreateItemHandler } from './directus-create-item.handler';

@Module({
  imports: [DirectusHttpModule],
  providers: [DirectusCreateItemHandler],
  exports: [DirectusCreateItemHandler],
})
export class DirectusCreateItemModule {}
