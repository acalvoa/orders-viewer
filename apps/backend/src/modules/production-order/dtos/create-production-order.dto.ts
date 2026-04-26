import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  type CreateProductionOrderDto as ICreate,
  ProductionOrderStatus,
} from '@repo/shared';

export class CreateProductionOrderDto implements ICreate {
  @IsString()
  reference!: string;

  @IsString()
  product!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(ProductionOrderStatus)
  status?: ProductionOrderStatus;
}
