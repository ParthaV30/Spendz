"use client";

import { useState } from "react";
import { Search, Filter, Trash2, ExternalLink, Lock, Eye, AlertCircle } from "lucide-react";
import { deleteExpense } from "@/app/actions/expenseActions";
import { isPeriodLocked } from "@/lib/calculations/monthLocking";

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  paidBy: { id: string; name: string };
  category: { id: string; name: string; icon: string };
  splitMethod: string;
  receiptUrl?: string | null;
  notes?: string | null;
  splits: Array<{
    userId: string;
    userName: string;
    amount: number;
    percentage?: number | null;
    shares?: number | null;
  }>;
}

interface ExpensesClientProps {
  groupId: string;
  currentUserId: string;
  userRole: string;
  expenses: ExpenseItem[];
  members: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; icon: string }>;
  lockedMonths: Array<{ year: number; month: number }>;
}

export default function ExpensesClient({
  groupId,
  currentUserId,
  userRole,
  expenses,
  members,
  categories,
  lockedMonths,
}: ExpensesClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMember, setSelectedMember] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [inspectExpense, setInspectExpense] = useState<ExpenseItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Client-side filtering
  const filtered = expenses
    .filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === "ALL" || e.category.id === selectedCategory;
      const matchMem = selectedMember === "ALL" || e.paidBy.id === selectedMember;
      return matchSearch && matchCat && matchMem;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
      if (sortBy === "highest") return b.amount - a.amount;
      if (sortBy === "lowest") return a.amount - b.amount;
      return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
    });

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    setError(null);
    setLoadingId(expenseId);

    const res = await deleteExpense(groupId, expenseId);
    setLoadingId(null);

    if (res.error) {
      setError(res.error);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card/60 border border-border/60 p-4 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Paid By</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest">Sort: Highest Amount</option>
            <option value="lowest">Sort: Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Expenses Table / Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-12 text-center space-y-2">
          <p className="font-bold text-foreground">No expenses found</p>
          <p className="text-xs text-muted-foreground">Try clearing search filters or add a new expense.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => {
            const isLocked = isPeriodLocked(exp.expenseDate, lockedMonths);
            const canDelete = (userRole === "ADMIN" || exp.paidBy.id === currentUserId) && !isLocked;

            return (
              <div
                key={exp.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/60 bg-card/60 hover:border-purple-500/40 transition-all gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 font-bold text-xs shrink-0">
                    {exp.category.name.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-foreground text-sm">{exp.description}</h3>
                      {isLocked && (
                        <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          <Lock className="h-3 w-3" />
                          <span>LOCKED</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Paid by <strong className="text-foreground">{exp.paidBy.name}</strong> •{" "}
                      {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      • Method: <span className="font-semibold text-purple-300">{exp.splitMethod}</span>
                    </p>
                    {exp.notes && <p className="text-xs text-muted-foreground/80 italic mt-1">{exp.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <span className="font-black text-foreground text-lg">
                    ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setInspectExpense(exp)}
                      title="Inspect Splits"
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {exp.receiptUrl && (
                      <a
                        href={exp.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="View Receipt"
                        className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(exp.id)}
                        disabled={loadingId === exp.id}
                        title="Delete Expense"
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Splits Modal */}
      {inspectExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-foreground">{inspectExpense.description}</h3>
                <p className="text-xs text-muted-foreground">Total ₹{inspectExpense.amount.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setInspectExpense(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Member Splits ({inspectExpense.splitMethod})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {inspectExpense.splits.map((s) => (
                  <div key={s.userId} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-secondary/30 text-xs">
                    <span className="font-semibold text-foreground">{s.userName}</span>
                    <div className="text-right font-bold text-purple-300">
                      <span>₹{s.amount.toFixed(2)}</span>
                      {s.percentage && <span className="text-[10px] text-muted-foreground block">({s.percentage}%)</span>}
                      {s.shares && <span className="text-[10px] text-muted-foreground block">({s.shares} shares)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
