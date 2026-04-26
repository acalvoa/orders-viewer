import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse, DirectusItemResponse } from '@repo/shared';
import { translateDirectusError } from '@shared/directus/utils/translate-directus-error';
import { DirectusUpdateItemCommand } from '@shared/directus/commands/declarations/directus-update-item.command';

@Injectable()
@CommandHandler(DirectusUpdateItemCommand)
export class DirectusUpdateItemHandler implements ICommandHandler<
  DirectusUpdateItemCommand,
  unknown
> {
  constructor(private readonly http: HttpService) {}

  async execute(command: DirectusUpdateItemCommand): Promise<unknown> {
    const res: AxiosResponse<DirectusItemResponse<unknown>> =
      await firstValueFrom(
        this.http
          .patch<
            DirectusItemResponse<unknown>
          >(`/items/${encodeURIComponent(command.collection)}/${encodeURIComponent(command.id)}`, command.body)
          .pipe(
            catchError((error: AxiosError<DirectusErrorResponse>) => {
              throw translateDirectusError(error);
            }),
          ),
      );
    return res.data.data;
  }
}
