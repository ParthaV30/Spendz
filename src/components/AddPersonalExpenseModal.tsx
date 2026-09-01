"use client";

import { useState } from "react";
import { X, Upload, Check, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { createPersonalExpense } from "@/app/actions/personalActions";
import { processReceiptImage } from "@/lib/ocrScanner";

interface PersonalCategory {
  id: string;
  name: string;
  icon: string;
}

interface AddPersonalExpenseModalProps {
  categories: PersonalCategory[];
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPersonalExpenseModal({
  categories,
  isOpen,
  onClose,
}: AddPersonalExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReceiptScan = async (file: File) => {
    if (!file) return;
    setOcrScanning(true);
    setOcrMessage("Scanning receipt using AI OCR...");
    setError(null);

    try {
      const objectUrl = URL.createObjectURL(file);
      setReceiptUrl(objectUrl);

      const parsed = await processReceiptImage(file);

      let autofilledCount = 0;
      if (parsed.amount) {
        setAmount(parsed.amount.toString());
        autofilledCount++;
      }
      if (parsed.description) {
        setDescription(parsed.description);
        autofilledCount++;
      }
      if (parsed.date) {
        setExpenseDate(parsed.date);
        autofilledCount++;
      }
      if (parsed.suggestedCategoryKeyword) {
        const matched = categories.find((c) =>
          c.name.toLowerCase().includes(parsed.suggestedCategoryKeyword!.toLowerCase())
        );
        if (matched) {
          setCategoryId(matched.id);
          autofilledCount++;
        }
      }

      setOcrMessage(
        autofilledCount > 0
          ? `✨ Successfully scanned! Auto-filled ${autofilledCount} field(s).`
          : "Receipt scanned, but couldn't auto-detect fields clearly. Please check fields manually."
      );
    } catch (err) {
      console.error(err);
      setError("Failed to process receipt image. Please enter details manually.");
    } finally {
      setOcrScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid expense amount");
      return;
    }
    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    setLoading(true);
    const res = await createPersonalExpense({
      categoryId,
      amount: numAmount,
      description,
      expenseDate,
      notes,
      receiptUrl,
    });

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-xs">PERSONAL</div>
            <h2 className="text-lg font-bold text-foreground">Add Personal Expense</h2>
          </div>
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

        {/* AI Receipt Scanner Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-secondary/40 p-4 transition-all hover:border-blue-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {ocrScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  AI Personal Receipt Scanner
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    OCR
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Scan receipt to auto-populate date, amount & merchant info
                </p>
              </div>
            </div>

            <label className="cursor-pointer shrink-0 ml-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReceiptScan(file);
                }}
                className="hidden"
                disabled={ocrScanning}
              />
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all">
                <Upload className="h-3.5 w-3.5" />
                <span>{ocrScanning ? "Scanning..." : "Scan Receipt"}</span>
              </span>
            </label>
          </div>

          {ocrMessage && (
            <div className="mt-3 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 flex items-center space-x-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              <span>{ocrMessage}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
              <input
                type="text"
                placeholder="Coffee, Shoes, Uber..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Personal purchase note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Personal Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
