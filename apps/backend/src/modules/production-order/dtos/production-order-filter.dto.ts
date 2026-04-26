import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  type ProductionOrderFilter,
  ProductionOrderStatus,
} from '@repo/shared';

export class ProductionOrderFilterDto implements ProductionOrderFilter {
  @IsOptional()
  @IsEnum(ProductionOrderStatus)
  status?: ProductionOrderStatus;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;
}
