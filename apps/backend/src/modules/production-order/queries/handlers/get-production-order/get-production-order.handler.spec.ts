import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { ProductionOrderStatus } from '@repo/shared';
import { DirectusGetItemQuery } from '@shared/directus/queries/declarations/directus-get-item.query';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { GetProductionOrderQuery } from '@modules/production-order/queries/declarations/get-production-order.query';
import { GetProductionOrderHandler } from './get-production-order.handler';

const mockRaw: DirectusProductionOrder = {
  id: 'abc-123',
  reference: 'REF-001',
  product: 'Widget A',
  quantity: 5,
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-10T00:00:00Z',
  status: ProductionOrderStatus.IN_PROGRESS,
  createdAt: '2025-01-01T00:00:00Z',
};

describe('GetProductionOrderHandler', () => {
  let handler: GetProductionOrderHandler;
  let queryBus: { execute: jest.MockedFunction<QueryBus['execute']> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductionOrderHandler,
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    handler = module.get<GetProductionOrderHandler>(GetProductionOrderHandler);
  });

  afterEach(() => jest.clearAllMocks());

  it('should delegate to DirectusGetItemQuery with collection and id', async () => {
    queryBus.execute.mockResolvedValue(mockRaw);

    const result = await handler.execute(
      new GetProductionOrderQuery('abc-123'),
    );

    expect(result).toEqual(mockRaw);
    const called = queryBus.execute.mock.calls[0][0] as DirectusGetItemQuery;
    expect(called).toBeInstanceOf(DirectusGetItemQuery);
    expect(called.collection).toBe('production_orders');
    expect(called.id).toBe('abc-123');
    expect(called.fields).toEqual(['*']);
  });

  it('should return null when DirectusGetItemQuery throws NotFoundException', async () => {
    queryBus.execute.mockRejectedValue(new NotFoundException('not found'));

    const result = await handler.execute(
      new GetProductionOrderQuery('nonexistent'),
    );

    expect(result).toBeNull();
  });

  it('should re-throw non-NotFoundException errors', async () => {
    queryBus.execute.mockRejectedValue(new Error('network error'));
    await expect(
      handler.execute(new GetProductionOrderQuery('id')),
    ).rejects.toThrow('network error');
  });

  it('should always request all fields from Directus', async () => {
    queryBus.execute.mockResolvedValue(mockRaw);

    await handler.execute(new GetProductionOrderQuery('xyz'));

    const called = queryBus.execute.mock.calls[0][0] as DirectusGetItemQuery;
    expect(called.fields).toEqual(['*']);
  });
});
