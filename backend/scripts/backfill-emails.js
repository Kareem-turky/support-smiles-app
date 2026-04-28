"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
async function backfill() {
    console.log('--- Starting Deterministic Email Backfill ---');
    const allUsers = await prisma.user.findMany({
        orderBy: { created_at: 'asc' },
    });
    const normalizedMap = new Map();
    for (const user of allUsers) {
        const norm = normalizeEmail(user.email);
        if (!normalizedMap.has(norm)) {
            normalizedMap.set(norm, []);
        }
        normalizedMap.get(norm).push(user);
    }
    console.log(`Found ${allUsers.length} total users.`);
    console.log(`Found ${normalizedMap.size} unique normalized emails.`);
    for (const [norm, users] of normalizedMap.entries()) {
        if (users.length > 1) {
            console.log(`Handling duplicates for: ${norm} (${users.length} found)`);
            const winner = users[0];
            const duplicates = users.slice(1);
            await prisma.user.update({
                where: { id: winner.id },
                data: { email_normalized: norm },
            });
            for (const dup of duplicates) {
                const newEmail = `${dup.email}.dup.${dup.id}`;
                const newNorm = normalizeEmail(newEmail);
                console.log(`  Deactivating duplicate ID ${dup.id}: ${dup.email} -> ${newEmail}`);
                await prisma.user.update({
                    where: { id: dup.id },
                    data: {
                        email: newEmail,
                        email_normalized: newNorm,
                        is_active: false,
                    },
                });
            }
        }
        else {
            await prisma.user.update({
                where: { id: users[0].id },
                data: { email_normalized: norm },
            });
        }
    }
    console.log('--- Backfill Complete ---');
}
backfill()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill-emails.js.map