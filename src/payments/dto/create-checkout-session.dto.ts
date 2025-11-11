import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Currency } from './create-payment-intent.dto';

export class CreateCheckoutSessionDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number; // Amount in cents

  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency = Currency.USD;

  @IsNotEmpty()
  @IsUrl()
  success_url: string;

  @IsNotEmpty()
  @IsUrl()
  cancel_url: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
