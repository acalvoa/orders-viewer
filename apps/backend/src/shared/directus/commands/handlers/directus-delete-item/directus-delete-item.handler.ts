import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse } from '@repo/shared';
import { translateDirectusError } from '@shared/directus/utils/translate-directus-error';
import { DirectusDeleteItemCommand } from '@shared/directus/commands/declarations/directus-delete-item.command';

@Injectable()
@CommandHandler(DirectusDeleteItemCommand)
export class DirectusDeleteItemHandler
  implements ICommandHandler<DirectusDeleteItemCommand, void>
{
  constructor(private readonly http: HttpService) {}

  async execute(command: DirectusDeleteItemCommand): Promise<void> {
    const path = `/items/${encodeURIComponent(command.collection)}/${encodeURIComponent(command.id)}`;
    await firstValueFrom(
      this.http.delete(path).pipe(
        catchError((error: AxiosError<DirectusErrorResponse>) => {
          throw translateDirectusError(error);
        }),
      ),
    );
  }
}
