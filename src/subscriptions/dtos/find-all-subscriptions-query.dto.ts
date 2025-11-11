import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class FindAllSubscriptionsQuery {
  // 🔎 Filter by subscription status
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  // 🔎 Filter by specific user
  @IsOptional()
  @IsUUID()
  userId?: string;

  // 🔎 Filter by plan
  @IsOptional()
  @IsUUID()
  planId?: string;

  // 🔎 Filter by auto-renew setting
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isAutoRenew?: boolean;

  // 📄 Pagination: which page number
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  // 📄 Pagination: items per page
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}
