import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage({ params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  await verifyGroupMembership(params.groupId);

  const expenses = await prisma.expense.findMany({
    where: { groupId: params.groupId },
    include: {
      category: true,
      paidBy: true,
      splits: { include: { user: true } },
    },
    orderBy: { expenseDate: "desc" },
  });

  const settlements = await prisma.settlement.findMany({
    where: { groupId: params.groupId, status: "CONFIRMED" },
  });

  const formattedExpenses = expenses.map((e) => ({
    id: e.id,
    amount: e.amount / 100,
    categoryName: e.category.name,
    paidByName: e.paidBy.name,
    expenseDate: e.expenseDate.toISOString(),
  }));

  // Calculate monthly report metrics for current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const prevMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
  });

  const totalThisMonth = thisMonthExpenses.reduce((acc, e) => acc + e.amount / 100, 0);
  const totalPrevMonth = prevMonthExpenses.reduce((acc, e) => acc + e.amount / 100, 0);

  const pctChange = totalPrevMonth === 0 ? 0 : ((totalThisMonth - totalPrevMonth) / totalPrevMonth) * 100;

  // Top category
  const catMap: Record<string, number> = {};
  thisMonthExpenses.forEach((e) => {
    catMap[e.category.name] = (catMap[e.category.name] || 0) + e.amount / 100;
  });
  let topCategory = { name: "N/A", amount: 0 };
  Object.entries(catMap).forEach(([name, amount]) => {
    if (amount > topCategory.amount) topCategory = { name, amount };
  });

  // Top spender
  const spenderMap: Record<string, number> = {};
  thisMonthExpenses.forEach((e) => {
    spenderMap[e.paidBy.name] = (spenderMap[e.paidBy.name] || 0) + e.amount / 100;
  });
  let topSpender = { name: "N/A", amount: 0 };
  Object.entries(spenderMap).forEach(([name, amount]) => {
    if (amount > topSpender.amount) topSpender = { name, amount };
  });

  // Budgets
  const budgets = await prisma.budget.findMany({
    where: { groupId: params.groupId, month: currentMonth, year: currentYear },
  });
  const totalBudgetRs = budgets.reduce((acc, b) => acc + b.amount / 100, 0);
  const budgetUsage = totalBudgetRs === 0 ? 0 : Math.round((totalThisMonth / totalBudgetRs) * 100);

  const monthName = now.toLocaleString("default", { month: "long" });

  const monthlyReport = {
    monthName,
    year: currentYear,
    totalSpending: totalThisMonth,
    prevMonthTotal: totalPrevMonth,
    percentageChange: pctChange,
    topCategory,
    topSpender,
    pendingSettlements: 0,
    budgetUsage,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Financial Analytics & Reports</h1>
        <p className="text-xs text-muted-foreground">Interactive visualizations and automated monthly executive reports</p>
      </div>

      <AnalyticsClient expenses={formattedExpenses} monthlyReport={monthlyReport} />
    </div>
  );
}
