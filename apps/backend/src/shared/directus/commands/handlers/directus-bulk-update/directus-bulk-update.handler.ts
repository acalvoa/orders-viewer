import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse } from '@repo/shared';
import { directusAuthHeaders, translateDirectusError } from '@shared/directus/directus-http.utils';
import { DirectusBulkUpdateCommand } from '@shared/directus/commands/declarations/directus-bulk-update.command';

@Injectable()
@CommandHandler(DirectusBulkUpdateCommand)
export class DirectusBulkUpdateHandler
  implements ICommandHandler<DirectusBulkUpdateCommand, void>
{
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('DIRECTUS_URL');
    this.token = config.getOrThrow<string>('DIRECTUS_STATIC_TOKEN');
  }

  async execute(command: DirectusBulkUpdateCommand): Promise<void> {
    const url = `${this.baseUrl}/items/${encodeURIComponent(command.collection)}`;
    await firstValueFrom(
      this.http
        .patch(url, command.items, { headers: directusAuthHeaders(this.token) })
        .pipe(
          catchError((error: AxiosError<DirectusErrorResponse>) => {
            throw translateDirectusError(error);
          }),
        ),
    );
  }
}
