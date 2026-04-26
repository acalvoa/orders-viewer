import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse, DirectusItemResponse } from '@repo/shared';
import { translateDirectusError } from '@shared/directus/utils/translate-directus-error';
import { DirectusCreateItemCommand } from '@shared/directus/commands/declarations/directus-create-item.command';

@Injectable()
@CommandHandler(DirectusCreateItemCommand)
export class DirectusCreateItemHandler
  implements ICommandHandler<DirectusCreateItemCommand, unknown>
{
  constructor(private readonly http: HttpService) {}

  async execute(command: DirectusCreateItemCommand): Promise<unknown> {
    const res: AxiosResponse<DirectusItemResponse<unknown>> = await firstValueFrom(
      this.http
        .post<DirectusItemResponse<unknown>>(
          `/items/${encodeURIComponent(command.collection)}`,
          command.body,
        )
        .pipe(
          catchError((error: AxiosError<DirectusErrorResponse>) => {
            throw translateDirectusError(error);
          }),
        ),
    );
    return res.data.data;
  }
}
