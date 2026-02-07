import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseItemDto {
    @IsNotEmpty()
    @IsString()
    item_name: string;

    @IsNotEmpty()
    @IsNumber()
    qty: number;

    @IsNotEmpty()
    @IsNumber()
    unit_price: number;
}

export class CreatePurchaseDto {
    @IsNotEmpty()
    @IsString()
    vendor_name: string;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PurchaseItemDto)
    items?: PurchaseItemDto[];
}
