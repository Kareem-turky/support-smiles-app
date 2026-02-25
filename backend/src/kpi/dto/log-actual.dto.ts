import { IsString, IsNumber, IsOptional } from 'class-validator';

export class LogActualDto {
    @IsString()
    userId: string;

    @IsString()
    metricName: string;

    @IsString()
    periodKey: string;

    @IsNumber()
    actualValue: number;
}
