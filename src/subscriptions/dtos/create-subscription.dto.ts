
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  // 👤 User subscribing (in real use, you’d get this from JWT)
  @IsNotEmpty()
  @IsString()
  userId: string;

  // 🧩 Selected plan
  @IsNotEmpty()
  @IsString()
  planId: string;

  // ⏰ Optional start date (can be set automatically)
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // ⏰ Optional end date (can be set automatically)
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🏷️ Initial subscription status
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus = SubscriptionStatus.PENDING;

  // 🔁 Auto-renew preference
  @IsOptional()
  @IsBoolean()
  isAutoRenew?: boolean = true;
}
