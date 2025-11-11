import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from './create-payment-intent.dto';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Payment amount in cents',
    example: 2999,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number; // Amount in cents

  @ApiProperty({
    description: 'Payment currency',
    enum: Currency,
    example: Currency.USD,
  })
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency = Currency.USD;

  @ApiProperty({
    description: 'URL to redirect after successful payment',
    example: 'https://your-site.com/success',
    format: 'url',
  })
  @IsNotEmpty()
  @IsUrl()
  success_url: string;

  @ApiProperty({
    description: 'URL to redirect if payment is cancelled',
    example: 'https://your-site.com/cancel',
    format: 'url',
  })
  @IsNotEmpty()
  @IsUrl()
  cancel_url: string;

  @ApiPropertyOptional({
    description: 'Existing Stripe customer ID',
    example: 'cus_1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Premium subscription payment',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the payment',
    example: { orderId: '12345', userId: 'user_123' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
