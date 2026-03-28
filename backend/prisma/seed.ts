import { PrismaClient, UserRole, EmployeeSalaryType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { normalizeEmail } from '../src/common/utils/email.utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Clean Seeding...');

  // 1. Cleanup
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=OFF;');
  await prisma.payrollKpiResult.deleteMany({});
  await prisma.payrollItem.deleteMany({});
  await prisma.payrollRun.deleteMany({});
  await prisma.employeeCompPlan.deleteMany({});
  await prisma.reviewDeduction.deleteMany({});
  await prisma.hRAdjustment.deleteMany({});
  await prisma.kPIActual.deleteMany({});
  await prisma.kPITarget.deleteMany({});
  await prisma.kPIScore.deleteMany({});
  await prisma.employeeIssue.deleteMany({});
  await prisma.kpiMetric.deleteMany({});
  await prisma.hRAttendance.deleteMany({});
  await prisma.hRLeave.deleteMany({});
  await prisma.gamificationPoint.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.gamificationBadge.deleteMany({});
  await prisma.missionAssignment.deleteMany({});
  await prisma.mission.deleteMany({});
  await prisma.hRMonth.deleteMany({});
  await prisma.accountingPurchaseItem.deleteMany({});
  await prisma.accountingPurchase.deleteMany({});
  await prisma.accountingTransfer.deleteMany({});
  await prisma.accountingExpense.deleteMany({});
  await prisma.vendorDeposit.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.ticketEvent.deleteMany({});
  await prisma.ticketMessage.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.shippingCompany.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;');

  const adminPassword = await bcrypt.hash('admin123', 10);

  // 2. Users & Employees Helper
  const seedUser = async (email: string, name: string, role: UserRole, pwd = adminPassword) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.upsert({
      where: { email },
      update: { role, password_hash: pwd, name, email_normalized: normalizedEmail },
      create: {
        email,
        name,
        role,
        password_hash: pwd,
        is_active: true,
        email_normalized: normalizedEmail,
      },
    });

    const deptName = role === 'ADMIN' ? 'Management' : 'Other';

    const dept = await prisma.department.upsert({
      where: { name: deptName },
      update: {},
      create: { name: deptName },
    });

    const emp = await prisma.employee.upsert({
      where: { email },
      update: { user_id: user.id, department_id: dept.id },
      create: {
        email,
        full_name: name,
        code: `EMP-${email.split('@')[0].toUpperCase()}`,
        user_id: user.id,
        department_id: dept.id,
        start_date: new Date('2024-01-01'),
        base_salary: 8000,
        salary_type: EmployeeSalaryType.MONTHLY,
      },
    });

    const planRatios =
      role === UserRole.ADMIN
        ? { fixed_ratio: 100, kpi_ratio: 0 }
        : { fixed_ratio: 70, kpi_ratio: 30 };

    await prisma.employeeCompPlan.upsert({
      where: { employee_id: emp.id },
      update: {
        fixed_ratio: planRatios.fixed_ratio,
        kpi_ratio: planRatios.kpi_ratio,
      },
      create: {
        employee_id: emp.id,
        fixed_ratio: planRatios.fixed_ratio,
        kpi_ratio: planRatios.kpi_ratio,
      },
    });

    return { user, emp, dept };
  };

  // 3. Seed ONLY Admin
  await seedUser('admin@company.com', 'System Admin', UserRole.ADMIN, adminPassword);
  console.log('Admin seeded.');

  // 4. Shipping Companies & Ticket Reasons (Configurations)
  await prisma.shippingCompany.upsert({ where: { name: 'FedEx' }, update: {}, create: { name: 'FedEx', is_active: true } });
  await prisma.shippingCompany.upsert({ where: { name: 'Aramex' }, update: {}, create: { name: 'Aramex', is_active: true } });

  await prisma.ticketReason.upsert({ where: { name: 'Wrong Item Delivered' }, update: {}, create: { name: 'Wrong Item Delivered', category: 'CS', sort_order: 1, is_active: true } });
  await prisma.ticketReason.upsert({ where: { name: 'Late Delivery' }, update: {}, create: { name: 'Late Delivery', category: 'SHIPPING', sort_order: 2, is_active: true } });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
