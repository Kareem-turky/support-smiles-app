import { IsNotEmpty, IsEnum, IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';
import { ClosingType } from '@prisma/client';

export class CreateClosingDto {
    @IsNotEmpty()
    @IsEnum(ClosingType)
    closing_type: ClosingType;

    @IsNotEmpty()
    @IsDateString()
    period_from: string;

    @IsNotEmpty()
    @IsDateString()
    period_to: string;

    @IsNotEmpty()
    @IsNumber()
    expected_amount: number;

    @IsNotEmpty()
    @IsNumber()
    actual_amount: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
