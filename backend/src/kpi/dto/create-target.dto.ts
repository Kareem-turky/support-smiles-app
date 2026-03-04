import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTargetDto {
    @IsString()
    employeeId: string;

    @IsString()
    metric: string;

    @IsNumber()
    targetValue: number;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsNumber()
    weight?: number;
}
