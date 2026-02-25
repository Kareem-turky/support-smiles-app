import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateTargetDto {
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsString()
    @IsOptional()
    userId?: string;

    @IsString()
    metricName: string;

    @IsNumber()
    targetValue: number;

    @IsString()
    period: string;

    @IsNumber()
    weight: number;
}
