import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dev')
export class DevController {
  constructor(private prisma: PrismaService) {}

  @Get('audit')
  async audit() {
    const counts = {
      users: await this.prisma.user.count(),
      employees: await this.prisma.employee.count(),
      tickets: await this.prisma.ticket.count(),
      orders: await this.prisma.order.count(),
      payroll_runs: await this.prisma.payrollRun.count(),
      gamification_points: await this.prisma.gamificationPoint.count(),
      gamification_badges: await this.prisma.userBadge.count(),
      audit_logs: await this.prisma.integrationAuditLog.count(),
    };

    const health = {
      database: 'CONNECTED', // If we got here, DB is up
      timestamp: new Date().toISOString(),
    };

    return { health, counts };
  }
}
