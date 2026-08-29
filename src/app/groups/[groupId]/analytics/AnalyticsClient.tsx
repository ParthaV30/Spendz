"use client";

import { useState } from "react";
import CategoryBreakdownChart from "@/components/CategoryBreakdownChart";
import SpendingTrendChart from "@/components/SpendingTrendChart";
import MonthlyReportModal from "@/components/MonthlyReportModal";
import { FileText, Calendar, Filter } from "lucide-react";

interface AnalyticsClientProps {
  expenses: Array<{
    id: string;
    amount: number;
    categoryName: string;
    paidByName: string;
    expenseDate: string;
  }>;
  monthlyReport: any;
}

export default function AnalyticsClient({ expenses, monthlyReport }: AnalyticsClientProps) {
  const [range, setRange] = useState("ALL");
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Filter expenses by range
  const now = new Date();
  const filtered = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    if (range === "THIS_MONTH") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (range === "LAST_3_MONTHS") {
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      return diffMonths <= 3;
    }
    if (range === "THIS_YEAR") {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Prepare chart data
  const catTotals: Record<string, number> = {};
  filtered.forEach((e) => {
    catTotals[e.categoryName] = (catTotals[e.categoryName] || 0) + e.amount;
  });
  const categoryChartData = Object.entries(catTotals).map(([name, amount]) => ({ name, amount }));

  const monthTotals: Record<string, number> = {};
  filtered.forEach((e) => {
    const monthKey = new Date(e.expenseDate).toLocaleString("default", { month: "short", year: "numeric" });
    monthTotals[monthKey] = (monthTotals[monthKey] || 0) + e.amount;
  });
  const trendChartData = Object.entries(monthTotals).map(([month, total]) => ({ month, total }));

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 border border-border/60 p-4 rounded-2xl">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Time Period:</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-secondary/60 border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_3_MONTHS">Last 3 Months</option>
            <option value="THIS_YEAR">This Year</option>
          </select>
        </div>

        <button
          onClick={() => setIsReportOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-purple-500/25"
        >
          <FileText className="h-4 w-4" />
          <span>Generate Monthly Report</span>
        </button>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-foreground text-base">Category Expenditure Breakdown</h3>
          <CategoryBreakdownChart data={categoryChartData} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-foreground text-base">Monthly Spending Trend</h3>
          <SpendingTrendChart data={trendChartData} />
        </div>
      </div>

      <MonthlyReportModal report={monthlyReport} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
