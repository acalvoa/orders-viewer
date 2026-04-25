import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse, DirectusItemResponse } from '@repo/shared';
import { directusAuthHeaders, translateDirectusError } from '@shared/directus/directus-http.utils';
import { DirectusUpdateItemCommand } from '@shared/directus/commands/declarations/directus-update-item.command';

@Injectable()
@CommandHandler(DirectusUpdateItemCommand)
export class DirectusUpdateItemHandler
  implements ICommandHandler<DirectusUpdateItemCommand, unknown>
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

  async execute(command: DirectusUpdateItemCommand): Promise<unknown> {
    const url = `${this.baseUrl}/items/${encodeURIComponent(command.collection)}/${encodeURIComponent(command.id)}`;
    const res: AxiosResponse<DirectusItemResponse<unknown>> = await firstValueFrom(
      this.http
        .patch<DirectusItemResponse<unknown>>(url, command.body, {
          headers: directusAuthHeaders(this.token),
        })
        .pipe(
          catchError((error: AxiosError<DirectusErrorResponse>) => {
            throw translateDirectusError(error);
          }),
        ),
    );
    return res.data.data;
  }
}
