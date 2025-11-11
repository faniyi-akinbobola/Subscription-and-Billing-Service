import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePlanDto {
  @ApiProperty({
    description: 'ID of the new subscription plan to change to',
    example: 'plan_premium_monthly',
  })
  @IsNotEmpty()
  @IsString()
  newPlanId: string;
}
