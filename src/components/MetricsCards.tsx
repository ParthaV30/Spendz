"use client";

import { Wallet, ArrowDownRight, ArrowUpRight, TrendingUp, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { calculateBudgetForecast } from "@/lib/budgetForecast";

interface MetricsCardsProps {
  totalExpenses: number;   // in main currency ₹
  mySpending: number;      // in main currency ₹
  iOwe: number;            // in main currency ₹
  imOwed: number;          // in main currency ₹
  totalBudget?: number;    // optional budget amount in ₹
  currencySymbol?: string;
}

export default function MetricsCards({
  totalExpenses,
  mySpending,
  iOwe,
  imOwed,
  totalBudget,
  currencySymbol = "₹",
}: MetricsCardsProps) {
  const forecast = totalBudget && totalBudget > 0
    ? calculateBudgetForecast(totalExpenses * 100, totalBudget * 100)
    : null;

  return (
    <div className="space-y-4">
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
                  <h4 className="text-sm font-bold text-foreground">Spending Velocity Forecast</h4>
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
                  {currencySymbol}{(forecast.dailyVelocity / 100).toFixed(0)}/day
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Projected EOM</span>
                <span
                  className={`text-xs font-bold ${
                    forecast.projectedSpend > forecast.totalBudget ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {currencySymbol}{(forecast.projectedSpend / 100).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Group Expenses */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-card to-purple-950/20 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              {currencySymbol}{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">Cumulative group expenditure</p>
          </div>
        </div>

        {/* My Personal Spending */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-card to-blue-950/20 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Share</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              {currencySymbol}{mySpending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">Your consumed share</p>
          </div>
        </div>

        {/* I Owe */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-card to-rose-950/20 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">I Owe</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight text-rose-400">
              {currencySymbol}{iOwe.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-rose-400/80 mt-1">Amount you need to pay</p>
          </div>
        </div>

        {/* I'm Owed */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-card to-emerald-950/20 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">I'm Owed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight text-emerald-400">
              {currencySymbol}{imOwed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-400/80 mt-1">Amount to receive from others</p>
          </div>
        </div>
      </div>
    </div>
  );
}

