import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateDepositDto {
  @IsString()
  @IsNotEmpty()
  vendor_id: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsOptional()
  profit_loss?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
