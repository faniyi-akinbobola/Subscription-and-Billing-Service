import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentIntentDto {
  @ApiProperty({
    description: 'Stripe Payment Intent ID to confirm',
    example: 'pi_1234567890abcdef',
  })
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;

  @ApiProperty({
    description: 'Stripe Payment Method ID for confirmation',
    example: 'pm_1234567890abcdef',
  })
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;
}
