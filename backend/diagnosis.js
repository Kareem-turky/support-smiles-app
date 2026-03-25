const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const departments = await prisma.department.findMany();
    console.log('Departments:');
    departments.forEach(d => console.log(`- ${d.name} (${d.id})`));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
