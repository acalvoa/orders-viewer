import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { BadGatewayException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { DirectusListResponse, DirectusErrorResponse } from '@repo/shared';
import { DirectusListItemsHandler } from './directus-list-items.handler';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';

interface MockItem { id: string }

function mockResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as AxiosResponse['config'] };
}

function mockAxiosError(status: number, message: string): AxiosError<DirectusErrorResponse> {
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

describe('DirectusListItemsHandler', () => {
  let handler: DirectusListItemsHandler;
  let httpService: { get: jest.MockedFunction<HttpService['get']> };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectusListItemsHandler,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    handler = module.get<DirectusListItemsHandler>(DirectusListItemsHandler);
  });

  afterEach(() => jest.clearAllMocks());

  it('should call Directus with correct path and return response', async () => {
    const response: DirectusListResponse<MockItem> = {
      data: [{ id: '1' }],
      meta: { filter_count: 1 },
    };
    httpService.get.mockReturnValue(of(mockResponse(response)));

    const result = await handler.execute(
      new DirectusListItemsQuery('production_orders', { limit: 10, page: 1 }),
    );

    expect(result).toEqual(response);
    const [path] = httpService.get.mock.calls[0];
    expect(path).toContain('/items/production_orders');
    expect(path).toContain('limit=10');
    expect(path).toContain('page=1');
  });

  it('should add meta=total_count,filter_count by default', async () => {
    httpService.get.mockReturnValue(of(mockResponse({ data: [], meta: {} })));
    await handler.execute(new DirectusListItemsQuery('col', {}));
    const [path] = httpService.get.mock.calls[0];
    expect(path).toContain('meta=total_count,filter_count');
  });

  it('should translate 404 to NotFoundException', async () => {
    httpService.get.mockReturnValue(throwError(() => mockAxiosError(404, 'not found')));
    await expect(
      handler.execute(new DirectusListItemsQuery('col', {})),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should translate 401 to UnauthorizedException and 500 to BadGatewayException', async () => {
    httpService.get.mockReturnValue(throwError(() => mockAxiosError(401, 'unauthorized')));
    await expect(
      handler.execute(new DirectusListItemsQuery('col', {})),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    httpService.get.mockReturnValue(throwError(() => mockAxiosError(500, 'server error')));
    await expect(
      handler.execute(new DirectusListItemsQuery('col', {})),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
