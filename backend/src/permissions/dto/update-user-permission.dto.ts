import { IsString, IsEnum, IsUUID } from 'class-validator';
import { PermissionEffect } from '@prisma/client';

export class UpdateUserPermissionDto {
  @IsString()
  permission_key: string;

  @IsEnum(PermissionEffect)
  effect: PermissionEffect;
}
