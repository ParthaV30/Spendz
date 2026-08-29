"use client";

import { ArrowRight, CheckCircle2, Sparkles, Send } from "lucide-react";
import { useState } from "react";
import SettlementModal from "./SettlementModal";

interface Member {
  id: string;
  name: string;
}

interface SimplifiedTransaction {
  fromUserId: string;
  toUserId: string;
  amount: number; // in minor units (paise)
}

interface SmartSettlementsCardProps {
  groupId: string;
  members: Member[];
  transactions: SimplifiedTransaction[];
  currentUserId: string;
}

export default function SmartSettlementsCard({
  groupId,
  members,
  transactions,
  currentUserId,
}: SmartSettlementsCardProps) {
  const [selectedTx, setSelectedTx] = useState<SimplifiedTransaction | null>(null);

  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name || "Group Member";

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h4 className="font-bold text-foreground">Everyone is Settled Up! 🎉</h4>
        <p className="text-xs text-muted-foreground">
          There are no pending debts or simplified balances in this room.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Smart Debt Simplification</h3>
              <p className="text-xs text-muted-foreground">Optimized minimal cashflow settlements</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary">
            {transactions.length} Payment{transactions.length > 1 ? "s" : ""} Needed
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {transactions.map((tx, idx) => {
            const isIFrom = tx.fromUserId === currentUserId;
            const isITo = tx.toUserId === currentUserId;
            const amountRs = (tx.amount / 100).toFixed(2);

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isIFrom
                    ? "border-rose-500/30 bg-rose-950/10"
                    : isITo
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-border/60 bg-secondary/30"
                }`}
              >
                <div className="flex items-center space-x-3 text-sm font-medium">
                  <span className={isIFrom ? "font-bold text-rose-400" : "text-foreground"}>
                    {isIFrom ? "You" : getMemberName(tx.fromUserId)}
                  </span>
                  <div className="flex items-center space-x-1 text-muted-foreground text-xs">
                    <span>owes</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  <span className={isITo ? "font-bold text-emerald-400" : "text-foreground"}>
                    {isITo ? "You" : getMemberName(tx.toUserId)}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-black text-foreground text-base">
                    ₹{Number(amountRs).toLocaleString("en-IN")}
                  </span>
                  {isIFrom && (
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="flex items-center space-x-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow transition-all duration-150"
                    >
                      <Send className="h-3 w-3" />
                      <span>Settle</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTx && (
        <SettlementModal
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          defaultToUserId={selectedTx.toUserId}
          defaultAmount={selectedTx.amount / 100}
          isOpen={true}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </>
  );
}
