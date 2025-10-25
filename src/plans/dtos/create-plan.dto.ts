import { IsString, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreatePlanDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsBoolean()
    @IsNotEmpty()
    isActive: boolean;
}