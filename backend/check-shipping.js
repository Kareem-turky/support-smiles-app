const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.shippingCompany.findMany();
  console.log("Shipping Companies:", companies);
}
main().catch(console.error).finally(() => prisma.$disconnect());
