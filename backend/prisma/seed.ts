import { PrismaClient, UserRole, Priority, IssueType, TicketStatus, TicketReasonCategory, EmployeeSalaryType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Robust Seeding for Phase 14...');

  // 1. Cleanup
  await prisma.kPITarget.deleteMany({});
  await prisma.kPIActual.deleteMany({});
  await prisma.employeeIssue.deleteMany({});
  await prisma.kPIScore.deleteMany({});
  await prisma.gamificationPoint.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.gamificationBadge.deleteMany({});
  // Optional: await prisma.payrollItem.deleteMany({});
  // Optional: await prisma.payrollRun.deleteMany({});

  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 2. Users & Employees Helper
  const seedUser = async (email: string, name: string, role: UserRole, pwd = password) => {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role, password_hash: pwd, name },
      create: { email, name, role, password_hash: pwd },
    });

    // Create Department if needed
    const deptName = role.startsWith('CS') ? 'Customer Success' :
      role.startsWith('ACC') ? 'Accounting' :
        role.startsWith('HR') ? 'HR' :
          role.startsWith('WH') ? 'Warehouse' : 'Management';

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
        base_salary: role.includes('MANAGER') || role === 'ADMIN' ? 8000 : 4000,
        salary_type: EmployeeSalaryType.MONTHLY,
      },
    });

    return { user, emp };
  };

  // 3. Seed Users
  const admin = await seedUser('admin@company.com', 'System Admin', UserRole.ADMIN, adminPassword);
  const accManager = await seedUser('sarah@company.com', 'Sarah Accountant', UserRole.ACC_MANAGER);
  const hrManager = await seedUser('helen@company.com', 'Helen HR', UserRole.HR_MANAGER);
  const csManager = await seedUser('mike@company.com', 'Mike CS Manager', UserRole.CS_MANAGER);
  const agent1 = await seedUser('alice@company.com', 'Alice Agent', UserRole.CS_AGENT);
  const agent2 = await seedUser('bob@company.com', 'Bob Agent', UserRole.CS_AGENT);
  const whManager = await seedUser('wayne@company.com', 'Wayne WH Manager', UserRole.WH_MANAGER);
  const worker1 = await seedUser('william@company.com', 'William Worker', UserRole.WH_AGENT);
  const worker2 = await seedUser('wanda@company.com', 'Wanda Worker', UserRole.WH_AGENT);

  console.log('Users and Employees seeded.');

  // 4. KPI Targets
  const targets = [
    // CS Roles
    { role: UserRole.CS_MANAGER, metric_name: 'Team CSAT', target_value: 95, weight: 40, period: 'MONTHLY' },
    { role: UserRole.CS_AGENT, metric_name: 'Tickets Resolved', target_value: 100, weight: 50, period: 'MONTHLY' },
    // WH Roles
    { role: UserRole.WH_MANAGER, metric_name: 'Inventory Accuracy', target_value: 99, weight: 40, period: 'MONTHLY' },
    { role: UserRole.WH_AGENT, metric_name: 'Daily Orders', target_value: 50, weight: 60, period: 'DAILY' },
    // HR/ACC
    { role: UserRole.HR_MANAGER, metric_name: 'Employee Retention', target_value: 95, weight: 30, period: 'MONTHLY' },
    { role: UserRole.ACC_MANAGER, metric_name: 'Billing Accuracy', target_value: 100, weight: 50, period: 'MONTHLY' },
  ];

  for (const t of targets) {
    await prisma.kPITarget.create({ data: t });
  }

  // 5. KPI Actuals (Current Month)
  const periodKey = new Date().toISOString().slice(0, 7);
  await prisma.kPIActual.createMany({
    data: [
      { user_id: agent1.user.id, metric_name: 'Tickets Resolved', actual_value: 85, score: 85, period_key: periodKey },
      { user_id: worker1.user.id, metric_name: 'Daily Orders', actual_value: 45, score: 90, period_key: periodKey },
      { user_id: admin.user.id, metric_name: 'Team CSAT', actual_value: 92, score: 92, period_key: periodKey },
    ],
  });

  // 5.5. KPI Scores (Historical/Daily Rollups)
  const today = new Date();
  await prisma.kPIScore.createMany({
    data: [
      { employee_id: admin.emp.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), total_score: 95, efficiency_score: 95, quality_score: 95, behavior_score: 100, punctuality_score: 100 },
      { employee_id: agent1.emp.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), total_score: 88, efficiency_score: 90, quality_score: 85, behavior_score: 90, punctuality_score: 100 },
    ]
  });

  // 6. Employee Issues
  await prisma.employeeIssue.createMany({
    data: [
      { employee_id: agent1.emp.id, type: 'QUALITY_DEDUCTION', description: 'Major error in ticket #123', severity: 'HIGH', deduction_points: 10, created_by: admin.user.id, date: new Date() },
      { employee_id: worker2.emp.id, type: 'PRODUCTIVITY_DEDUCTION', description: 'Failed to meet daily quota', severity: 'MEDIUM', deduction_points: 5, created_by: whManager.user.id, date: new Date() },
      { employee_id: agent2.emp.id, type: 'BEHAVIOR_DEDUCTION', description: 'Late for shift', severity: 'LOW', deduction_points: 2, created_by: csManager.user.id, date: new Date() },
    ],
  });

  // 7. Gamification Badges
  const badges = [
    { name: 'Eagle Eye', description: 'Zero errors for 7 days', icon: '🦅', condition_type: 'STREAK', condition_value: 7, xp_bonus: 100 },
    { name: 'Flash', description: 'Resolved 20 tickets in 1 day', icon: '⚡', condition_type: 'DAILY_GOAL', condition_value: 20, xp_bonus: 50 },
    { name: 'Team Player', description: 'Helped 5 colleagues', icon: '🤝', condition_type: 'PEER_REVIEW', condition_value: 5, xp_bonus: 30 },
  ];

  for (const b of badges) {
    await prisma.gamificationBadge.create({ data: b });
  }

  // 8. Award Points
  await prisma.gamificationPoint.createMany({
    data: [
      { user_id: agent1.user.id, amount: 500, reason: 'Monthly Performance' },
      { user_id: worker1.user.id, amount: 300, reason: 'Warehouse Efficiency' },
    ],
  });

  console.log('KPI and Gamification data seeded.');

  // 9. Shipping Companies (Prerequisite for Orders/Tickets)
  const fedex = await prisma.shippingCompany.upsert({ where: { name: 'FedEx' }, update: {}, create: { name: 'FedEx' } });

  // 10. Vendor & Purchase (Regression Check items)
  const vendor = await prisma.vendor.upsert({
    where: { name: 'Global Logistics' },
    update: {},
    create: { name: 'Global Logistics', phone: '123-456-7890' },
  });

  // 11. Accounting Extras (Expenses, Deposits, Purchases, Transfers)
  await prisma.accountingExpense.createMany({
    data: [
      { category: 'OFFICE', amount: 150, date: new Date(), notes: 'Stationery', created_by: accManager.user.id },
      { category: 'SOFTWARE', amount: 50, date: new Date(), notes: 'Subscriptions', created_by: accManager.user.id }
    ]
  });

  await prisma.vendorDeposit.createMany({
    data: [
      { vendor_id: vendor.id, amount: 5000, date: new Date(), profit_loss: 500, notes: 'Q1 Deposit' }
    ]
  });

  await prisma.accountingTransfer.createMany({
    data: [
      { type: 'OTHER', amount: 1000, method: 'BANK', date: new Date(), notes: 'Petty Cash Replenishment', created_by: admin.user.id }
    ]
  });

  const purchase = await prisma.accountingPurchase.create({
    data: {
      vendor_id: vendor.id,
      date: new Date(),
      total_amount: 1500,
      notes: 'Hardware order',
      created_by: accManager.user.id,
      items: {
        create: [
          { item_name: 'Laptops', qty: 2, unit_price: 750, line_total: 1500 }
        ]
      }
    }
  });

  // 12. HR Extras (Months)
  const [year, month] = [today.getFullYear(), today.getMonth() + 1];
  await prisma.hRMonth.upsert({
    where: { year_month: { year, month } },
    update: { status: 'SUBMITTED', submitted_by: hrManager.user.id, submitted_at: new Date() },
    create: { year, month, status: 'SUBMITTED', submitted_by: hrManager.user.id, submitted_at: new Date() }
  });

  // 13. Gamification Missions
  const mission1 = await prisma.mission.create({
    data: {
      title: 'Resolve 10 Tickets',
      description: 'Resolve 10 CS tickets in a day',
      points: 50,
      target_value: 10,
      metric_key: 'RESOLVED_TICKETS',
      frequency: 'DAILY',
      role_scope: 'CS_AGENT',
      created_by: admin.user.id,
      assignments: {
        create: [
          { user_id: agent1.user.id, status: 'ACTIVE' },
          { user_id: agent2.user.id, status: 'ACTIVE' }
        ]
      }
    }
  });

  const mission2 = await prisma.mission.create({
    data: {
      title: 'Perfect Attendance',
      description: 'Be on time for 5 days straight',
      points: 200,
      target_value: 5,
      metric_key: 'ON_TIME_ATTENDANCE',
      frequency: 'WEEKLY',
      created_by: admin.user.id,
      assignments: {
        create: [
          { user_id: agent1.user.id, status: 'ACTIVE' },
          { user_id: worker1.user.id, status: 'ACTIVE' }
        ]
      }
    }
  });

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
