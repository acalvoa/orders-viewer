import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.getOrThrow<string>('DIRECTUS_URL'),
        headers: {
          Authorization: `Bearer ${config.getOrThrow<string>('DIRECTUS_STATIC_TOKEN')}`,
        },
      }),
    }),
  ],
  exports: [HttpModule],
})
export class DirectusHttpModule {}
