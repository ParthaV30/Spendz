"use client";

import { Wallet, ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";

interface MetricsCardsProps {
  totalExpenses: number;   // in main currency ₹
  mySpending: number;      // in main currency ₹
  iOwe: number;            // in main currency ₹
  imOwed: number;          // in main currency ₹
  currencySymbol?: string;
}

export default function MetricsCards({
  totalExpenses,
  mySpending,
  iOwe,
  imOwed,
  currencySymbol = "₹",
}: MetricsCardsProps) {
  return (
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
  );
}
