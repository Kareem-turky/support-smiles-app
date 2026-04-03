import { PrismaClient, UserRole, EmployeeSalaryType, PermissionEffect } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { normalizeEmail } from '../src/common/utils/email.utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Clean Seeding...');

  // 1. Cleanup (Soft order)
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=OFF;');
  await prisma.userPermission.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.featureFlag.deleteMany({});
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

  // 2. Seed Permissions
  const permissions = [
    // HR
    { key: 'hr:departments:read', domain: 'hr', description: 'View departments' },
    { key: 'hr:departments:create', domain: 'hr', description: 'Create new departments' },
    { key: 'hr:employees:read', domain: 'hr', description: 'View employee list' },
    { key: 'hr:employees:create', domain: 'hr', description: 'Create new employees' },
    { key: 'hr:employees:update', domain: 'hr', description: 'Update existing employees' },
    { key: 'hr:employees:delete', domain: 'hr', description: 'Remove employees' },
    { key: 'hr:employees:manage', domain: 'hr', description: 'Manage employee status and passwords' },
    { key: 'hr:adjustments:read', domain: 'hr', description: 'View salary adjustments' },
    { key: 'hr:adjustments:create', domain: 'hr', description: 'Create salary adjustments' },
    { key: 'hr:months:read', domain: 'hr', description: 'View monthly periods' },
    { key: 'hr:months:submit', domain: 'hr', description: 'Submit monthly payroll data' },
    { key: 'hr:months:lock', domain: 'hr', description: 'Lock payroll months' },
    { key: 'hr:months:reopen', domain: 'hr', description: 'Reopen locked payroll months' },
    { key: 'hr:attendance:read', domain: 'hr', description: 'View attendance records' },
    { key: 'hr:attendance:update', domain: 'hr', description: 'Modify attendance data' },
    { key: 'hr:leaves:read', domain: 'hr', description: 'View leave requests' },
    { key: 'hr:leaves:create', domain: 'hr', description: 'Create leave requests' },

    // Accounting
    { key: 'accounting:vendors:read', domain: 'accounting', description: 'View vendors' },
    { key: 'accounting:vendors:create', domain: 'accounting', description: 'Add vendors' },
    { key: 'accounting:vendors:update', domain: 'accounting', description: 'Update vendors' },
    { key: 'accounting:purchases:read', domain: 'accounting', description: 'View purchases' },
    { key: 'accounting:purchases:create', domain: 'accounting', description: 'Create purchases' },
    { key: 'accounting:expenses:read', domain: 'accounting', description: 'View expenses' },
    { key: 'accounting:expenses:create', domain: 'accounting', description: 'Create expenses' },
    { key: 'accounting:payroll:read', domain: 'accounting', description: 'View payroll runs' },
    { key: 'accounting:payroll:calculate', domain: 'accounting', description: 'Run payroll calculation' },
    { key: 'accounting:payroll:approve', domain: 'accounting', description: 'Approve payroll for payment' },
    { key: 'accounting:deposits:read', domain: 'accounting', description: 'View bank deposits' },
    { key: 'accounting:deposits:create', domain: 'accounting', description: 'Create deposits' },
    { key: 'accounting:transfers:read', domain: 'accounting', description: 'View money transfers' },
    { key: 'accounting:transfers:create', domain: 'accounting', description: 'Create transfers' },
    { key: 'accounting:advances:read', domain: 'accounting', description: 'View salary advances' },
    { key: 'accounting:advances:create', domain: 'accounting', description: 'Create salary advances' },
    { key: 'accounting:deductions:read', domain: 'accounting', description: 'Review auto-deductions' },
    { key: 'accounting:deductions:update', domain: 'accounting', description: 'Approve/Reject deductions' },

    // Tickets
    { key: 'tickets:tickets:read', domain: 'tickets', description: 'View tickets' },
    { key: 'tickets:tickets:create', domain: 'tickets', description: 'Open new tickets' },
    { key: 'tickets:tickets:update', domain: 'tickets', description: 'Edit ticket details' },
    { key: 'tickets:tickets:manage', domain: 'tickets', description: 'Assign, resolve, or reassign tickets' },
    { key: 'tickets:reasons:manage', domain: 'tickets', description: 'Manage ticket reasons and config' },
    { key: 'tickets:messages:manage', domain: 'tickets', description: 'Posting messages and comments' },

    // KPI
    { key: 'kpi:metrics:read', domain: 'kpi', description: 'View KPI metrics' },
    { key: 'kpi:metrics:manage', domain: 'kpi', description: 'Manage metric definitions' },
    { key: 'kpi:targets:read', domain: 'kpi', description: 'View targets' },
    { key: 'kpi:targets:create', domain: 'kpi', description: 'Set new targets' },
    { key: 'kpi:targets:update', domain: 'kpi', description: 'Edit existing targets' },
    { key: 'kpi:issues:create', domain: 'kpi', description: 'Log performance issues' },
    { key: 'kpi:actuals:log', domain: 'kpi', description: 'Submit actual achievement values' },
    { key: 'kpi:calculation:run', domain: 'kpi', description: 'Trigger daily score calculations' },

    // Security
    { key: 'security:users:read', domain: 'security', description: 'View system users' },
    { key: 'security:users:manage', domain: 'security', description: 'Create/Edit users and permissions' },
    { key: 'security:permissions:manage', domain: 'security', description: 'Audit and modify permission keys' },
    
    // System
    { key: 'dashboard:view', domain: 'system', description: 'Access dashboard summary' },
    { key: 'shipping:companies:manage', domain: 'system', description: 'Manage shipping carriers' },
  ];

  const permissionMap = new Map();
  for (const p of permissions) {
    const created = await prisma.permission.create({ data: p });
    permissionMap.set(p.key, created.id);
  }
  console.log(`${permissions.length} Permissions created.`);

  // 3. Map Roles to Permissions
  const roleMappings = {
    [UserRole.ADMIN]: permissions.map(p => p.key), // Everything
    [UserRole.CS_MANAGER]: [
      'dashboard:view', 'tickets:tickets:read', 'tickets:tickets:create', 'tickets:tickets:update', 'tickets:tickets:manage',
      'tickets:messages:manage', 'kpi:targets:read', 'kpi:issues:create', 'kpi:actuals:log'
    ],
    [UserRole.CS_AGENT]: [
      'dashboard:view', 'tickets:tickets:read', 'tickets:tickets:create', 'tickets:messages:manage', 'kpi:targets:read'
    ],
    [UserRole.ACC_MANAGER]: [
      'dashboard:view', 'accounting:vendors:read', 'accounting:vendors:create', 'accounting:vendors:update',
      'accounting:purchases:read', 'accounting:purchases:create', 'accounting:expenses:read', 'accounting:expenses:create',
      'accounting:payroll:read', 'accounting:payroll:calculate', 'accounting:payroll:approve', 'accounting:deductions:read',
      'accounting:deductions:update', 'hr:adjustments:read', 'hr:months:read'
    ],
    [UserRole.HR_MANAGER]: [
      'dashboard:view', 'hr:departments:read', 'hr:departments:create', 'hr:employees:read', 'hr:employees:create',
      'hr:employees:update', 'hr:employees:manage', 'hr:adjustments:read', 'hr:adjustments:create', 'hr:months:read',
      'hr:months:submit', 'hr:attendance:read', 'hr:attendance:update', 'hr:leaves:read', 'hr:leaves:create'
    ],
    [UserRole.WH_MANAGER]: [
      'dashboard:view', 'shipping:companies:manage', 'tickets:tickets:read', 'kpi:targets:read'
    ]
  };

  for (const [role, pKeys] of Object.entries(roleMappings)) {
    for (const key of pKeys) {
      const permissionId = permissionMap.get(key);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            role: role as UserRole,
            permission_id: permissionId
          }
        });
      }
    }
  }
  console.log('Role mappings created.');

  // 4. Feature Flag
  await prisma.featureFlag.create({
    data: {
      key: 'PERMISSIONS_ENFORCED',
      is_enabled: true,
      description: 'Enable granular permissions system enforcement'
    }
  });

  // 5. Users & Employees Helper
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

  // 6. Seed Initial Users
  await seedUser('admin@company.com', 'System Admin', UserRole.ADMIN, adminPassword);
  await seedUser('hr@company.com', 'HR Manager', UserRole.HR_MANAGER, adminPassword);
  await seedUser('acc@company.com', 'Accounting Manager', UserRole.ACC_MANAGER, adminPassword);
  await seedUser('cs@company.com', 'CS Manager', UserRole.CS_MANAGER, adminPassword);
  await seedUser('agent@company.com', 'CS Agent', UserRole.CS_AGENT, adminPassword);
  console.log('Test users seeded.');

  // 7. Configs
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

