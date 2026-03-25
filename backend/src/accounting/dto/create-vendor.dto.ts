import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  vendor_name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
