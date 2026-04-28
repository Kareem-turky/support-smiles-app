const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const ticket = await prisma.ticket.findFirst({
        where: { order_number: { contains: 'ds-011' } },
        include: {
            assignee: { include: { employee: { include: { department: true } } } },
            reason: true
        }
    });
    
    if (ticket) {
        console.log(`Ticket: ${ticket.order_number}`);
        console.log(`Assignee: ${ticket.assignee?.name} (${ticket.assigned_to})`);
        console.log(`Assignee Dept: ${ticket.assignee?.employee?.department?.name}`);
        console.log(`Reason Category: ${ticket.reason?.category}`);
    } else {
        console.log('Ticket not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
