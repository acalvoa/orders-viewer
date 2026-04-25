import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse, DirectusMeta, DirectusListResponse } from '@repo/shared';
import {
  buildDirectusQuery,
  directusAuthHeaders,
  translateDirectusError,
} from '@shared/directus/directus-http.utils';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';

@Injectable()
@QueryHandler(DirectusListItemsQuery)
export class DirectusListItemsHandler
  implements IQueryHandler<DirectusListItemsQuery, DirectusListResponse<unknown>>
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

  async execute(
    query: DirectusListItemsQuery,
  ): Promise<DirectusListResponse<unknown>> {
    const params = {
      ...query.params,
      meta: query.params.meta ?? DirectusMeta.BOTH,
    };
    const qs = buildDirectusQuery(params);
    const url = `${this.baseUrl}/items/${encodeURIComponent(query.collection)}${qs ? `?${qs}` : ''}`;

    const res: AxiosResponse<DirectusListResponse<unknown>> =
      await firstValueFrom(
        this.http
          .get<DirectusListResponse<unknown>>(url, {
            headers: directusAuthHeaders(this.token),
          })
          .pipe(
            catchError((error: AxiosError<DirectusErrorResponse>) => {
              throw translateDirectusError(error);
            }),
          ),
      );
    return res.data;
  }
}
