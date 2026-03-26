const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const dinaUserId = '898998e2-3f81-4a69-a6a9-73b8fb916757';
    
    // Find manager's department
    const managerEmployee = await prisma.employee.findUnique({
      where: { user_id: dinaUserId },
      include: { department: true }
    });
    const deptId = managerEmployee.department_id;
    const categoryFilter = managerEmployee.department?.name?.toUpperCase() === 'CS' ? 'CS' : null;
    
    console.log('Manager:', managerEmployee.full_name, 'Dept:', managerEmployee.department?.name, 'Category Filter:', categoryFilter);

    const employees = await prisma.employee.findMany({
      where: { department_id: deptId },
      include: { user: true },
    });
    const userIds = employees.map(e => e.user?.id).filter(Boolean);

    const openCount = await prisma.ticket.count({
      where: {
        OR: [
          { assigned_to: { in: userIds } },
          categoryFilter
            ? { assigned_to: null, reason: { category: categoryFilter } }
            : undefined,
        ].filter(Boolean),
        status: {
          in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'REOPENED'],
        },
        deleted_at: null,
      },
    });

    console.log('Open Issues for Dina Team:', openCount);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
