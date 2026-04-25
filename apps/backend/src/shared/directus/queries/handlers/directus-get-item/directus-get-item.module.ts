import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DirectusGetItemHandler } from './directus-get-item.handler';

@Module({
  imports: [HttpModule],
  providers: [DirectusGetItemHandler],
  exports: [DirectusGetItemHandler],
})
export class DirectusGetItemModule {}
