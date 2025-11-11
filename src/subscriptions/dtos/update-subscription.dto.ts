import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class UpdateSubscriptionDto {
  // 🏷️ Update subscription status
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  // ⏰ Update subscription end date
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🔁 Toggle auto-renew
  @IsOptional()
  @IsBoolean()
  isAutoRenew?: boolean;

  // 📅 Update renewal timestamp
  @IsOptional()
  @IsDateString()
  renewedAt?: string;

  // 📈 Optional: update renewal count (for admin)
  @IsOptional()
  @IsNumber()
  renewalCount?: number;
}

