"use server";

import { prisma } from "@/lib/prisma";
import { verifyGroupMembership } from "@/lib/auth";
import { calculateEqualSplit } from "@/lib/calculations/splitEngine";
import { isPeriodLocked } from "@/lib/calculations/monthLocking";
import { revalidatePath } from "next/cache";

export async function createRecurringExpense(
  groupId: string,
  categoryId: string,
  description: string,
  amount: number, // in main currency
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
  nextDueDate: string
) {
  const { user } = await verifyGroupMembership(groupId);

  const amountMinor = Math.round(amount * 100);

  const item = await prisma.recurringExpense.create({
    data: {
      groupId,
      createdById: user.id,
      categoryId,
      description: description.trim(),
      amount: amountMinor,
      frequency,
      nextDueDate: new Date(nextDueDate),
      active: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "RECURRING_CREATE",
      entityType: "RecurringExpense",
      entityId: item.id,
      metadata: JSON.stringify({ description, amount, frequency }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, item };
}

export async function processDueRecurringExpenses(groupId: string) {
  const { user } = await verifyGroupMembership(groupId);
  const now = new Date();

  // Check Month Locking
  const lockedMonths = await prisma.lockedMonth.findMany({
    where: { groupId },
  });

  if (isPeriodLocked(now, lockedMonths)) {
    return { error: "Cannot process recurring expenses: Current accounting period is LOCKED." };
  }

  // Find due active recurring items
  const dueItems = await prisma.recurringExpense.findMany({
    where: {
      groupId,
      active: true,
      nextDueDate: { lte: now },
    },
    include: {
      category: true,
    },
  });

  if (dueItems.length === 0) {
    return { success: true, processedCount: 0 };
  }

  // Get active group members for equal split
  const activeMembers = await prisma.groupMember.findMany({
    where: { groupId, status: "ACTIVE" },
    select: { userId: true },
  });
  const memberUserIds = activeMembers.map((m) => m.userId);

  let processedCount = 0;

  for (const item of dueItems) {
    const splits = calculateEqualSplit(item.amount, memberUserIds);

    await prisma.$transaction(async (tx) => {
      // Create actual expense entry
      const created = await tx.expense.create({
        data: {
          groupId,
          paidById: item.createdById,
          categoryId: item.categoryId,
          amount: item.amount,
          description: `[Auto Recurring] ${item.description}`,
          expenseDate: new Date(),
          splitMethod: "EQUAL",
          notes: `Automated recurring expense generated from ${item.frequency} schedule.`,
          splits: {
            create: splits.map((s) => ({ userId: s.userId, amount: s.amount })),
          },
        },
      });

      // Calculate next due date
      const nextDate = new Date(item.nextDueDate);
      if (item.frequency === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
      else if (item.frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
      else if (item.frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (item.frequency === "YEARLY") nextDate.setFullYear(nextDate.getFullYear() + 1);

      await tx.recurringExpense.update({
        where: { id: item.id },
        data: { nextDueDate: nextDate },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          groupId,
          userId: item.createdById,
          action: "EXPENSE_CREATE",
          entityType: "Expense",
          entityId: created.id,
          metadata: JSON.stringify({
            description: created.description,
            amount: item.amount / 100,
            autoRecurring: true,
          }),
        },
      });

      // Notify involved members (except payer)
      const otherMembers = memberUserIds.filter((id) => id !== item.createdById);
      if (otherMembers.length > 0) {
        await tx.notification.createMany({
          data: otherMembers.map((userId) => ({
            userId,
            groupId,
            title: "Automated Recurring Expense Added",
            message: `Scheduled bill "${item.description}" (₹${(item.amount / 100).toFixed(2)}) was processed.`,
            type: "EXPENSE_ADDED",
          })),
        });
      }
    });

    processedCount++;
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true, processedCount };
}

export async function toggleRecurringExpense(groupId: string, id: string, active: boolean) {
  const { user } = await verifyGroupMembership(groupId);

  await prisma.recurringExpense.update({
    where: { id },
    data: { active },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
