import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateSubscriptionWithPaymentDto {
  @IsNotEmpty()
  @IsString()
  planId: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  stripeCustomerId?: string;

  @IsOptional()
  @IsNumber()
  customAmount?: number; // For custom pricing

  @IsOptional()
  metadata?: Record<string, any>;
}
