import { IsNotEmpty, IsEnum, IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {
    @IsNotEmpty()
    @IsUUID()
    employee_id: string;

    @IsNotEmpty()
    @IsDateString()
    from_date: string;

    @IsNotEmpty()
    @IsDateString()
    to_date: string;

    @IsNotEmpty()
    @IsEnum(LeaveType)
    leave_type: LeaveType;

    @IsOptional()
    @IsString()
    notes?: string;
}
