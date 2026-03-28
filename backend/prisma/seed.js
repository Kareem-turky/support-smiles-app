"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Clean Seeding...');
    await prisma.kPITarget.deleteMany({});
    await prisma.kPIActual.deleteMany({});
    await prisma.employeeIssue.deleteMany({});
    await prisma.kPIScore.deleteMany({});
    await prisma.gamificationPoint.deleteMany({});
    await prisma.userBadge.deleteMany({});
    await prisma.gamificationBadge.deleteMany({});
    await prisma.missionAssignment.deleteMany({});
    await prisma.mission.deleteMany({});
    await prisma.hRMonth.deleteMany({});
    await prisma.accountingPurchaseItem.deleteMany({});
    await prisma.accountingPurchase.deleteMany({});
    await prisma.accountingTransfer.deleteMany({});
    await prisma.vendorDeposit.deleteMany({});
    await prisma.accountingExpense.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.ticketEvent.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.shippingCompany.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.user.deleteMany({});
    const adminPassword = await bcrypt.hash('admin123', 10);
    const seedUser = async (email, name, role, pwd = adminPassword) => {
        const user = await prisma.user.upsert({
            where: { email },
            update: { role, password_hash: pwd, name },
            create: { email, name, role, password_hash: pwd, is_active: true },
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
                salary_type: client_1.EmployeeSalaryType.MONTHLY,
            },
        });
        return { user, emp, dept };
    };
    await seedUser('admin@company.com', 'System Admin', client_1.UserRole.ADMIN, adminPassword);
    console.log('Admin seeded.');
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
//# sourceMappingURL=seed.js.map