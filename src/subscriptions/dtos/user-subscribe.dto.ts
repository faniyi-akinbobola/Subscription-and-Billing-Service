import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class UserSubscribeDto {
  // 🧩 Selected plan (required)
  @IsNotEmpty()
  @IsString()
  planId: string;

  // ⏰ Optional start date (defaults to now if not provided)
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // ⏰ Optional end date (calculated based on plan duration if not provided)
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🏷️ Initial subscription status (defaults to PENDING)
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus = SubscriptionStatus.PENDING;

  // 🔁 Auto-renew preference (defaults to true)
  @IsOptional()
  @IsBoolean()
  isAutoRenew?: boolean = true;
}
