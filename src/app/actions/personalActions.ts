"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const DEFAULT_PERSONAL_CATEGORIES = [
  { name: "Food & Dining", icon: "Utensils" },
  { name: "Groceries", icon: "ShoppingCart" },
  { name: "Shopping", icon: "ShoppingBag" },
  { name: "Travel & Transport", icon: "Car" },
  { name: "Utilities & Bills", icon: "Zap" },
  { name: "Subscriptions", icon: "Repeat" },
  { name: "Entertainment", icon: "Film" },
  { name: "Healthcare", icon: "HeartPulse" },
  { name: "Personal Care", icon: "User" },
  { name: "Other", icon: "Tag" },
];

export async function ensureDefaultPersonalCategories(userId: string) {
  const count = await prisma.personalCategory.count({ where: { userId } });
  if (count === 0) {
    await prisma.personalCategory.createMany({
      data: DEFAULT_PERSONAL_CATEGORIES.map((c) => ({
        userId,
        name: c.name,
        icon: c.icon,
        isDefault: true,
      })),
    });
  }
}

export async function getPersonalCategories() {
  const user = await getSessionUser();
  if (!user) return [];

  await ensureDefaultPersonalCategories(user.id);

  return await prisma.personalCategory.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

export async function getPersonalExpenses(filters?: {
  search?: string;
  categoryId?: string;
  month?: number;
  year?: number;
}) {
  const user = await getSessionUser();
  if (!user) return [];

  const whereClause: any = { userId: user.id };

  if (filters?.search) {
    whereClause.OR = [
      { description: { contains: filters.search } },
      { notes: { contains: filters.search } },
    ];
  }

  if (filters?.categoryId && filters.categoryId !== "ALL") {
    whereClause.categoryId = filters.categoryId;
  }

  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
    whereClause.expenseDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  const expenses = await prisma.personalExpense.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { expenseDate: "desc" },
  });

  return expenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount / 100, // main currency ₹
    expenseDate: e.expenseDate.toISOString(),
    receiptUrl: e.receiptUrl,
    notes: e.notes,
    category: {
      id: e.category.id,
      name: e.category.name,
      icon: e.category.icon,
    },
  }));
}

export async function createPersonalExpense(input: {
  categoryId: string;
  amount: number; // in main currency e.g. ₹500
  description: string;
  expenseDate: string;
  notes?: string;
  receiptUrl?: string;
}) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const amountMinor = Math.round(input.amount * 100);
  if (amountMinor <= 0) {
    return { error: "Amount must be greater than zero." };
  }

  if (!input.description.trim()) {
    return { error: "Description is required." };
  }

  const category = await prisma.personalCategory.findUnique({
    where: { id: input.categoryId },
  });

  if (!category || category.userId !== user.id) {
    return { error: "Invalid category selected." };
  }

  const created = await prisma.personalExpense.create({
    data: {
      userId: user.id,
      categoryId: input.categoryId,
      amount: amountMinor,
      description: input.description.trim(),
      expenseDate: new Date(input.expenseDate || Date.now()),
      notes: input.notes?.trim() || null,
      receiptUrl: input.receiptUrl || null,
    },
  });

  revalidatePath("/personal");
  return { success: true, expenseId: created.id };
}

export async function deletePersonalExpense(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const existing = await prisma.personalExpense.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Personal expense not found." };
  }

  await prisma.personalExpense.delete({ where: { id } });

  revalidatePath("/personal");
  return { success: true };
}

export async function upsertPersonalBudget(
  categoryId: string,
  month: number,
  year: number,
  amount: number // in main currency
) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const amountMinor = Math.round(amount * 100);
  if (amountMinor <= 0) {
    return { error: "Budget limit must be greater than zero." };
  }

  const budget = await prisma.personalBudget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId: user.id,
        categoryId,
        month,
        year,
      },
    },
    create: {
      userId: user.id,
      categoryId,
      month,
      year,
      amount: amountMinor,
    },
    update: {
      amount: amountMinor,
    },
  });

  revalidatePath("/personal");
  return { success: true, budget };
}

export async function deletePersonalBudget(budgetId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const budget = await prisma.personalBudget.findUnique({ where: { id: budgetId } });
  if (!budget || budget.userId !== user.id) {
    return { error: "Budget not found" };
  }

  await prisma.personalBudget.delete({ where: { id: budgetId } });

  revalidatePath("/personal");
  return { success: true };
}

export async function getPersonalOverviewData(month?: number, year?: number) {
  const user = await getSessionUser();
  if (!user) return null;

  await ensureDefaultPersonalCategories(user.id);

  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const categories = await prisma.personalCategory.findMany({
    where: { userId: user.id },
  });

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const expenses = await prisma.personalExpense.findMany({
    where: {
      userId: user.id,
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { category: true },
    orderBy: { expenseDate: "desc" },
  });

  const budgets = await prisma.personalBudget.findMany({
    where: {
      userId: user.id,
      month: targetMonth,
      year: targetYear,
    },
  });

  const totalSpentMinor = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalBudgetMinor = budgets.reduce((acc, b) => acc + b.amount, 0);

  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category.name] = (categoryTotals[e.category.name] || 0) + e.amount / 100;
  });

  const categoryChartData = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
  }));

  // Daily trend
  const dailyTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const dayKey = new Date(e.expenseDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + e.amount / 100;
  });

  const trendChartData = Object.entries(dailyTotals).map(([day, total]) => ({
    month: day,
    total,
  }));

  const categoryBudgets = categories.map((cat) => {
    const budgetObj = budgets.find((b) => b.categoryId === cat.id);
    const limitRs = budgetObj ? budgetObj.amount / 100 : 0;
    const spentRs = (categoryTotals[cat.name] || 0);
    const pct = limitRs > 0 ? Math.round((spentRs / limitRs) * 100) : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      budgetId: budgetObj?.id || null,
      limitRs,
      spentRs,
      pct,
    };
  });

  return {
    totalSpentRs: totalSpentMinor / 100,
    totalBudgetRs: totalBudgetMinor / 100,
    month: targetMonth,
    year: targetYear,
    expenses: expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount / 100,
      expenseDate: e.expenseDate.toISOString(),
      receiptUrl: e.receiptUrl,
      notes: e.notes,
      category: e.category,
    })),
    categories,
    categoryBudgets,
    categoryChartData,
    trendChartData,
  };
}
