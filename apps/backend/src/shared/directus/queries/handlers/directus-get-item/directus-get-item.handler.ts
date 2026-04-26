import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse, DirectusItemResponse } from '@repo/shared';
import { buildDirectusQuery } from '@shared/directus/utils/build-directus-query';
import { translateDirectusError } from '@shared/directus/utils/translate-directus-error';
import { DirectusGetItemQuery } from '@shared/directus/queries/declarations/directus-get-item.query';

@Injectable()
@QueryHandler(DirectusGetItemQuery)
export class DirectusGetItemHandler implements IQueryHandler<DirectusGetItemQuery, unknown>
{
  constructor(private readonly http: HttpService) {}

  async execute(query: DirectusGetItemQuery): Promise<unknown> {
    const qs = query.fields?.length ? buildDirectusQuery({ fields: query.fields }) : '';
    const path = `/items/${encodeURIComponent(query.collection)}/${encodeURIComponent(query.id)}${qs ? `?${qs}` : ''}`;

    const res: AxiosResponse<DirectusItemResponse<unknown>> = await firstValueFrom(
      this.http.get<DirectusItemResponse<unknown>>(path).pipe(
        catchError((error: AxiosError<DirectusErrorResponse>) => {
          throw translateDirectusError(error);
        }),
      ),
    );
    return res.data.data;
  }
}
