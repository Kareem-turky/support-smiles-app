import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreateOrderDto {
    @IsString()
    @IsOptional()
    customer_name?: string;

    @IsString()
    @IsNotEmpty()
    department_id: string;

    @IsString()
    @IsOptional()
    assigned_employee_id?: string;

    @IsString()
    @IsOptional()
    shipping_company_id?: string;

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
