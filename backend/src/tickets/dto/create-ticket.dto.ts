import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { IssueType, Priority } from '@prisma/client';

export class CreateTicketDto {
    @IsNotEmpty()
    @IsString()
    order_number: string;

    @IsNotEmpty()
    @IsString()
    courier_company: string;

    @IsNotEmpty()
    @IsEnum(IssueType)
    issue_type: IssueType;

    @IsOptional()
    @IsEnum(Priority)
    priority?: Priority;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsUUID()
    assigned_to?: string;

    @IsNotEmpty()
    @IsUUID()
    reason_id: string;
}
