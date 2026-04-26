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
  type UpdateProductionOrderDto as IUpdate,
  ProductionOrderStatus,
} from '@repo/shared';

export class UpdateProductionOrderDto implements IUpdate {
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ProductionOrderStatus)
  status?: ProductionOrderStatus;
}
