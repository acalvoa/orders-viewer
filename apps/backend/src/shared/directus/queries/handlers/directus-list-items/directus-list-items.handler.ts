import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse, DirectusMeta, DirectusListResponse } from '@repo/shared';
import { buildDirectusQuery } from '@shared/directus/utils/build-directus-query';
import { translateDirectusError } from '@shared/directus/utils/translate-directus-error';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';

@Injectable()
@QueryHandler(DirectusListItemsQuery)
export class DirectusListItemsHandler
  implements IQueryHandler<DirectusListItemsQuery, DirectusListResponse<unknown>>
{
  constructor(private readonly http: HttpService) {}

  async execute(query: DirectusListItemsQuery): Promise<DirectusListResponse<unknown>> {
    const params = { ...query.params, meta: query.params.meta ?? DirectusMeta.BOTH };
    const qs = buildDirectusQuery(params);
    const path = `/items/${encodeURIComponent(query.collection)}${qs ? `?${qs}` : ''}`;

    const res: AxiosResponse<DirectusListResponse<unknown>> = await firstValueFrom(
      this.http.get<DirectusListResponse<unknown>>(path).pipe(
        catchError((error: AxiosError<DirectusErrorResponse>) => {
          throw translateDirectusError(error);
        }),
      ),
    );
    return res.data;
  }
}
