import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateEmployeeDto) {
        return this.prisma.employee.create({
            data: {
                ...data,
                start_date: new Date(data.start_date),
            },
        });
    }

    async findAll(activeOnly: boolean = false) {
        const where = activeOnly ? { is_active: true } : {};
        return this.prisma.employee.findMany({
            where,
            orderBy: { full_name: 'asc' },
        });
    }

    async findOne(id: string) {
        const employee = await this.prisma.employee.findUnique({ where: { id } });
        if (!employee) throw new NotFoundException('Employee not found');
        return employee;
    }

    async update(id: string, data: UpdateEmployeeDto) {
        await this.findOne(id); // Ensure exists
        return this.prisma.employee.update({
            where: { id },
            data: {
                ...data,
                start_date: data.start_date ? new Date(data.start_date) : undefined,
            },
        });
    }
}
