import { IsNotEmpty, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { Priority, IssueType, TicketStatus } from '@prisma/client';

export class CreateIssueDto {
    @IsNotEmpty()
    @IsString()
    source: string;

    @IsNotEmpty()
    @IsString()
    external_id: string;

    @IsNotEmpty()
    @IsString()
    order_number: string;

    @IsNotEmpty()
    @IsEnum(IssueType)
    issue_type: IssueType;

    @IsNotEmpty()
    @IsEnum(Priority)
    priority: Priority;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    courier_company?: string;

    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;

    @IsOptional()
    @IsString()
    reason_id?: string;
}

export class CreateMessageDto {
    @IsNotEmpty()
    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    sender_id?: string; // If null, treated as system/integration
}

export class UpdateStatusDto {
    @IsNotEmpty()
    @IsEnum(TicketStatus)
    status: TicketStatus;
}
