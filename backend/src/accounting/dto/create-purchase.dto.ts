import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  ValidateNested,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  item_name: string;

  @IsNumber()
  @IsNotEmpty()
  qty: number;

  @IsNumber()
  @IsNotEmpty()
  unit_price: number;
}

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  vendor_id: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
