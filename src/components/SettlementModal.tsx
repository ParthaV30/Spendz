"use client";

import { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { createSettlement } from "@/app/actions/settlementActions";

interface Member {
  id: string;
  name: string;
}

interface SettlementModalProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
  defaultToUserId?: string;
  defaultAmount?: number; // In main currency (₹)
  isOpen: boolean;
  onClose: () => void;
}

export default function SettlementModal({
  groupId,
  members,
  currentUserId,
  defaultToUserId,
  defaultAmount,
  isOpen,
  onClose,
}: SettlementModalProps) {
  const [toUserId, setToUserId] = useState(defaultToUserId || members.find((m) => m.id !== currentUserId)?.id || "");
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : "");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "OTHER">("UPI");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (!toUserId) {
      setError("Please select recipient member");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid settlement amount");
      return;
    }

    setLoading(true);
    const res = await createSettlement(groupId, toUserId, numAmount, paymentMethod, note);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onClose();
      window.location.reload();
    }
  };

  const recipientOptions = members.filter((m) => m.id !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-lg font-bold text-foreground">Record Settlement Payment</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Pay To</label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {recipientOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-secondary/60 rounded-xl border border-border text-xs font-semibold">
              {(["UPI", "CASH", "BANK_TRANSFER", "OTHER"] as const).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 rounded-lg transition-colors ${
                    paymentMethod === method ? "bg-emerald-600 text-white shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {method === "BANK_TRANSFER" ? "Bank" : method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Note (Optional)</label>
            <input
              type="text"
              placeholder="UPI Reference ID, GPay note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="pt-4 border-t border-border/40 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? "Recording..." : "Record Payment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
