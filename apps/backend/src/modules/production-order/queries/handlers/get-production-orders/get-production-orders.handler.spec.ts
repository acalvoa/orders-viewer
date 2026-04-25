import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { DirectusListResponse, DirectusOperator, ProductionOrderStatus } from '@repo/shared';
import { DirectusListItemsQuery } from '@shared/directus/queries/declarations/directus-list-items.query';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { GetProductionOrdersQuery } from '@modules/production-order/queries/declarations/get-production-orders.query';
import { GetProductionOrdersHandler } from './get-production-orders.handler';

const mockRaw: DirectusProductionOrder = {
  id: '1',
  reference: 'REF-001',
  product: 'Widget A',
  quantity: 10,
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-15T00:00:00Z',
  status: ProductionOrderStatus.PLANNED,
  createdAt: '2025-01-01T00:00:00Z',
};

describe('GetProductionOrdersHandler', () => {
  let handler: GetProductionOrdersHandler;
  let queryBus: { execute: jest.MockedFunction<QueryBus['execute']> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductionOrdersHandler,
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    handler = module.get<GetProductionOrdersHandler>(GetProductionOrdersHandler);
  });

  afterEach(() => jest.clearAllMocks());

  it('should delegate to DirectusListItemsQuery and return the response', async () => {
    const response: DirectusListResponse<DirectusProductionOrder> = {
      data: [mockRaw],
      meta: { filter_count: 1 },
    };
    queryBus.execute.mockResolvedValue(response);

    const result = await handler.execute(
      new GetProductionOrdersQuery({}, { page: 1, size: 20 }),
    );

    expect(result).toBe(response);
    const called = queryBus.execute.mock.calls[0][0] as DirectusListItemsQuery;
    expect(called).toBeInstanceOf(DirectusListItemsQuery);
    expect(called.collection).toBe('production_orders');
  });

  it('should build the correct Directus filter from domain filters', async () => {
    queryBus.execute.mockResolvedValue({ data: [], meta: { filter_count: 0 } });

    await handler.execute(
      new GetProductionOrdersQuery(
        {
          status: ProductionOrderStatus.IN_PROGRESS,
          product: 'Widget A',
          reference: 'REF',
          startDateFrom: '2025-01-01',
          startDateTo: '2025-12-31',
        },
        { page: 2, size: 10, sort: 'reference' },
      ),
    );

    const called = queryBus.execute.mock.calls[0][0] as DirectusListItemsQuery;
    expect(called.params.filter).toMatchObject({
      status: { [DirectusOperator.EQ]: ProductionOrderStatus.IN_PROGRESS },
      product: { [DirectusOperator.EQ]: 'Widget A' },
      reference: { [DirectusOperator.CONTAINS]: 'REF' },
      startDate: { [DirectusOperator.GTE]: '2025-01-01', [DirectusOperator.LTE]: '2025-12-31' },
    });
    expect(called.params.page).toBe(2);
    expect(called.params.limit).toBe(10);
    expect(called.params.sort).toEqual(['reference']);
  });

  it('should propagate errors from the query bus', async () => {
    queryBus.execute.mockRejectedValue(new Error('network error'));
    await expect(
      handler.execute(new GetProductionOrdersQuery({}, { page: 1, size: 20 })),
    ).rejects.toThrow('network error');
  });

  it('should use default pagination and sort when none are provided', async () => {
    queryBus.execute.mockResolvedValue({ data: [], meta: { filter_count: 0 } });

    await handler.execute(new GetProductionOrdersQuery({}, { page: 1, size: 20 }));

    const called = queryBus.execute.mock.calls[0][0] as DirectusListItemsQuery;
    expect(called.params.page).toBe(1);
    expect(called.params.limit).toBe(20);
    expect(called.params.sort).toEqual(['-createdAt']);
    expect(called.params.filter).toBeUndefined();
  });
});
