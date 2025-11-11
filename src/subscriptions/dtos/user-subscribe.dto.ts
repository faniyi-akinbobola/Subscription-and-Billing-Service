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

export class UserSubscribeDto {
  // 🧩 Selected plan (required)
  @ApiProperty({
    description: 'ID of the subscription plan to subscribe to',
    example: 'plan_123456789',
  })
  @IsNotEmpty()
  @IsString()
  planId: string;

  // ⏰ Optional start date (defaults to now if not provided)
  @ApiPropertyOptional({
    description: 'Subscription start date (ISO string). Defaults to now if not provided',
    example: '2025-11-11T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // ⏰ Optional end date (calculated based on plan duration if not provided)
  @ApiPropertyOptional({
    description: 'Subscription end date (ISO string). Calculated automatically if not provided',
    example: '2025-12-11T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🏷️ Initial subscription status (defaults to PENDING)
  @ApiPropertyOptional({
    description: 'Initial subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.PENDING,
    default: SubscriptionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus = SubscriptionStatus.PENDING;

  // 🔁 Auto-renew preference (defaults to true)
  @ApiPropertyOptional({
    description: 'Whether subscription should auto-renew',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAutoRenew?: boolean = true;
}
