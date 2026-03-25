import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { name: { contains: 'DINA' } },
      include: { employee: true }
    });
    console.log('User found:', JSON.stringify(user, null, 2));

    if (user?.employee) {
      const subordinates = await prisma.employee.findMany({
        where: { department_id: user.employee.department_id },
        include: { user: true }
      });
      console.log('Department Employees:', subordinates.length);
      subordinates.forEach(s => console.log(`- ${s.full_name} (${s.user?.id || 'No User'})`));

      const tickets = await prisma.ticket.count({
        where: { 
          assigned_to: { in: subordinates.map(s => s.user?.id).filter(Boolean) as string[] },
          deleted_at: null
        }
      });
      console.log('Tickets found for department users:', tickets);
    } else {
      console.log('DINA has no linked employee record!');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
