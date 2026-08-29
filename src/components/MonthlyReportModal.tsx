"use client";

import { X, Calendar, TrendingDown, TrendingUp, Award, PieChart, ShieldCheck } from "lucide-react";

interface MonthlyReportModalProps {
  report: {
    monthName: string;
    year: number;
    totalSpending: number;
    prevMonthTotal: number;
    percentageChange: number;
    topCategory: { name: string; amount: number };
    topSpender: { name: string; amount: number };
    pendingSettlements: number;
    budgetUsage: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function MonthlyReportModal({ report, isOpen, onClose }: MonthlyReportModalProps) {
  if (!isOpen) return null;

  const isDecrease = report.percentageChange < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-purple-500/30 bg-gradient-to-br from-card via-card to-purple-950/20 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Financial Report — {report.monthName} {report.year}
              </h2>
              <p className="text-xs text-muted-foreground">Automated room accounting insights</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Executive summary banner */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border/60 bg-secondary/30">
            <span className="text-xs font-semibold text-muted-foreground">Total Spending</span>
            <p className="text-2xl font-black text-foreground mt-1">
              ₹{report.totalSpending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center space-x-1 text-xs font-bold mt-1">
              {isDecrease ? (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{Math.abs(report.percentageChange).toFixed(1)}% vs last month</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-rose-400">+{report.percentageChange.toFixed(1)}% vs last month</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-secondary/30">
            <span className="text-xs font-semibold text-muted-foreground">Budget Usage</span>
            <p className="text-2xl font-black text-foreground mt-1">{report.budgetUsage}%</p>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  report.budgetUsage > 100 ? "bg-rose-500" : report.budgetUsage > 80 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(report.budgetUsage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Highlights</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-border/40 bg-secondary/20 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <PieChart className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Top Category</p>
                <p className="text-xs font-bold text-foreground">{report.topCategory.name}</p>
                <p className="text-[10px] text-purple-400 font-medium">₹{report.topCategory.amount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/40 bg-secondary/20 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Highest Spender</p>
                <p className="text-xs font-bold text-foreground">{report.topSpender.name}</p>
                <p className="text-[10px] text-purple-400 font-medium">₹{report.topSpender.amount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/40 bg-secondary/20 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Pending Settlements</p>
                <p className="text-xs font-bold text-foreground">₹{report.pendingSettlements.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
