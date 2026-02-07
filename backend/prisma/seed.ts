import { PrismaClient, UserRole, Priority, IssueType, TicketStatus, EventType, NotificationType, TicketReasonCategory, EmployeeSalaryType, PayrollStatus, AdjustmentType } from '@prisma/client';
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

  // Create Departments
  const departments = ['Sales', 'Engineering', 'HR', 'Operations'];
  const depMap: Record<string, string> = {};

  for (const depName of departments) {
    const dep = await prisma.department.upsert({
      where: { name: depName },
      update: {},
      create: { name: depName },
    });
    depMap[depName] = dep.id;
  }
  console.log('Departments seeded');

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
      department_id: depMap['Engineering'],
      user_id: admin.id,
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
      department_id: depMap['Sales'],
      user_id: accounting.id,
    },
  });
  console.log('Employees seeded');

  // HR Adjustments
  await prisma.hRAdjustment.create({
    data: {
      employee_id: emp1.id,
      type: AdjustmentType.BONUS,
      amount: 500,
      date: new Date(),
      reason: 'Performance Bonus',
    }
  });
  console.log('HR Adjustments seeded');

  // HR Attendance
  await prisma.hRAttendance.create({
    data: {
      employee_id: emp1.id,
      date: new Date('2025-01-02'),
      status: 'PRESENT',
      minutes_late: 0,
      created_by: admin.id,
    }
  });
  await prisma.hRAttendance.create({
    data: {
      employee_id: emp1.id,
      date: new Date('2025-01-03'),
      status: 'PRESENT',
      minutes_late: 15,
      created_by: admin.id,
    }
  });
  console.log('HR Attendance seeded');

  // HR Leaves
  await prisma.hRLeave.create({
    data: {
      employee_id: emp2.id,
      from_date: new Date('2025-01-10'),
      to_date: new Date('2025-01-12'),
      leave_type: 'SICK',
      notes: 'Flu',
      created_by: admin.id,
    }
  });
  console.log('HR Leaves seeded');

  // Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { name: 'Office Depot' },
    update: {},
    create: { name: 'Office Depot' },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { name: 'AWS' },
    update: {},
    create: { name: 'AWS' },
  });
  console.log('Vendors seeded');

  // Accounting Purchases
  await prisma.accountingPurchase.create({
    data: {
      vendor_id: vendor1.id,
      date: new Date('2025-01-25'),
      total_amount: 150.00,
      created_by: admin.id,
      items: {
        create: [
          { item_name: 'Paper Ream', qty: 10, unit_price: 5, line_total: 50 },
          { item_name: 'Ink Cartridge', qty: 2, unit_price: 50, line_total: 100 },
        ],
      },
    },
  });

  // Vendor Deposits
  await prisma.vendorDeposit.create({
    data: {
      vendor_id: vendor2.id,
      amount: 1000.00,
      date: new Date('2025-01-01'),
      profit_loss: 0,
    }
  });
  console.log('Accounting data seeded');

  // Shipping Companies
  const fedex = await prisma.shippingCompany.upsert({
    where: { name: 'FedEx' },
    update: {},
    create: { name: 'FedEx' },
  });

  const dhl = await prisma.shippingCompany.upsert({
    where: { name: 'DHL' },
    update: {},
    create: { name: 'DHL' },
  });
  console.log('Shipping companies seeded');

  // Orders
  await prisma.order.upsert({
    where: { order_number: 'ORD-2025-0001' },
    update: {},
    create: {
      order_number: 'ORD-2025-0001',
      customer_name: 'Acme Corp',
      shipping_company_id: fedex.id,
      status: 'SHIPPED',
    },
  });
  console.log('Orders seeded');

  // Ticket Reasons
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

  // Tickets
  const reasonShipping = await prisma.ticketReason.findUnique({ where: { name: 'Wrong Item Delivered' } });

  await prisma.ticket.create({
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
  console.log('Tickets seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
