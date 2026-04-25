import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DirectusDeleteItemHandler } from './directus-delete-item.handler';

@Module({
  imports: [HttpModule],
  providers: [DirectusDeleteItemHandler],
  exports: [DirectusDeleteItemHandler],
})
export class DirectusDeleteItemModule {}
