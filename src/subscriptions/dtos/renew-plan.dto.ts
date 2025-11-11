import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RenewPlanDto {
  @ApiPropertyOptional({
    description: 'Custom end date for the renewal period. If not provided, defaults to plan duration from now',
    example: '2025-12-11T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  customEndDate?: string;
}
