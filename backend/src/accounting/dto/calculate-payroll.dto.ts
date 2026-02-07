import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CalculatePayrollDto {
    @IsNotEmpty()
    @IsNumber()
    year: number;

    @IsNotEmpty()
    @IsNumber()
    month: number;
}
