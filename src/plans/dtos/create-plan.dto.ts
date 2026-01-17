import {
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Premium Monthly Plan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Premium subscription with all features included',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Plan price in cents (e.g., 2999 for $29.99)',
    example: 2999,
    minimum: 1,
    maximum: 99999999,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'Price must be at least 1 cent' })
  @Max(99999999, { message: 'Price cannot exceed $999,999.99' })
  price: number;

  @ApiProperty({
    description: 'Whether the plan is active and available for purchase',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty({
    description: 'Billing interval for the plan',
    example: 'monthly',
    required: false,
  })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    default: 'usd',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
