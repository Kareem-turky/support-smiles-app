import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { EmployeeSalaryType } from '@prisma/client';

export class CreateEmployeeDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsNotEmpty()
    @IsString()
    full_name: string;

    @IsNotEmpty()
    @IsDateString()
    start_date: string;

    @IsNotEmpty()
    @IsNumber()
    base_salary: number;

    @IsNotEmpty()
    @IsEnum(EmployeeSalaryType)
    salary_type: EmployeeSalaryType;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
