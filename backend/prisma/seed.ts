import { PrismaClient, UserRole, Priority, IssueType, TicketStatus, EventType, NotificationType, TicketReasonCategory, EmployeeSalaryType, PayrollStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Users
  const password = await bcrypt.hash('admin123', 10);
  const accountingPassword = await bcrypt.hash('accounting123', 10);
  const csPassword = await bcrypt.hash('cs123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@company.com',
      password_hash: password,
      role: UserRole.ADMIN,
    },
  });

  const accounting = await prisma.user.upsert({
    where: { email: 'sarah@company.com' },
    update: {},
    create: {
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      password_hash: accountingPassword,
      role: UserRole.ACCOUNTING,
    },
  });

  const cs = await prisma.user.upsert({
    where: { email: 'mike@company.com' },
    update: {},
    create: {
      name: 'Mike Chen',
      email: 'mike@company.com',
      password_hash: csPassword,
      role: UserRole.CS,
    },
  });

  console.log('Users created:', { admin: admin.email, accounting: accounting.email, cs: cs.email });

  // Create Reasons
  const reasons = [
    { name: 'Wrong Item Delivered', category: TicketReasonCategory.SHIPPING, sort_order: 10 },
    { name: 'Package Damaged', category: TicketReasonCategory.SHIPPING, sort_order: 20 },
    { name: 'Late Delivery', category: TicketReasonCategory.SHIPPING, sort_order: 30 },
    { name: 'COD Amount Mismatch', category: TicketReasonCategory.ACCOUNTING, sort_order: 40 },
    { name: 'Refund Request', category: TicketReasonCategory.ACCOUNTING, sort_order: 50 },
    { name: 'Customer Complaint', category: TicketReasonCategory.CS, sort_order: 60 },
    { name: 'General Inquiry', category: TicketReasonCategory.CS, sort_order: 70 },
    { name: 'Other', category: TicketReasonCategory.OTHER, sort_order: 100 },
  ];

  for (const r of reasons) {
    await prisma.ticketReason.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log('Reasons seeded');

  // Fetch a reason for tickets
  const reasonShipping = await prisma.ticketReason.findUnique({ where: { name: 'Wrong Item Delivered' } });
  const reasonAccounting = await prisma.ticketReason.findUnique({ where: { name: 'COD Amount Mismatch' } });

  // Create Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      order_number: 'ORD-2025-0001',
      courier_company: 'FedEx',
      issue_type: IssueType.DELIVERY,
      priority: Priority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      description: 'Package delivered to wrong address',
      created_by: accounting.id,
      assigned_to: cs.id,
      created_at: new Date('2025-01-28T10:00:00Z'),
      reason_id: reasonShipping?.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      order_number: 'ORD-2025-0002',
      courier_company: 'UPS',
      issue_type: IssueType.COD,
      priority: Priority.URGENT,
      status: TicketStatus.NEW,
      description: 'COD amount mismatch',
      created_by: accounting.id,
      created_at: new Date('2025-01-28T11:00:00Z'),
      reason_id: reasonAccounting?.id,
    },
  });

  console.log('Tickets created:', [ticket1.id, ticket2.id]);

  // Create Employees
  const emp1 = await prisma.employee.upsert({
    where: { code: 'EMP001' },
    update: {},
    create: {
      code: 'EMP001',
      full_name: 'John Doe',
      start_date: new Date('2024-01-01'),
      base_salary: 5000,
      salary_type: EmployeeSalaryType.MONTHLY,
      department: 'Engineering',
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { code: 'EMP002' },
    update: {},
    create: {
      code: 'EMP002',
      full_name: 'Jane Smith',
      start_date: new Date('2024-02-01'),
      base_salary: 4500,
      salary_type: EmployeeSalaryType.MONTHLY,
      department: 'Marketing',
    },
  });
  console.log('Employees seeded');

  // Create Accounting Purchases
  await prisma.accountingPurchase.create({
    data: {
      vendor_name: 'Tech Solutions Inc',
      date: new Date('2025-01-25'),
      total_amount: 1500.00,
      created_by: admin.id,
      items: {
        create: [
          { item_name: 'Laptop Charger', qty: 5, unit_price: 200, line_total: 1000 },
          { item_name: 'Monitor Stand', qty: 2, unit_price: 250, line_total: 500 },
        ],
      },
    },
  });
  console.log('Purchases seeded');

  // Create Accounting Expenses
  await prisma.accountingExpense.create({
    data: {
      category: 'Office Supplies',
      date: new Date('2025-01-20'),
      amount: 150.50,
      created_by: accounting.id,
      notes: 'Stationary for the team',
    },
  });
  console.log('Expenses seeded');

  // Create Payroll
  const payrollRun = await prisma.payrollRun.upsert({
    where: { year_month: { year: 2025, month: 1 } },
    update: {},
    create: {
      year: 2025,
      month: 1,
      status: PayrollStatus.APPROVED,
      approved_by: admin.id,
      approved_at: new Date(),
    },
  });

  await prisma.payrollItem.upsert({
    where: { payroll_run_id_employee_id: { payroll_run_id: payrollRun.id, employee_id: emp1.id } },
    update: {},
    create: {
      payroll_run_id: payrollRun.id,
      employee_id: emp1.id,
      base_salary: 5000,
      total_deductions: 200,
      net_salary: 4800,
      breakdown_json: { tax: 150, insurance: 50 },
    },
  });
  console.log('Payroll seeded');

  // Create Messages
  await prisma.ticketMessage.create({
    data: {
      ticket_id: ticket1.id,
      sender_id: accounting.id,
      message: 'Please check with FedEx immediately.',
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticket_id: ticket1.id,
      sender_id: cs.id,
      message: 'On it, calling them now.',
    },
  });

  // Create Events
  await prisma.ticketEvent.create({
    data: {
      ticket_id: ticket1.id,
      actor_id: accounting.id,
      event_type: EventType.TICKET_CREATED,
      meta: { order_number: 'ORD-2025-0001' },
    },
  });

  await prisma.ticketEvent.create({
    data: {
      ticket_id: ticket1.id,
      actor_id: accounting.id,
      event_type: EventType.TICKET_ASSIGNED,
      meta: { assigned_to: cs.id },
    },
  });

  // Create Notifications
  await prisma.notification.create({
    data: {
      user_id: cs.id,
      type: NotificationType.TICKET_ASSIGNED,
      title: 'New Ticket Assigned',
      body: 'You have been assigned to ticket ORD-2025-0001',
      link: `/tickets/${ticket1.id}`,
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
