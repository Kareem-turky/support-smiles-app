import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@RequirePermissions('security:permissions:manage')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('user/:userId')
  getUserPermissions(@Param('userId') userId: string) {
    return this.permissionsService.getUserPermissions(userId);
  }

  @Patch('user/:userId')
  updateUserPermission(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserPermissionDto,
  ) {
    return this.permissionsService.updateUserPermission(userId, dto);
  }

  @Delete('user/:userId/:permissionKey')
  removeUserPermission(
    @Param('userId') userId: string,
    @Param('permissionKey') permissionKey: string,
  ) {
    return this.permissionsService.removeUserPermission(userId, permissionKey);
  }
}
