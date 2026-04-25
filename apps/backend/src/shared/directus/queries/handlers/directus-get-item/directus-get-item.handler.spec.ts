import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { DirectusErrorResponse } from '@repo/shared';
import { DirectusGetItemHandler } from './directus-get-item.handler';
import { DirectusGetItemQuery } from '@shared/directus/queries/declarations/directus-get-item.query';

const BASE_URL = 'http://directus:8055';
const TOKEN = 'test-token';

interface MockItem { id: string; name: string }

function mockResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as AxiosResponse['config'] };
}

function mockAxiosError(
  status: number,
  message: string,
): AxiosError<DirectusErrorResponse> {
  const err = new AxiosError<DirectusErrorResponse>(message);
  err.response = {
    status,
    statusText: String(status),
    data: { errors: [{ message, extensions: { code: 'ERROR' } }] },
    headers: {},
    config: {} as AxiosResponse['config'],
  };
  return err;
}

describe('DirectusGetItemHandler', () => {
  let handler: DirectusGetItemHandler;
  let httpService: { get: jest.MockedFunction<HttpService['get']> };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectusGetItemHandler,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              key === 'DIRECTUS_URL' ? BASE_URL : TOKEN,
          },
        },
      ],
    }).compile();

    handler = module.get<DirectusGetItemHandler>(DirectusGetItemHandler);
  });

  afterEach(() => jest.clearAllMocks());

  it('should call Directus and return data.data', async () => {
    const item: MockItem = { id: 'abc', name: 'order' };
    httpService.get.mockReturnValue(of(mockResponse({ data: item })));

    const result = await handler.execute(
      new DirectusGetItemQuery('production_orders', 'abc', ['*']),
    );

    expect(result).toEqual(item);
    const [url] = httpService.get.mock.calls[0];
    expect(url).toContain(`${BASE_URL}/items/production_orders/abc`);
    expect(url).toContain('fields=');
  });

  it('should build URL without query string when no fields are provided', async () => {
    httpService.get.mockReturnValue(of(mockResponse({ data: { id: '1' } })));
    await handler.execute(new DirectusGetItemQuery('col', 'id1'));
    const [url] = httpService.get.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/items/col/id1`);
  });

  it('should translate 404 to NotFoundException', async () => {
    httpService.get.mockReturnValue(
      throwError(() => mockAxiosError(404, 'not found')),
    );
    await expect(
      handler.execute(new DirectusGetItemQuery('col', 'bad-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should translate 403 to UnauthorizedException and 502 to BadGatewayException', async () => {
    httpService.get.mockReturnValue(
      throwError(() => mockAxiosError(403, 'forbidden')),
    );
    await expect(
      handler.execute(new DirectusGetItemQuery('col', 'id')),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    httpService.get.mockReturnValue(
      throwError(() => mockAxiosError(502, 'bad gateway')),
    );
    await expect(
      handler.execute(new DirectusGetItemQuery('col', 'id')),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
