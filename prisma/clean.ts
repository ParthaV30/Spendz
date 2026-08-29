import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanData() {
  console.log("🧹 Clearing all database data...");

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.lockedMonth.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  console.log("✨ ALL TEST DATA CLEARED SUCCESSFULLY!");
}

cleanData()
  .catch((err) => {
    console.error("❌ Failed to clear database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
