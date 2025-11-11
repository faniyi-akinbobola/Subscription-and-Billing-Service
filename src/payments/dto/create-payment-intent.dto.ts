import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
}

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Payment amount in cents (e.g., 2999 for $29.99)',
    example: 2999,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number; // Amount in cents

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    enum: Currency,
    default: Currency.USD,
  })
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency = Currency.USD;

  @ApiProperty({
    description: 'Stripe payment method ID (for automatic confirmation)',
    example: 'pm_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Stripe customer ID to associate with payment',
    example: 'cus_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    description: 'Payment description for receipt',
    example: 'Premium subscription payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Additional payment metadata',
    example: { orderId: '12345', userId: '67890' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
