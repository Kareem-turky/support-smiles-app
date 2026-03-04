import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTargetDto {
    @IsString()
    @IsOptional()
    employeeId?: string;

    @IsString()
    @IsOptional()
    employee_code?: string;

    @IsString()
    metric: string;

    @IsNumber()
    targetValue: number;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsNumber()
    weight?: number;
}
