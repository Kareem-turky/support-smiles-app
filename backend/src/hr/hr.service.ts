import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './dto/create-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { HRMonthStatus, User, HRAttendance } from '@prisma/client';

@Injectable()
export class HRService {
    constructor(private prisma: PrismaService) { }

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
        return { year: d.getFullYear(), month: d.getMonth() + 1 }; // 1-indexed for business logic
    }

    // --- Months ---
    async getMonths() {
        return this.prisma.hRMonth.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }

    async submitMonth(year: number, month: number, user: User) {
        // Create if not exists, or update
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
        // Only Admin usually, but handled by controller Guard/Role
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

        return this.prisma.hRAttendance.upsert({
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
            }
        });
    }

    async bulkUpsertAttendance(dto: BulkAttendanceDto, user: User) {
        const { year, month } = this.getDateYearMonth(dto.date);
        await this.ensureMonthEditable(year, month);

        // Transaction manually or loop. Loop is fine for small batches (employees < 100)
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
        await this.ensureMonthEditable(year, month); // Simplified: check start date month only

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

    // --- Deductions ---
    async getDeductions(year: number, month: number, employeeId?: string) {
        // First find month ID
        const hrMonth = await this.prisma.hRMonth.findUnique({ where: { year_month: { year, month } } });
        if (!hrMonth) return [];

        const where: any = { hr_month_id: hrMonth.id };
        if (employeeId) where.employee_id = employeeId;

        return this.prisma.hRDeduction.findMany({
            where,
            include: { employee: true },
        });
    }

    async createDeduction(dto: CreateDeductionDto, user: User) {
        await this.ensureMonthEditable(dto.year, dto.month);

        // Ensure month record exists (create DRAFT if not)
        let hrMonth = await this.prisma.hRMonth.findUnique({ where: { year_month: { year: dto.year, month: dto.month } } });
        if (!hrMonth) {
            hrMonth = await this.prisma.hRMonth.create({
                data: {
                    year: dto.year,
                    month: dto.month,
                    status: HRMonthStatus.DRAFT,
                }
            });
        }

        return this.prisma.hRDeduction.create({
            data: {
                hr_month_id: hrMonth.id,
                employee_id: dto.employee_id,
                type: dto.type,
                amount: dto.amount,
                reason: dto.reason,
                created_by: user.id
            }
        });
    }

    async deleteDeduction(id: string) {
        const deduction = await this.prisma.hRDeduction.findUnique({
            where: { id },
            include: { hr_month: true }
        });
        if (!deduction) throw new NotFoundException();

        await this.ensureMonthEditable(deduction.hr_month.year, deduction.hr_month.month);

        return this.prisma.hRDeduction.delete({ where: { id } });
    }
}
