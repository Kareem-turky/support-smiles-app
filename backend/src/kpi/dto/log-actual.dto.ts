import { IsString, IsNumber, IsOptional } from 'class-validator';

export class LogActualDto {
    @IsString()
    employeeId: string;

    @IsString()
    metric: string;

    @IsNumber()
    actualValue: number;

    @IsOptional()
    @IsString()
    date?: string;
}
