import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './dto/create-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { HRMonthStatus, User, HRAttendance, EmployeeSalaryType, AttendanceStatus } from '@prisma/client';

@Injectable()
export class HRService {
    constructor(
        private prisma: PrismaService,
        private gamificationService: GamificationService,
    ) { }

    // --- Helpers ---
    private async ensureMonthEditable(year: number, month: number) {
        const hrMonth = await this.prisma.hRMonth.findUnique({
            where: { year_month: { year, month } }
        });
        if (hrMonth && (hrMonth.status === HRMonthStatus.SUBMITTED || hrMonth.status === HRMonthStatus.LOCKED)) {
            throw new ForbiddenException(`HR records for ${year}-${month} are ${hrMonth.status} and cannot be edited.`);
        }
    }

    private getDateYearMonth(dateStr: string | Date) {
        const d = new Date(dateStr);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }

    // --- Departments ---
    async getDepartments() {
        return this.prisma.department.findMany({
            include: { _count: { select: { employees: true } } }
        });
    }

    async createDepartment(dto: CreateDepartmentDto) {
        return this.prisma.department.create({
            data: { name: dto.name }
        });
    }

    // --- Employees ---
    async getEmployees() {
        return this.prisma.employee.findMany({
            include: { department: true, user: { select: { email: true } } },
            orderBy: { full_name: 'asc' }
        });
    }

    async createEmployee(dto: CreateEmployeeDto) {
        const count = await this.prisma.employee.count();
        const code = `EMP${String(count + 1).padStart(3, '0')}`;

        return this.prisma.employee.create({
            data: {
                code,
                full_name: dto.full_name,
                // Email is on User, not Employee
                department_id: dto.department_id,
                start_date: new Date(dto.start_date),
                base_salary: dto.base_salary,
                salary_type: dto.salary_type || EmployeeSalaryType.MONTHLY,
                // is_active/phone/position not in schema subset seen, assuming excluded.
            }
        });
    }

    // --- Adjustments (Bonus/Deduction/Advance) ---
    async getAdjustments(employeeId?: string, from?: string, to?: string) {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        if (from && to) {
            where.date = { gte: new Date(from), lte: new Date(to) };
        }
        return this.prisma.hRAdjustment.findMany({
            where,
            include: { employee: true },
            orderBy: { date: 'desc' }
        });
    }

    async createAdjustment(dto: CreateAdjustmentDto, user: User) {
        const { year, month } = this.getDateYearMonth(dto.date);
        await this.ensureMonthEditable(year, month);

        return this.prisma.hRAdjustment.create({
            data: {
                employee_id: dto.employee_id,
                type: dto.type,
                amount: dto.amount,
                date: new Date(dto.date),
                reason: dto.reason,
            }
        });
    }

    // --- Months ---
    async getMonths() {
        return this.prisma.hRMonth.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }

    async submitMonth(year: number, month: number, user: User) {
        return this.prisma.hRMonth.upsert({
            where: { year_month: { year, month } },
            update: {
                status: HRMonthStatus.SUBMITTED,
                submitted_by: user.id,
                submitted_at: new Date(),
            },
            create: {
                year,
                month,
                status: HRMonthStatus.SUBMITTED,
                submitted_by: user.id,
                submitted_at: new Date(),
            }
        });
    }

    async lockMonth(year: number, month: number, user: User) {
        return this.prisma.hRMonth.upsert({
            where: { year_month: { year, month } },
            update: {
                status: HRMonthStatus.LOCKED,
                locked_by: user.id,
                locked_at: new Date(),
            },
            create: {
                year,
                month,
                status: HRMonthStatus.LOCKED,
                locked_by: user.id,
                locked_at: new Date(),
            }
        });
    }

    async reopenMonth(year: number, month: number, user: User) {
        const hrMonth = await this.prisma.hRMonth.findUnique({
            where: { year_month: { year, month } }
        });

        if (!hrMonth) throw new NotFoundException('Month not found');
        if (hrMonth.status === HRMonthStatus.LOCKED) {
            throw new ForbiddenException('Cannot reopen a LOCKED month. Unlock it first.');
        }

        if (hrMonth.status !== HRMonthStatus.SUBMITTED) {
            throw new BadRequestException('Only SUBMITTED months can be reopened to DRAFT.');
        }

        return this.prisma.hRMonth.update({
            where: { year_month: { year, month } },
            data: {
                status: HRMonthStatus.DRAFT,
            }
        });
    }

    // --- Attendance ---
    async getAttendance(from: string, to: string, employeeId?: string) {
        const where: any = {
            date: {
                gte: new Date(from),
                lte: new Date(to),
            }
        };
        if (employeeId) where.employee_id = employeeId;

        return this.prisma.hRAttendance.findMany({
            where,
            include: { employee: true },
            orderBy: { date: 'asc' }
        });
    }

    async upsertAttendance(dto: CreateAttendanceDto, user: User) {
        const { year, month } = this.getDateYearMonth(dto.date);
        await this.ensureMonthEditable(year, month);

        const attendance = await this.prisma.hRAttendance.upsert({
            where: { employee_id_date: { employee_id: dto.employee_id, date: new Date(dto.date) } },
            update: {
                status: dto.status,
                minutes_late: dto.minutes_late ?? 0,
                notes: dto.notes,
            },
            create: {
                employee_id: dto.employee_id,
                date: new Date(dto.date),
                status: dto.status,
                minutes_late: dto.minutes_late ?? 0,
                notes: dto.notes,
                created_by: user.id
            },
            include: { employee: true }
        });

        if (dto.status === AttendanceStatus.PRESENT && (dto.minutes_late || 0) === 0 && attendance.employee.user_id) {
            await this.gamificationService.awardPoints(attendance.employee.user_id, 10, 'On-Time Attendance');
            await this.gamificationService.updateMissionProgress(attendance.employee.user_id, 'ON_TIME_ATTENDANCE', 1);
        }

        return attendance;
    }

    async bulkUpsertAttendance(dto: BulkAttendanceDto, user: User) {
        const { year, month } = this.getDateYearMonth(dto.date);
        await this.ensureMonthEditable(year, month);

        const results: HRAttendance[] = [];
        for (const item of dto.items) {
            const res = await this.prisma.hRAttendance.upsert({
                where: { employee_id_date: { employee_id: item.employee_id, date: new Date(dto.date) } },
                update: {
                    status: item.status,
                    minutes_late: item.minutes_late ?? 0,
                    notes: item.notes,
                },
                create: {
                    employee_id: item.employee_id,
                    date: new Date(dto.date),
                    status: item.status,
                    minutes_late: item.minutes_late ?? 0,
                    notes: item.notes,
                    created_by: user.id
                }
            });
            results.push(res);
        }
        return results;
    }

    // --- Leaves ---
    async getLeaves() {
        return this.prisma.hRLeave.findMany({
            include: { employee: true },
            orderBy: { from_date: 'desc' }
        });
    }

    async createLeave(dto: CreateLeaveDto, user: User) {
        const { year, month } = this.getDateYearMonth(dto.from_date);
        await this.ensureMonthEditable(year, month);

        return this.prisma.hRLeave.create({
            data: {
                employee_id: dto.employee_id,
                from_date: new Date(dto.from_date),
                to_date: new Date(dto.to_date),
                leave_type: dto.leave_type,
                notes: dto.notes,
                created_by: user.id
            }
        });
    }
}
