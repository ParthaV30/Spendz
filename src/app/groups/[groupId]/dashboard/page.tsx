import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateGroupBalances, simplifyDebts } from "@/lib/calculations/balanceEngine";
import MetricsCards from "@/components/MetricsCards";
import SmartSettlementsCard from "@/components/SmartSettlementsCard";
import CategoryBreakdownChart from "@/components/CategoryBreakdownChart";
import SpendingTrendChart from "@/components/SpendingTrendChart";
import Link from "next/link";
import { Receipt, AlertTriangle, ArrowRight, ShieldCheck, Calendar } from "lucide-react";

export default async function GroupDashboardPage({ params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const { membership } = await verifyGroupMembership(params.groupId);

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!group) return null;

  // Fetch all group expenses & splits
  const expenses = await prisma.expense.findMany({
    where: { groupId: params.groupId },
    include: {
      paidBy: true,
      category: true,
      splits: {
        include: { user: true },
      },
    },
    orderBy: { expenseDate: "desc" },
  });

  // Fetch settlements
  const settlements = await prisma.settlement.findMany({
    where: { groupId: params.groupId },
  });

  const memberIds = group.members.map((m) => m.userId);

  // Calculate balances using balanceEngine
  const balances = calculateGroupBalances(memberIds, expenses, settlements);

  // Calculate total group expenditure
  const totalExpenseMinor = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalExpenseRs = totalExpenseMinor / 100;

  // User's personal net metrics
  const myBalance = balances[user.id] || {
    totalPaid: 0,
    totalShare: 0,
    netBalance: 0,
  };

  const myShareRs = myBalance.totalShare / 100;
  const iOweRs = myBalance.netBalance < 0 ? Math.abs(myBalance.netBalance) / 100 : 0;
  const imOwedRs = myBalance.netBalance > 0 ? myBalance.netBalance / 100 : 0;

  // Simplify debts using min-cash-flow algorithm
  const netBalancesMap: Record<string, number> = {};
  Object.values(balances).forEach((b) => {
    netBalancesMap[b.userId] = b.netBalance;
  });
  const simplifiedTxs = simplifyDebts(netBalancesMap);

  // Category breakdown for chart
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const catName = e.category.name;
    categoryTotals[catName] = (categoryTotals[catName] || 0) + e.amount / 100;
  });
  const categoryChartData = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
  }));

  // Monthly spending trend
  const monthTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const monthKey = new Date(e.expenseDate).toLocaleString("default", { month: "short", year: "numeric" });
    monthTotals[monthKey] = (monthTotals[monthKey] || 0) + e.amount / 100;
  });
  const trendChartData = Object.entries(monthTotals).map(([month, total]) => ({
    month,
    total,
  }));

  // Budget warnings & total monthly budget
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const budgets = await prisma.budget.findMany({
    where: { groupId: params.groupId, month: currentMonth, year: currentYear },
    include: { category: true },
  });

  const totalBudgetRs = budgets.reduce((acc, b) => acc + b.amount / 100, 0);

  const budgetWarnings = budgets.map((b) => {
    const spentMinor = expenses
      .filter(
        (e) =>
          e.categoryId === b.categoryId &&
          new Date(e.expenseDate).getMonth() + 1 === currentMonth &&
          new Date(e.expenseDate).getFullYear() === currentYear
      )
      .reduce((acc, e) => acc + e.amount, 0);

    const spentRs = spentMinor / 100;
    const limitRs = b.amount / 100;
    const pct = Math.round((spentRs / limitRs) * 100);

    return {
      category: b.category.name,
      spentRs,
      limitRs,
      pct,
    };
  }).filter((b) => b.pct >= 80);

  const formattedMembers = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30">
              {group.currency} Group
            </span>
            <span>•</span>
            <span>{group.members.length} Members</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
          )}
        </div>
      </div>

      {/* Budget Warnings Alert Banner */}
      {budgetWarnings.length > 0 && (
        <div className="space-y-2">
          {budgetWarnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium ${
                w.pct >= 100
                  ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
                  : "bg-amber-950/20 border-amber-500/40 text-amber-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{w.category} Budget Alert:</strong> {w.pct >= 100 ? "EXCEEDED limit!" : "Nearing limit (" + w.pct + "%)"}
                </span>
              </div>
              <span className="font-bold text-xs">
                ₹{w.spentRs.toLocaleString("en-IN")} / ₹{w.limitRs.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Financial Metrics Cards */}
      <MetricsCards
        totalExpenses={totalExpenseRs}
        mySpending={myShareRs}
        iOwe={iOweRs}
        imOwed={imOwedRs}
        totalBudget={totalBudgetRs}
      />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Smart Debt & Charts */}
        <div className="lg:col-span-2 space-y-8">
          <SmartSettlementsCard
            groupId={params.groupId}
            members={formattedMembers}
            transactions={simplifiedTxs}
            currentUserId={user.id}
          />

          {/* Spending Trend Area Chart */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-foreground text-base">Monthly Spending Trend</h3>
            <SpendingTrendChart data={trendChartData} />
          </div>

          {/* Recent Expenses List */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-base">Recent Room Expenses</h3>
              <Link
                href={`/groups/${params.groupId}/expenses`}
                className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1"
              >
                <span>View All ({expenses.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No expenses added yet. Click "Add Expense" above to start!
              </p>
            ) : (
              <div className="space-y-3">
                {expenses.slice(0, 5).map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 font-bold text-xs">
                        {exp.category.name.substring(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{exp.description}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Paid by <strong className="text-foreground">{exp.paidBy.name}</strong> •{" "}
                          {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          ({exp.splitMethod})
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-foreground text-base">
                        ₹{(exp.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Category Breakdown & Member Spending */}
        <div className="space-y-8">
          {/* Category Breakdown Pie Chart */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-foreground text-base">Expense Categories</h3>
            <CategoryBreakdownChart data={categoryChartData} />
          </div>

          {/* Member Net Position Leaderboard */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-foreground text-base">Member Net Balances</h3>
            <div className="space-y-3">
              {group.members.map((m) => {
                const b = balances[m.userId] || { netBalance: 0, totalPaid: 0, totalShare: 0 };
                const netRs = b.netBalance / 100;
                const isPositive = netRs >= 0;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/20"
                  >
                    <div className="flex items-center space-x-3">
                      {m.user.avatar ? (
                        <img src={m.user.avatar} alt={m.user.name} className="h-8 w-8 rounded-full border border-purple-500/30" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                          {m.user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-foreground">{m.user.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Paid ₹{(b.totalPaid / 100).toLocaleString("en-IN")} • Share ₹{(b.totalShare / 100).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-black ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPositive ? `+₹${netRs.toFixed(2)}` : `-₹${Math.abs(netRs).toFixed(2)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
