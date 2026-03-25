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
import { HRModule } from './hr/hr.module';
import { AccountingModule } from './accounting/accounting.module';
import { ShippingModule } from './shipping/shipping.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { KpiModule } from './kpi/kpi.module';
import { GamificationModule } from './gamification/gamification.module';
import { DevModule } from './dev/dev.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    NotificationsModule,
    MessagesModule,
    IntegrationsModule,
    TicketReasonsModule,
    HRModule,
    AccountingModule,
    ShippingModule,
    OrdersModule,
    DashboardModule,
    KpiModule,
    GamificationModule,
    DevModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
