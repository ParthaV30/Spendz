"use client";

import { useState } from "react";
import { Repeat, Plus, Play, CheckCircle, Power } from "lucide-react";
import { createRecurringExpense, processDueRecurringExpenses, toggleRecurringExpense } from "@/app/actions/recurringActions";

interface RecurringItem {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  nextDueDate: string;
  active: boolean;
  categoryName: string;
  createdByName: string;
}

interface RecurringClientProps {
  groupId: string;
  items: RecurringItem[];
  categories: Array<{ id: string; name: string }>;
}

export default function RecurringClient({ groupId, items, categories }: RecurringClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    await createRecurringExpense(groupId, categoryId, description, numAmount, frequency, nextDueDate);
    setLoading(false);
    setIsOpen(false);
    window.location.reload();
  };

  const handleProcessDue = async () => {
    setLoading(true);
    const res = await processDueRecurringExpenses(groupId);
    setLoading(false);
    if (res.processedCount !== undefined) {
      setMessage(`Processed ${res.processedCount} due recurring expense(s)!`);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await toggleRecurringExpense(groupId, id, !currentActive);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex justify-between items-center bg-card/60 border border-border/60 p-4 rounded-2xl">
        <button
          onClick={handleProcessDue}
          disabled={loading}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Process Due Recurring Items Now</span>
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-purple-500/25"
        >
          <Plus className="h-4 w-4" />
          <span>Add Recurring Schedule</span>
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-12 text-center text-xs text-muted-foreground">
            No recurring expense schedules added yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-2xl border ${
                item.active ? "border-border/60 bg-card/60" : "border-border/30 bg-card/20 opacity-60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <Repeat className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{item.description}</h4>
                  <p className="text-xs text-muted-foreground">
                    Category: <strong className="text-foreground">{item.categoryName}</strong> • Frequency:{" "}
                    <span className="font-semibold text-purple-300">{item.frequency}</span> • Next Due:{" "}
                    {new Date(item.nextDueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-black text-foreground text-base">₹{item.amount.toFixed(2)}</span>
                <button
                  onClick={() => handleToggle(item.id, item.active)}
                  title={item.active ? "Pause Schedule" : "Activate Schedule"}
                  className={`p-2 rounded-xl border ${
                    item.active
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-foreground text-lg">Add Recurring Expense</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Rent, Broadband, Swiggy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="12000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary rounded-xl"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
