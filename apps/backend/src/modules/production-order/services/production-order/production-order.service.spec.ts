import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DirectusListResponse, ProductionOrderStatus, RescheduleProposal } from '@repo/shared';
import { ProductionOrderService } from './production-order.service';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { GetProductionOrdersQuery } from '@modules/production-order/queries/declarations/get-production-orders.query';
import { GetProductionOrderQuery } from '@modules/production-order/queries/declarations/get-production-order.query';
import { SimulateRescheduleQuery } from '@modules/production-order/queries/declarations/simulate-reschedule.query';
import { RescheduleConflictsCommand } from '@modules/production-order/commands/declarations/reschedule-conflicts.command';

const mockRaw: DirectusProductionOrder = {
  id: 'order-1',
  reference: 'REF-001',
  product: 'Widget A',
  quantity: 10,
  startDate: '2025-06-01T00:00:00Z',
  endDate: '2025-06-15T00:00:00Z',
  status: ProductionOrderStatus.PLANNED,
  createdAt: '2025-05-20T00:00:00Z',
};

describe('ProductionOrderService', () => {
  let service: ProductionOrderService;
  let queryBus: { execute: jest.MockedFunction<QueryBus['execute']> };
  let commandBus: { execute: jest.MockedFunction<CommandBus['execute']> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionOrderService,
        { provide: QueryBus, useValue: queryBus },
        { provide: CommandBus, useValue: commandBus },
      ],
    }).compile();

    service = module.get<ProductionOrderService>(ProductionOrderService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('should return paginated DTOs mapped from raw Directus data', async () => {
      const raw: DirectusListResponse<DirectusProductionOrder> = {
        data: [mockRaw],
        meta: { filter_count: 1 },
      };
      queryBus.execute.mockResolvedValue(raw);

      const result = await service.list({}, { page: 1, size: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].startDate).toBe(mockRaw.startDate);
      expect(result.data[0].endDate).toBe(mockRaw.endDate);
      expect(result.data[0].createdAt).toBe(mockRaw.createdAt);
      expect(result.page).toBe(1);
      expect(result.size).toBe(20);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should dispatch GetProductionOrdersQuery with domain filters and pagination', async () => {
      queryBus.execute.mockResolvedValue({ data: [], meta: { filter_count: 0 } });

      const filters = { status: ProductionOrderStatus.IN_PROGRESS, reference: 'REF' };
      const pagination = { page: 2, size: 10 };

      await service.list(filters, pagination);

      const called = queryBus.execute.mock.calls[0][0] as GetProductionOrdersQuery;
      expect(called).toBeInstanceOf(GetProductionOrdersQuery);
      expect(called.filters).toBe(filters);
      expect(called.pagination).toBe(pagination);
    });

    it('should return correct pagination for empty result', async () => {
      queryBus.execute.mockResolvedValue({ data: [], meta: { filter_count: 0 } });

      const result = await service.list({}, { page: 1, size: 20 });

      expect(result).toEqual({ data: [], page: 1, size: 20, pages: 1, total: 0 });
    });

    it('should propagate errors from the query bus', async () => {
      queryBus.execute.mockRejectedValue(new Error('db error'));
      await expect(service.list({}, { page: 1, size: 20 })).rejects.toThrow('db error');
    });
  });

  describe('get', () => {
    it('should return mapped DTO when order exists', async () => {
      queryBus.execute.mockResolvedValue(mockRaw);

      const result = await service.get('order-1');

      expect(result.id).toBe('order-1');
      expect(result.reference).toBe('REF-001');
      expect(result.startDate).toBe('2025-06-01T00:00:00Z');
    });

    it('should dispatch GetProductionOrderQuery with the id', async () => {
      queryBus.execute.mockResolvedValue(mockRaw);

      await service.get('order-1');

      const called = queryBus.execute.mock.calls[0][0] as GetProductionOrderQuery;
      expect(called).toBeInstanceOf(GetProductionOrderQuery);
      expect(called.id).toBe('order-1');
    });

    it('should throw NotFoundException when handler returns null', async () => {
      queryBus.execute.mockResolvedValue(null);
      await expect(service.get('nonexistent')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('simulateReschedule', () => {
    it('should dispatch SimulateRescheduleQuery and return proposals', async () => {
      const proposals: RescheduleProposal[] = [
        {
          id: 'order-1',
          currentStartDate: '2025-01-01',
          currentEndDate: '2025-01-10',
          proposedStartDate: '2025-01-11',
          proposedEndDate: '2025-01-20',
        },
      ];
      queryBus.execute.mockResolvedValue(proposals);

      const result = await service.simulateReschedule();

      const called = queryBus.execute.mock.calls[0][0];
      expect(called).toBeInstanceOf(SimulateRescheduleQuery);
      expect(result).toBe(proposals);
    });
  });

  describe('rescheduleConflicts', () => {
    it('should dispatch RescheduleConflictsCommand and return rescheduled count', async () => {
      commandBus.execute.mockResolvedValue({ rescheduled: 3 });

      const result = await service.rescheduleConflicts();

      const called = commandBus.execute.mock.calls[0][0];
      expect(called).toBeInstanceOf(RescheduleConflictsCommand);
      expect(result).toEqual({ rescheduled: 3 });
    });
  });
});
