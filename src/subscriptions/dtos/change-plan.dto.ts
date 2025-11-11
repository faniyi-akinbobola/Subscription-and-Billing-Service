import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePlanDto {
  @IsNotEmpty()
  @IsString()
  newPlanId: string;
}
