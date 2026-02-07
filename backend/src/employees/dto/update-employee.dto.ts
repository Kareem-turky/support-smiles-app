import { PartialType } from '@nestjs/swagger'; // Assuming swagger is used, standard mapped types otherwise
import { CreateEmployeeDto } from './create-employee.dto';
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { EmployeeSalaryType } from '@prisma/client';

export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    full_name?: string;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsNumber()
    base_salary?: number;

    @IsOptional()
    @IsEnum(EmployeeSalaryType)
    salary_type?: EmployeeSalaryType;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
