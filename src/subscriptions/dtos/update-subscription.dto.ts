import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class UpdateSubscriptionDto {
  // 🏷️ Update subscription status
  @ApiPropertyOptional({
    description: 'Update subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  // ⏰ Update subscription end date
  @ApiPropertyOptional({
    description: 'Update subscription end date',
    example: '2025-12-11T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🔁 Toggle auto-renew
  @ApiPropertyOptional({
    description: 'Toggle auto-renewal setting',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAutoRenew?: boolean;

  // 📅 Update renewal timestamp
  @ApiPropertyOptional({
    description: 'Update last renewal timestamp',
    example: '2025-11-11T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  renewedAt?: string;

  // 📈 Optional: update renewal count (for admin)
  @ApiPropertyOptional({
    description: 'Update renewal count (admin only)',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  renewalCount?: number;
}

