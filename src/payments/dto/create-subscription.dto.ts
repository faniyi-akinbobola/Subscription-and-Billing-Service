import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from './create-payment-intent.dto';

export class CreateStripeSubscriptionDto {
  @ApiProperty({
    description: 'Stripe customer ID',
    example: 'cus_1234567890abcdef',
  })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Stripe price ID for the subscription plan',
    example: 'price_1234567890abcdef',
  })
  @IsNotEmpty()
  @IsString()
  priceId: string; // Stripe price ID

  @ApiProperty({
    description: 'Payment method ID for automatic payments',
    example: 'pm_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Subscription currency',
    enum: Currency,
    default: Currency.USD,
    required: false,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.USD;

  @ApiProperty({
    description: 'Additional subscription metadata',
    example: { planType: 'premium', userId: '12345' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
