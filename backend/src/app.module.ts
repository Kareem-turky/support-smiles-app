import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { TicketReasonsModule } from './ticket-reasons/ticket-reasons.module';
import { EmployeesModule } from './employees/employees.module';
import { HRModule } from './hr/hr.module';
import { AccountingModule } from './accounting/accounting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    NotificationsModule,
    MessagesModule,
    MessagesModule,
    IntegrationsModule,
    TicketReasonsModule,
    EmployeesModule,
    HRModule,
    AccountingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
