import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { EmployeeSalaryType } from '@prisma/client';

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    full_name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    department_id?: string;

    @IsDateString()
    @IsNotEmpty()
    start_date: string;

    @IsNumber()
    @IsNotEmpty()
    base_salary: number;

    @IsEnum(EmployeeSalaryType)
    @IsOptional()
    salary_type?: EmployeeSalaryType;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
