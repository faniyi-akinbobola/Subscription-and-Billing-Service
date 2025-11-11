import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { Currency } from './create-payment-intent.dto';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  priceId: string; // Stripe price ID

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.USD;

  @IsOptional()
  metadata?: Record<string, any>;
}
