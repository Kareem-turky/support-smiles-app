import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateShippingCompanyDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
