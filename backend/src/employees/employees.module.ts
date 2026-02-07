import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EmployeesController],
    providers: [EmployeesService],
    exports: [EmployeesService], // Export service for Payroll usage later
})
export class EmployeesModule { }
