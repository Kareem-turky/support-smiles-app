import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  department_id?: string;

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

  @IsString()
  @IsOptional()
  customer_name?: string;
}
