import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { AdjustmentType } from '@prisma/client';

export class CreateAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @IsEnum(AdjustmentType)
  @IsNotEmpty()
  type: AdjustmentType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
