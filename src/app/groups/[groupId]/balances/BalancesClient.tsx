"use client";

import { useState } from "react";
import { Scale, Send, History, CheckCircle, Clock, XCircle } from "lucide-react";
import SettlementModal from "@/components/SettlementModal";

interface MemberBalanceItem {
  id: string;
  name: string;
  avatar?: string | null;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
}

interface SettlementLogItem {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  note?: string | null;
  settledAt: string;
}

interface BalancesClientProps {
  groupId: string;
  currentUserId: string;
  members: MemberBalanceItem[];
  settlements: SettlementLogItem[];
}

export default function BalancesClient({
  groupId,
  currentUserId,
  members,
  settlements,
}: BalancesClientProps) {
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Member Balances Table */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Individual Member Balances</h3>
          </div>

          <button
            onClick={() => setIsSettlementOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/25"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Record Payment</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold text-[10px]">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Share Consumed</th>
                <th className="py-3 px-4 text-right">Net Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 font-medium">
              {members.map((m) => {
                const isPositive = m.netBalance >= 0;
                const isMe = m.id === currentUserId;

                return (
                  <tr key={m.id} className={isMe ? "bg-primary/10" : "hover:bg-secondary/30"}>
                    <td className="py-3 px-4 flex items-center space-x-3">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="h-7 w-7 rounded-full border border-purple-500/30" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px]">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-bold text-foreground">
                        {m.name} {isMe && "(You)"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      ₹{m.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      ₹{m.totalShare.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-sm">
                      <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                        {isPositive ? `+₹${m.netBalance.toFixed(2)}` : `-₹${Math.abs(m.netBalance).toFixed(2)}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement History */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <History className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-foreground text-base">Settlement History</h3>
        </div>

        {settlements.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No settlement payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/20"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {s.fromUserName} settled ₹{s.amount.toFixed(2)} with {s.toUserName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Via <strong className="text-foreground">{s.paymentMethod}</strong> •{" "}
                      {new Date(s.settledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {s.note && ` • "${s.note}"`}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isSettlementOpen && (
        <SettlementModal
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={() => setIsSettlementOpen(false)}
        />
      )}
    </div>
  );
}
