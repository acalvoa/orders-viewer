import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductionOrderStatus } from '@repo/shared';
import { PageOptionsDto } from './page-options.dto';

export class ListProductionOrdersQueryDto extends PageOptionsDto {
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
