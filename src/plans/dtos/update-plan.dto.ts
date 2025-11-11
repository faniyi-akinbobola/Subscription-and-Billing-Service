import { IsOptional, IsString, IsNumber, IsBoolean } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlanDto {
    @ApiProperty({
        description: 'Plan name',
        example: 'Updated Premium Plan',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Plan description',
        example: 'Updated description with new features',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Plan price in cents',
        example: 3999,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiProperty({
        description: 'Whether the plan is active',
        example: false,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'Billing interval',
        example: 'yearly',
        required: false,
    })
    @IsOptional()
    @IsString()
    interval?: string;
}