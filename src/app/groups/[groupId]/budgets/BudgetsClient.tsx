"use client";

import { useState } from "react";
import { Target, Plus, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { upsertBudget, deleteBudget } from "@/app/actions/budgetActions";

interface BudgetViewItem {
  categoryId: string;
  categoryName: string;
  budgetId: string | null;
  limitRs: number;
  spentRs: number;
  remainingRs: number;
  pct: number;
}

interface BudgetsClientProps {
  groupId: string;
  userRole: string;
  budgets: BudgetViewItem[];
  categories: Array<{ id: string; name: string }>;
  month: number;
  year: number;
}

export default function BudgetsClient({
  groupId,
  userRole,
  budgets,
  categories,
  month,
  year,
}: BudgetsClientProps) {
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole === "ADMIN";

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid budget amount");
      return;
    }

    setLoading(true);
    const res = await upsertBudget(groupId, selectedCatId, month, year, numAmount);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setEditingModalOpen(false);
      window.location.reload();
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Are you sure you want to remove this category budget?")) return;
    await deleteBudget(groupId, budgetId);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setEditingModalOpen(true)}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-purple-500/25"
          >
            <Plus className="h-4 w-4" />
            <span>Set / Edit Category Budget</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((b) => {
          const isWarning = b.pct >= 80 && b.pct < 100;
          const isExceeded = b.pct >= 100;

          return (
            <div
              key={b.categoryId}
              className={`rounded-2xl border p-5 shadow-xl space-y-4 transition-all ${
                isExceeded
                  ? "border-rose-500/50 bg-rose-950/10"
                  : isWarning
                  ? "border-amber-500/50 bg-amber-950/10"
                  : "border-border/60 bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{b.categoryName}</h3>
                </div>

                {b.budgetId && isAdmin && (
                  <button
                    onClick={() => handleDelete(b.budgetId!)}
                    className="p-1 rounded text-muted-foreground hover:text-rose-400"
                    title="Remove Budget"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {b.limitRs === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">No budget cap defined</p>
                  <p className="text-sm font-bold text-foreground mt-1">₹{b.spentRs.toFixed(2)} spent</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Spent</span>
                      <p className="text-lg font-black text-foreground">₹{b.spentRs.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Limit</span>
                      <p className="text-sm font-bold text-muted-foreground">₹{b.limitRs.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className={isExceeded ? "text-rose-400 font-bold" : isWarning ? "text-amber-400" : "text-emerald-400"}>
                        {b.pct}% used
                      </span>
                      <span className="text-muted-foreground">Remaining: ₹{b.remainingRs.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Alert Tag */}
                  {isExceeded && (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 pt-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Category Budget Exceeded!</span>
                    </div>
                  )}
                  {isWarning && (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 pt-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Budget Limit Nearing (&gt;80%)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Set Budget Modal */}
      {editingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-foreground text-lg">Define Category Budget</h3>
            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
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
                  placeholder="15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary rounded-xl"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
