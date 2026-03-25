import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateIssueDto {
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsString()
    @IsOptional()
    date: string;

    @IsString()
    @IsNotEmpty()
    severity: string;

    @IsNumber()
    deductionPoints: number;
}
