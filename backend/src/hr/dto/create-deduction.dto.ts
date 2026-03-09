import { IsNotEmpty, IsEnum, IsUUID, IsNumber, IsString } from 'class-validator';
import { DeductionType } from '@prisma/client';

export class CreateDeductionDto {
    @IsNotEmpty()
    @IsUUID()
    employee_id: string;

    @IsNotEmpty()
    @IsNumber()
    year: number;

    @IsNotEmpty()
    @IsNumber()
    month: number;

    @IsNotEmpty()
    @IsEnum(DeductionType)
    type: DeductionType;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsString()
    reason: string;
}
