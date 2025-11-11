import { IsOptional, IsDateString } from 'class-validator';

export class RenewPlanDto {
  @IsOptional()
  @IsDateString()
  customEndDate?: string;
}
