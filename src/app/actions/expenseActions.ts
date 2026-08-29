"use server";

import { prisma } from "@/lib/prisma";
import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
} from "@/lib/calculations/splitEngine";
import { isPeriodLocked } from "@/lib/calculations/monthLocking";
import { revalidatePath } from "next/cache";

export interface ExpenseInput {
  groupId: string;
  paidById: string;
  categoryId: string;
  amount: number; // In main currency e.g. ₹1200 or minor units
  description: string;
  expenseDate: string; // ISO date string
  splitMethod: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";
  notes?: string;
  receiptUrl?: string;
  splits: {
    userId: string;
    amount?: number;       // for exact (in minor units)
    percentage?: number;   // for percentage (e.g. 50)
    shares?: number;       // for shares (e.g. 2)
  }[];
}

export async function createExpense(input: ExpenseInput) {
  const { user } = await verifyGroupMembership(input.groupId);

  // Convert amount to minor units (paise/cents) if passed as decimal float/int
  const amountMinor = Math.round(input.amount * 100);
  if (amountMinor <= 0) {
    return { error: "Expense amount must be greater than zero." };
  }

  const expenseDate = new Date(input.expenseDate || Date.now());

  // Check Month Locking
  const lockedMonths = await prisma.lockedMonth.findMany({
    where: { groupId: input.groupId },
  });

  if (isPeriodLocked(expenseDate, lockedMonths)) {
    return { error: "Cannot add expense: This accounting period is LOCKED by group admin." };
  }

  // Calculate splits using financial engine
  let calculatedSplits: { userId: string; amount: number; percentage?: number; shares?: number }[] = [];

  try {
    if (input.splitMethod === "EQUAL") {
      const userIds = input.splits.map((s) => s.userId);
      calculatedSplits = calculateEqualSplit(amountMinor, userIds);
    } else if (input.splitMethod === "EXACT") {
      const exactInput = input.splits.map((s) => ({
        userId: s.userId,
        amount: Math.round((s.amount || 0) * 100),
      }));
      calculatedSplits = calculateExactSplit(amountMinor, exactInput);
    } else if (input.splitMethod === "PERCENTAGE") {
      const pctInput = input.splits.map((s) => ({
        userId: s.userId,
        percentage: s.percentage || 0,
      }));
      calculatedSplits = calculatePercentageSplit(amountMinor, pctInput);
    } else if (input.splitMethod === "SHARES") {
      const sharesInput = input.splits.map((s) => ({
        userId: s.userId,
        shares: s.shares || 1,
      }));
      calculatedSplits = calculateSharesSplit(amountMinor, sharesInput);
    }
  } catch (err: any) {
    return { error: err.message || "Invalid split configuration" };
  }

  // Execute inside DB Transaction
  const expense = await prisma.$transaction(async (tx) => {
    const createdExpense = await tx.expense.create({
      data: {
        groupId: input.groupId,
        paidById: input.paidById,
        categoryId: input.categoryId,
        amount: amountMinor,
        description: input.description.trim(),
        expenseDate,
        splitMethod: input.splitMethod,
        notes: input.notes?.trim() || null,
        receiptUrl: input.receiptUrl || null,
        splits: {
          create: calculatedSplits.map((s) => ({
            userId: s.userId,
            amount: s.amount,
            percentage: s.percentage,
            shares: s.shares,
          })),
        },
      },
      include: {
        paidBy: true,
        category: true,
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        groupId: input.groupId,
        userId: user.id,
        action: "EXPENSE_CREATE",
        entityType: "Expense",
        entityId: createdExpense.id,
        metadata: JSON.stringify({
          description: createdExpense.description,
          amount: amountMinor / 100,
          paidBy: createdExpense.paidBy.name,
        }),
      },
    });

    // Notify involved members (except creator)
    const otherMembers = input.splits
      .filter((s) => s.userId !== user.id)
      .map((s) => s.userId);

    if (otherMembers.length > 0) {
      await tx.notification.createMany({
        data: otherMembers.map((userId) => ({
          userId,
          groupId: input.groupId,
          title: "New Expense Added",
          message: `${user.name} added "${createdExpense.description}" (₹${(amountMinor / 100).toFixed(2)})`,
          type: "EXPENSE_ADDED",
        })),
      });
    }

    return createdExpense;
  });

  revalidatePath(`/groups/${input.groupId}`);
  return { success: true, expenseId: expense.id };
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const { user, membership } = await verifyGroupMembership(groupId);

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
  });

  if (!expense || expense.groupId !== groupId) {
    return { error: "Expense not found" };
  }

  // Check Month Locking
  const lockedMonths = await prisma.lockedMonth.findMany({
    where: { groupId },
  });

  if (isPeriodLocked(expense.expenseDate, lockedMonths)) {
    return { error: "Cannot delete expense: This accounting period is LOCKED." };
  }

  // Only Admin or the person who paid can delete
  if (membership.role !== "ADMIN" && expense.paidById !== user.id) {
    return { error: "FORBIDDEN: Only the payer or group admin can delete this expense." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.expenseSplit.deleteMany({ where: { expenseId } });
    await tx.expense.delete({ where: { id: expenseId } });

    await tx.auditLog.create({
      data: {
        groupId,
        userId: user.id,
        action: "EXPENSE_DELETE",
        entityType: "Expense",
        entityId: expenseId,
        metadata: JSON.stringify({ description: expense.description, amount: expense.amount / 100 }),
      },
    });
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
