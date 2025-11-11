import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPaymentIntentDto {
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;

  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;
}
