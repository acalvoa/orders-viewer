import { Module } from '@nestjs/common';
import { DirectusHttpModule } from '@shared/directus/directus-http.module';
import { DirectusUpdateItemHandler } from './directus-update-item.handler';

@Module({
  imports: [DirectusHttpModule],
  providers: [DirectusUpdateItemHandler],
  exports: [DirectusUpdateItemHandler],
})
export class DirectusUpdateItemModule {}
