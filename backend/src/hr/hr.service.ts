import * as bcrypt from 'bcrypt';
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './dto/create-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { HRMonthStatus, User, HRAttendance, EmployeeSalaryType, AttendanceStatus, UserRole } from '@prisma/client';

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
    async getEmployees(user?: any) {
        // Tickets need to be routed cross-department, so all internal staff must be able to see the full directory.
        const employees = await this.prisma.employee.findMany({
            include: { department: true, user: { select: { email: true, role: true } } },
            orderBy: { full_name: 'asc' }
        });

        return employees.map(emp => ({
            ...emp,
            role: emp.user?.role
        }));
    }

    async createEmployee(dto: CreateEmployeeDto) {
        const count = await this.prisma.employee.count();
        const code = `EMP${String(count + 1).padStart(3, '0')}`;
        
        // Auto-create User account with default password 'password123'
        const password_hash = await bcrypt.hash('password123', 10);
        
        let user;
        try {
            user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    name: dto.full_name,
                    password_hash,
                    role: (dto.role as any) || UserRole.CS_AGENT,
                    is_active: dto.is_active ?? true,
                }
            });
        } catch (error) {
            throw new BadRequestException('User email already exists or invalid role.');
        }

        return this.prisma.employee.create({
            data: {
                code,
                full_name: dto.full_name,
                email: dto.email,
                user_id: user.id,
                department_id: dto.department_id,
                start_date: new Date(dto.start_date),
                base_salary: dto.base_salary,
                salary_type: dto.salary_type || EmployeeSalaryType.MONTHLY,
            }
        });
    }

    async updateEmployee(id: string, dto: any) {
        const employee = await this.prisma.employee.findUnique({ where: { id } });
        if (!employee) throw new NotFoundException('Employee not found');

        // Update User if linked
        if (employee.user_id) {
            const userUpdate: any = {};
            if (dto.full_name) userUpdate.name = dto.full_name;
            if (dto.email) userUpdate.email = dto.email;
            if (dto.role) userUpdate.role = dto.role as UserRole;
            if (dto.is_active !== undefined) userUpdate.is_active = dto.is_active;

            if (Object.keys(userUpdate).length > 0) {
                try {
                    await this.prisma.user.update({
                        where: { id: employee.user_id },
                        data: userUpdate,
                    });
                } catch (e) {
                    throw new BadRequestException('Email might already be in use by another user.');
                }
            }
        } else if (dto.email && dto.full_name && dto.role) {
            // Generate a User account if this employee is orphaned (e.g., from old seeded data)
            const password_hash = await bcrypt.hash('password123', 10);
            try {
                const newUser = await this.prisma.user.create({
                    data: {
                        email: dto.email,
                        password_hash,
                        name: dto.full_name,
                        role: dto.role as UserRole,
                        is_active: dto.is_active !== undefined ? dto.is_active : true,
                    }
                });
                await this.prisma.employee.update({
                    where: { id },
                    data: { user_id: newUser.id }
                });
            } catch (e) {
                // Ignore silent unique failure if email collision occurs
            }
        }

        // Update Employee
        const empUpdate: any = {};
        if (dto.full_name) empUpdate.full_name = dto.full_name;
        if (dto.email) empUpdate.email = dto.email;
        if (dto.department_id !== undefined) empUpdate.department_id = dto.department_id;
        if (dto.base_salary !== undefined) empUpdate.base_salary = dto.base_salary;
        if (dto.salary_type) empUpdate.salary_type = dto.salary_type;
        if (dto.start_date) empUpdate.start_date = new Date(dto.start_date);
        if (dto.is_active !== undefined) empUpdate.is_active = dto.is_active;

        return this.prisma.employee.update({
            where: { id },
            data: empUpdate,
            include: { department: true, user: { select: { email: true, role: true } } }
        });
    }

    async deleteEmployee(id: string) {
        const employee = await this.prisma.employee.findUnique({ where: { id } });
        if (!employee) throw new NotFoundException('Employee not found');

        // Delete HR records
        await this.prisma.hRAttendance.deleteMany({ where: { employee_id: id } });
        await this.prisma.hRLeave.deleteMany({ where: { employee_id: id } });
        await this.prisma.hRAdjustment.deleteMany({ where: { employee_id: id } });
        await this.prisma.employeeIssue.deleteMany({ where: { employee_id: id } });
        await this.prisma.kPIActual.deleteMany({ where: { employee_id: id } });
        await this.prisma.kPIScore.deleteMany({ where: { employee_id: id } });
        await this.prisma.kPITarget.deleteMany({ where: { employee_id: id } });

        // Finally delete the Employee record
        await this.prisma.employee.delete({ where: { id } });

        // And the user if linked
        if (employee.user_id) {
            // Delete gamification and notification info before deleting the user
            await this.prisma.gamificationPoint.deleteMany({ where: { user_id: employee.user_id } });
            await this.prisma.notification.deleteMany({ where: { user_id: employee.user_id } });
            await this.prisma.userBadge.deleteMany({ where: { user_id: employee.user_id } });
            await this.prisma.missionAssignment.deleteMany({ where: { user_id: employee.user_id } });

            // Ensure they are unassigned from tickets
            await this.prisma.ticket.updateMany({
                where: { assigned_to: employee.user_id },
                data: { assigned_to: null }
            });

            await this.prisma.user.delete({ where: { id: employee.user_id } }).catch(() => null);
        }

        return { success: true };
    }

    async toggleEmployeeStatus(id: string) {
        const employee = await this.prisma.employee.findUnique({ where: { id } });
        if (!employee) throw new NotFoundException('Employee not found');

        const newStatus = !employee.is_active;

        if (employee.user_id) {
            await this.prisma.user.update({
                where: { id: employee.user_id },
                data: { is_active: newStatus }
            });
        }

        return this.prisma.employee.update({
            where: { id },
            data: { is_active: newStatus },
            include: { department: true, user: { select: { email: true, role: true } } }
        });
    }

    async resetEmployeePassword(id: string) {
        const employee = await this.prisma.employee.findUnique({ where: { id } });
        if (!employee) throw new NotFoundException('Employee not found');
        if (!employee.user_id) throw new BadRequestException('This employee has no user account to reset.');

        const password_hash = await bcrypt.hash('password123', 10);
        await this.prisma.user.update({
            where: { id: employee.user_id },
            data: { password_hash }
        });

        return { success: true, message: 'Password reset to password123' };
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
