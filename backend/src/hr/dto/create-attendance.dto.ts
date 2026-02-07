import { IsNotEmpty, IsEnum, IsUUID, IsNumber, IsOptional, IsDateString, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
    @IsNotEmpty()
    @IsUUID()
    employee_id: string;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsOptional()
    @IsNumber()
    minutes_late?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class BulkAttendanceDto {
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    items: {
        employee_id: string;
        status: AttendanceStatus;
        minutes_late?: number;
        notes?: string;
    }[];
}
