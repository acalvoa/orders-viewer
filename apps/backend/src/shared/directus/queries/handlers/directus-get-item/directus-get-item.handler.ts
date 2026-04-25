import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DirectusErrorResponse, DirectusItemResponse } from '@repo/shared';
import {
  buildDirectusQuery,
  directusAuthHeaders,
  translateDirectusError,
} from '@shared/directus/directus-http.utils';
import { DirectusGetItemQuery } from '@shared/directus/queries/declarations/directus-get-item.query';

@Injectable()
@QueryHandler(DirectusGetItemQuery)
export class DirectusGetItemHandler
  implements IQueryHandler<DirectusGetItemQuery, unknown>
{
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly http: HttpService;

  constructor(http: HttpService, config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('DIRECTUS_URL');
    this.token = config.getOrThrow<string>('DIRECTUS_STATIC_TOKEN');
    this.http = http;
  }

  async execute(query: DirectusGetItemQuery): Promise<unknown> {
    const qs = query.fields?.length
      ? buildDirectusQuery({ fields: query.fields })
      : '';
    const url = `${this.baseUrl}/items/${encodeURIComponent(query.collection)}/${encodeURIComponent(query.id)}${qs ? `?${qs}` : ''}`;

    const res: AxiosResponse<DirectusItemResponse<unknown>> =
      await firstValueFrom(
        this.http
          .get<DirectusItemResponse<unknown>>(url, {
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
