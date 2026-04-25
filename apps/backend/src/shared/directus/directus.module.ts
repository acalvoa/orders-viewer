import { Module } from '@nestjs/common';
import { DirectusListItemsModule } from '@shared/directus/queries/handlers/directus-list-items/directus-list-items.module';
import { DirectusGetItemModule } from '@shared/directus/queries/handlers/directus-get-item/directus-get-item.module';
import { DirectusCreateItemModule } from '@shared/directus/commands/handlers/directus-create-item/directus-create-item.module';
import { DirectusUpdateItemModule } from '@shared/directus/commands/handlers/directus-update-item/directus-update-item.module';
import { DirectusDeleteItemModule } from '@shared/directus/commands/handlers/directus-delete-item/directus-delete-item.module';
import { DirectusBulkUpdateModule } from '@shared/directus/commands/handlers/directus-bulk-update/directus-bulk-update.module';

@Module({
  imports: [
    DirectusListItemsModule,
    DirectusGetItemModule,
    DirectusCreateItemModule,
    DirectusUpdateItemModule,
    DirectusDeleteItemModule,
    DirectusBulkUpdateModule,
  ],
  exports: [
    DirectusListItemsModule,
    DirectusGetItemModule,
    DirectusCreateItemModule,
    DirectusUpdateItemModule,
    DirectusDeleteItemModule,
    DirectusBulkUpdateModule,
  ],
})
export class DirectusModule {}
