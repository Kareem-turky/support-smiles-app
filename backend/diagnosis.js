const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { name: { contains: 'dina' } },
      include: { employee: true }
    });
    
    if (user && user.employee) {
      console.log('DINA Department ID:', user.employee.department_id);
      
      const allEmployees = await prisma.employee.findMany({
        include: { department: true }
      });
      console.log('All Employees:', allEmployees.length);
      allEmployees.forEach(e => {
        console.log(`- ${e.full_name}: Dept=${e.department.name} (${e.department_id})`);
      });

      const tickets = await prisma.ticket.findMany({
        where: { deleted_at: null },
        include: { assignee: true }
      });
      console.log('All non-deleted Tickets:', tickets.length);
      tickets.forEach(t => {
          console.log(`- Ticket ${t.order_number}: Status=${t.status}, AssignedTo=${t.assignee?.name || 'Nobody'}, ResolvedAt=${t.resolved_at}`);
      });

    } else {
      console.log('DINA not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
