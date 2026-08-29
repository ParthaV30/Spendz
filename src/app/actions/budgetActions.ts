"use server";

import { prisma } from "@/lib/prisma";
import { verifyGroupAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upsertBudget(
  groupId: string,
  categoryId: string,
  month: number,
  year: number,
  amount: number // in main currency e.g. 15000
) {
  const { user } = await verifyGroupAdmin(groupId);

  const amountMinor = Math.round(amount * 100);
  if (amountMinor <= 0) {
    return { error: "Budget amount must be greater than zero." };
  }

  const budget = await prisma.budget.upsert({
    where: {
      groupId_categoryId_month_year: {
        groupId,
        categoryId,
        month,
        year,
      },
    },
    create: {
      groupId,
      categoryId,
      month,
      year,
      amount: amountMinor,
    },
    update: {
      amount: amountMinor,
    },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "BUDGET_CHANGE",
      entityType: "Budget",
      entityId: budget.id,
      metadata: JSON.stringify({ categoryId, month, year, amount }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, budget };
}

export async function deleteBudget(groupId: string, budgetId: string) {
  const { user } = await verifyGroupAdmin(groupId);

  await prisma.budget.delete({ where: { id: budgetId } });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "BUDGET_DELETE",
      entityType: "Budget",
      entityId: budgetId,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
