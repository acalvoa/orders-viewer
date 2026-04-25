import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DirectusCreateItemHandler } from './directus-create-item.handler';

@Module({
  imports: [HttpModule],
  providers: [DirectusCreateItemHandler],
  exports: [DirectusCreateItemHandler],
})
export class DirectusCreateItemModule {}
