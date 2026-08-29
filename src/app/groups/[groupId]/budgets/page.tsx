import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BudgetsClient from "./BudgetsClient";

export default async function BudgetsPage({ params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const { membership } = await verifyGroupMembership(params.groupId);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      categories: true,
      budgets: {
        where: { month: currentMonth, year: currentYear },
        include: { category: true },
      },
      expenses: {
        include: { category: true },
      },
    },
  });

  if (!group) return null;

  // Filter expenses for current month
  const monthExpenses = group.expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const formattedBudgets = group.categories.map((cat) => {
    const budgetObj = group.budgets.find((b) => b.categoryId === cat.id);
    const limitRs = budgetObj ? budgetObj.amount / 100 : 0;

    const spentMinor = monthExpenses
      .filter((e) => e.categoryId === cat.id)
      .reduce((acc, e) => acc + e.amount, 0);

    const spentRs = spentMinor / 100;
    const remainingRs = Math.max(0, limitRs - spentRs);
    const pct = limitRs === 0 ? 0 : Math.round((spentRs / limitRs) * 100);

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      budgetId: budgetObj?.id || null,
      limitRs,
      spentRs,
      remainingRs,
      pct,
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Monthly Category Budgets</h1>
        <p className="text-xs text-muted-foreground">Set target budget caps per category and track expenditure limits</p>
      </div>

      <BudgetsClient
        groupId={params.groupId}
        userRole={membership.role}
        budgets={formattedBudgets}
        categories={group.categories}
        month={currentMonth}
        year={currentYear}
      />
    </div>
  );
}
