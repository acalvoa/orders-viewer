import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse } from '@repo/shared';
import { translateDirectusError } from '@shared/directus/utils/translate-directus-error';
import { DirectusBulkUpdateCommand } from '@shared/directus/commands/declarations/directus-bulk-update.command';

@Injectable()
@CommandHandler(DirectusBulkUpdateCommand)
export class DirectusBulkUpdateHandler
  implements ICommandHandler<DirectusBulkUpdateCommand, void>
{
  constructor(private readonly http: HttpService) {}

  async execute(command: DirectusBulkUpdateCommand): Promise<void> {
    const path = `/items/${encodeURIComponent(command.collection)}`;
    await firstValueFrom(
      this.http.patch(path, command.items).pipe(
        catchError((error: AxiosError<DirectusErrorResponse>) => {
          throw translateDirectusError(error);
        }),
      ),
    );
  }
}
