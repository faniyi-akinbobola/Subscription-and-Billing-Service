
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  // 👤 User subscribing (in real use, you'd get this from JWT)
  @ApiProperty({
    description: 'ID of the user creating the subscription',
    example: 'user_123456789',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  // 🧩 Selected plan
  @ApiProperty({
    description: 'ID of the subscription plan to create',
    example: 'plan_premium_monthly',
  })
  @IsNotEmpty()
  @IsString()
  planId: string;

  // ⏰ Optional start date (can be set automatically)
  @ApiPropertyOptional({
    description: 'Subscription start date (ISO string). Defaults to current date if not provided',
    example: '2025-11-11T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // ⏰ Optional end date (can be set automatically)
  @ApiPropertyOptional({
    description: 'Subscription end date (ISO string). Calculated from plan duration if not provided',
    example: '2025-12-11T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🏷️ Initial subscription status
  @ApiPropertyOptional({
    description: 'Initial subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.PENDING,
    default: SubscriptionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus = SubscriptionStatus.PENDING;

  // 🔁 Auto-renew preference
  @ApiPropertyOptional({
    description: 'Whether subscription should automatically renew',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAutoRenew?: boolean = true;
}
