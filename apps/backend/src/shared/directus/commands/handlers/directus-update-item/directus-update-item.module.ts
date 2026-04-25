import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DirectusUpdateItemHandler } from './directus-update-item.handler';

@Module({
  imports: [HttpModule],
  providers: [DirectusUpdateItemHandler],
  exports: [DirectusUpdateItemHandler],
})
export class DirectusUpdateItemModule {}
