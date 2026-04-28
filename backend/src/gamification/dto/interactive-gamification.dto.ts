import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { UserRole, MissionFrequency } from '@prisma/client';

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role_scope?: UserRole;

  @IsString()
  @IsOptional()
  department_id?: string;

  @IsNumber()
  @IsNotEmpty()
  points: number;

  @IsNumber()
  @IsNotEmpty()
  target_value: number;

  @IsString()
  @IsNotEmpty()
  metric_key: string;

  @IsEnum(MissionFrequency)
  @IsOptional()
  frequency?: MissionFrequency;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}

export class AssignMissionDto {
  @IsArray()
  @IsString({ each: true })
  user_ids: string[];
}

export class SubmitDailyDoneDto {
  @IsArray()
  @IsNumber({}, { each: true })
  actual_units_by_hour: number[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReportIssueDto {
  @IsString()
  @IsNotEmpty()
  type: 'fatal' | 'non_fatal';

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  ref_type?: string;

  @IsString()
  @IsOptional()
  ref_id?: string;
}

export class RedeemRewardDto {
  @IsString()
  @IsNotEmpty()
  reward_id: string;
}
