"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import AddPersonalExpenseModal from "@/components/AddPersonalExpenseModal";
import { Wallet, Target, TrendingUp, AlertTriangle, Plus, Trash2, ShieldCheck, Zap } from "lucide-react";
import CategoryBreakdownChart from "@/components/CategoryBreakdownChart";
import SpendingTrendChart from "@/components/SpendingTrendChart";
import { calculateBudgetForecast } from "@/lib/budgetForecast";
import { deletePersonalExpense, upsertPersonalBudget, deletePersonalBudget } from "@/app/actions/personalActions";

interface PersonalCategory {
  id: string;
  name: string;
  icon: string;
}

interface PersonalExpenseItem {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string | null;
  notes?: string | null;
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

interface CategoryBudget {
  categoryId: string;
  categoryName: string;
  budgetId: string | null;
  limitRs: number;
  spentRs: number;
  pct: number;
}

interface PersonalClientShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  groups: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  totalSpentRs: number;
  totalBudgetRs: number;
  month: number;
  year: number;
  expenses: PersonalExpenseItem[];
  categories: PersonalCategory[];
  categoryBudgets: CategoryBudget[];
  categoryChartData: Array<{ name: string; amount: number }>;
  trendChartData: Array<{ month: string; total: number }>;
}

export default function PersonalClientShell({
  user,
  groups,
  totalSpentRs,
  totalBudgetRs,
  month,
  year,
  expenses,
  categories,
  categoryBudgets,
  categoryChartData,
  trendChartData,
}: PersonalClientShellProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || "");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("ALL");

  const forecast = totalBudgetRs > 0 ? calculateBudgetForecast(totalSpentRs * 100, totalBudgetRs * 100) : null;

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCatFilter === "ALL" || e.category.id === selectedCatFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this personal expense?")) return;
    await deletePersonalExpense(id);
    window.location.reload();
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetError(null);
    const num = parseFloat(budgetAmount);
    if (isNaN(num) || num <= 0) {
      setBudgetError("Please enter a valid budget limit");
      return;
    }
    setBudgetLoading(true);
    const res = await upsertPersonalBudget(selectedCatId, month, year, num);
    setBudgetLoading(false);
    if (res.error) {
      setBudgetError(res.error);
    } else {
      setIsBudgetModalOpen(false);
      window.location.reload();
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm("Are you sure you want to remove this personal budget cap?")) return;
    await deletePersonalBudget(budgetId);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        user={user}
        groups={groups}
        onOpenAddExpense={() => setIsAddModalOpen(true)}
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                Personal Spending Tracker
              </span>
              <span>•</span>
              <span>Private & Non-shared</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Personal Financial Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your individual expenses, personal budgets, and AI receipt scans
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-foreground bg-secondary hover:bg-secondary/80 border border-border/60 rounded-xl transition-all flex items-center space-x-1.5"
            >
              <Target className="h-4 w-4 text-blue-400" />
              <span>Set Category Budget</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Personal Expense</span>
            </button>
          </div>
        </div>

        {/* Budget Velocity Alert Banner */}
        {forecast && (
          <div
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-lg transition-all ${
              forecast.status === "EXCEEDED"
                ? "border-destructive/50 bg-gradient-to-r from-destructive/20 via-rose-950/20 to-card"
                : forecast.status === "WARNING"
                ? "border-amber-500/50 bg-gradient-to-r from-amber-950/30 via-amber-900/10 to-card"
                : "border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-emerald-900/10 to-card"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    forecast.status === "EXCEEDED"
                      ? "bg-destructive/20 text-destructive border-destructive/40"
                      : forecast.status === "WARNING"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  {forecast.status === "EXCEEDED" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : forecast.status === "WARNING" ? (
                    <Zap className="h-5 w-5 animate-pulse" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-foreground">Personal Velocity Forecast</h4>
                    <span
                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                        forecast.status === "EXCEEDED"
                          ? "bg-destructive/20 text-destructive border-destructive/30"
                          : forecast.status === "WARNING"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {forecast.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{forecast.message}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-right ml-auto">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Daily Pace</span>
                  <span className="text-xs font-bold text-foreground">
                    ₹{(forecast.dailyVelocity / 100).toFixed(0)}/day
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Projected EOM</span>
                  <span
                    className={`text-xs font-bold ${
                      forecast.projectedSpend > forecast.totalBudget ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    ₹{(forecast.projectedSpend / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-card to-blue-950/20 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Personal Spent</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight text-foreground">
                ₹{totalSpentRs.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">This month's personal expenditure</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-card to-indigo-950/20 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Personal Budget Limit</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight text-foreground">
                {totalBudgetRs > 0 ? `₹${totalBudgetRs.toLocaleString("en-IN")}` : "No Cap Set"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Cumulative monthly personal budget cap</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-card to-purple-950/20 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Budget Remaining</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight text-foreground">
                {totalBudgetRs > 0 ? `₹${Math.max(0, totalBudgetRs - totalSpentRs).toLocaleString("en-IN")}` : "N/A"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Available budget for rest of month</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-foreground text-base">Personal Spending Pace</h3>
            <SpendingTrendChart data={trendChartData} />
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-foreground text-base">Personal Expense Breakdown</h3>
            <CategoryBreakdownChart data={categoryChartData} />
          </div>
        </div>

        {/* Category Budgets Grid */}
        <div className="space-y-4">
          <h3 className="font-bold text-foreground text-lg">Category Budgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((b) => {
              const isWarning = b.pct >= 80 && b.pct < 100;
              const isExceeded = b.pct >= 100;

              return (
                <div
                  key={b.categoryId}
                  className={`rounded-2xl border p-4 shadow-md space-y-3 ${
                    isExceeded
                      ? "border-rose-500/50 bg-rose-950/10"
                      : isWarning
                      ? "border-amber-500/50 bg-amber-950/10"
                      : "border-border/60 bg-card/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{b.categoryName}</span>
                    {b.budgetId && (
                      <button
                        onClick={() => handleDeleteBudget(b.budgetId!)}
                        className="p-1 text-muted-foreground hover:text-rose-400"
                        title="Remove budget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {b.limitRs === 0 ? (
                    <p className="text-xs text-muted-foreground">₹{b.spentRs.toFixed(2)} spent • No budget cap</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Spent: ₹{b.spentRs.toLocaleString("en-IN")}</span>
                        <span className="text-muted-foreground">Cap: ₹{b.limitRs.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(b.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses List */}
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="font-bold text-foreground text-lg">Personal Expenses Log</h3>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search personal expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary/60 text-xs px-3 py-1.5 rounded-xl border border-border focus:outline-none"
              />
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="bg-secondary/60 text-xs px-3 py-1.5 rounded-xl border border-border focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No personal expenses recorded yet. Click "Add Personal Expense" above to add your first purchase!
            </p>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-xs">
                      {exp.category.name.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{exp.description}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        • {exp.category.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-black text-foreground text-base">
                      ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Set Personal Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-foreground text-lg">Define Personal Category Budget</h3>
            {budgetError && <p className="text-xs text-rose-400 font-semibold">{budgetError}</p>}
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Monthly Limit (₹)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={budgetLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
                >
                  Save Personal Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddPersonalExpenseModal
        categories={categories}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
