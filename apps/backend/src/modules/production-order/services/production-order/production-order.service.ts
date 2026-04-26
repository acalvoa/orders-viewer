import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  DirectusListResponse,
  OrderStats,
  Paginated,
  RescheduleProposal,
} from '@repo/shared';
import { GetProductionOrderQuery } from '@modules/production-order/queries/declarations/get-production-order.query';
import { GetProductionOrdersQuery } from '@modules/production-order/queries/declarations/get-production-orders.query';
import { SimulateRescheduleQuery } from '@modules/production-order/queries/declarations/simulate-reschedule.query';
import { GetOrderStatsQuery } from '@modules/production-order/queries/declarations/get-order-stats.query';
import { RescheduleConflictsCommand } from '@modules/production-order/commands/declarations/reschedule-conflicts.command';
import { CreateProductionOrderCommand } from '@modules/production-order/commands/declarations/create-production-order.command';
import { UpdateProductionOrderCommand } from '@modules/production-order/commands/declarations/update-production-order.command';
import { DeleteProductionOrderCommand } from '@modules/production-order/commands/declarations/delete-production-order.command';
import { PageOptionsDto } from '@modules/production-order/dtos/page-options.dto';
import { ProductionOrderFilterDto } from '@modules/production-order/dtos/production-order-filter.dto';
import { CreateProductionOrderDto } from '@modules/production-order/dtos/create-production-order.dto';
import { UpdateProductionOrderDto } from '@modules/production-order/dtos/update-production-order.dto';
import { DirectusProductionOrder } from '@modules/production-order/interfaces/directus-production-order.interface';
import { ProductionOrderDto } from '@modules/production-order/dtos/production-order.dto';

@Injectable()
export class ProductionOrderService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async list(
    filters: ProductionOrderFilterDto,
    pagination: PageOptionsDto,
  ): Promise<Paginated<ProductionOrderDto>> {
    const raw = await this.queryBus.execute<
      GetProductionOrdersQuery,
      DirectusListResponse<DirectusProductionOrder>
    >(new GetProductionOrdersQuery(filters, pagination));

    const data = raw.data.map((item) => ProductionOrderDto.fromDirectus(item));
    const total = raw.meta?.filter_count ?? raw.data.length;
    return {
      data,
      page: pagination.page,
      size: pagination.size,
      pages: Math.max(1, Math.ceil(total / pagination.size)),
      total,
    };
  }

  async get(id: string): Promise<ProductionOrderDto> {
    const raw = await this.queryBus.execute<
      GetProductionOrderQuery,
      DirectusProductionOrder | null
    >(new GetProductionOrderQuery(id));

    if (!raw) throw new NotFoundException(`ProductionOrder ${id} no existe`);
    return ProductionOrderDto.fromDirectus(raw);
  }

  getStats(): Promise<OrderStats> {
    return this.queryBus.execute<GetOrderStatsQuery, OrderStats>(
      new GetOrderStatsQuery(),
    );
  }

  simulateReschedule(): Promise<RescheduleProposal[]> {
    return this.queryBus.execute<SimulateRescheduleQuery, RescheduleProposal[]>(
      new SimulateRescheduleQuery(),
    );
  }

  rescheduleConflicts(): Promise<{ rescheduled: number }> {
    return this.commandBus.execute<
      RescheduleConflictsCommand,
      { rescheduled: number }
    >(new RescheduleConflictsCommand());
  }

  create(dto: CreateProductionOrderDto): Promise<ProductionOrderDto> {
    return this.commandBus.execute<
      CreateProductionOrderCommand,
      ProductionOrderDto
    >(new CreateProductionOrderCommand(dto));
  }

  update(
    id: string,
    dto: UpdateProductionOrderDto,
  ): Promise<ProductionOrderDto> {
    return this.commandBus.execute<
      UpdateProductionOrderCommand,
      ProductionOrderDto
    >(new UpdateProductionOrderCommand(id, dto));
  }

  delete(id: string): Promise<void> {
    return this.commandBus.execute<DeleteProductionOrderCommand, void>(
      new DeleteProductionOrderCommand(id),
    );
  }
}
