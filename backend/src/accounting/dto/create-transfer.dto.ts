import { IsNotEmpty, IsEnum, IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';
import { TransferMethod } from '@prisma/client';

export class CreateTransferDto {
    @IsNotEmpty()
    @IsString()
    type: string;

    @IsOptional()
    @IsString()
    reference_id?: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsEnum(TransferMethod)
    method: TransferMethod;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
