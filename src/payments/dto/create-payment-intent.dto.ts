import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
}

export class CreatePaymentIntentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number; // Amount in cents

  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency = Currency.USD;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
