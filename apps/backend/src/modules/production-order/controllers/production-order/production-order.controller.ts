import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { OrderStats, Paginated, RescheduleProposal } from '@repo/shared';
import { ListProductionOrdersQueryDto } from '@modules/production-order/dtos/list-production-orders-query.dto';
import { CreateProductionOrderDto } from '@modules/production-order/dtos/create-production-order.dto';
import { UpdateProductionOrderDto } from '@modules/production-order/dtos/update-production-order.dto';
import { ProductionOrderDto } from '@modules/production-order/dtos/production-order.dto';
import { ProductionOrderService } from '@modules/production-order/services/production-order/production-order.service';

@Controller('production-orders')
export class ProductionOrderController {
  constructor(private readonly service: ProductionOrderService) {}

  @Get()
  list(@Query() query: ListProductionOrdersQueryDto): Promise<Paginated<ProductionOrderDto>> {
    return this.service.list(query, query);
  }

  @Post()
  create(@Body() dto: CreateProductionOrderDto): Promise<ProductionOrderDto> {
    return this.service.create(dto);
  }

  @Get('stats')
  getStats(): Promise<OrderStats> {
    return this.service.getStats();
  }

  @Get('conflicts/reschedules')
  simulateReschedule(): Promise<RescheduleProposal[]> {
    return this.service.simulateReschedule();
  }

  @Post('conflicts/reschedules')
  rescheduleConflicts(): Promise<{ rescheduled: number }> {
    return this.service.rescheduleConflicts();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<ProductionOrderDto> {
    return this.service.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductionOrderDto,
  ): Promise<ProductionOrderDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string): Promise<void> {
    return this.service.delete(id);
  }
}
