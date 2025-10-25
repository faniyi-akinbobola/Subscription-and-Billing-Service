import { IsOptional, IsString, IsNumber, IsBoolean } from "class-validator";

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}