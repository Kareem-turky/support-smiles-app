import { IsString, IsNumber, IsOptional } from 'class-validator';

export class LogActualDto {
  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  employee_code?: string;

  @IsString()
  metric: string;

  @IsNumber()
  actualValue: number;

  @IsOptional()
  @IsString()
  date?: string;
}
