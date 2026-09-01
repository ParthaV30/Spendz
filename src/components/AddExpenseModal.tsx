"use client";

import { useState } from "react";
import { X, Upload, Check, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { createExpense } from "@/app/actions/expenseActions";
import { processReceiptImage, parseReceiptText } from "@/lib/ocrScanner";

interface Member {
  id: string;
  name: string;
  avatar?: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface AddExpenseModalProps {
  groupId: string;
  members: Member[];
  categories: Category[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({
  groupId,
  members,
  categories,
  currentUserId,
  isOpen,
  onClose,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(currentUserId);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [splitMethod, setSplitMethod] = useState<"EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES">("EQUAL");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);

  // Split state per user
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(members.map((m) => m.id));

  const handleReceiptScan = async (file: File) => {
    if (!file) return;
    setOcrScanning(true);
    setOcrMessage("Scanning receipt using AI OCR...");
    setError(null);

    try {
      // Create local preview object URL
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
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentageShares, setPercentageShares] = useState<Record<string, string>>({});
  const [sharesCounts, setSharesCounts] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) return; // Must have at least 1
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
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

    // Build splits array
    let splits: any[] = [];
    if (splitMethod === "EQUAL") {
      splits = selectedUserIds.map((userId) => ({ userId }));
    } else if (splitMethod === "EXACT") {
      splits = selectedUserIds.map((userId) => ({
        userId,
        amount: parseFloat(exactAmounts[userId] || "0"),
      }));
    } else if (splitMethod === "PERCENTAGE") {
      splits = selectedUserIds.map((userId) => ({
        userId,
        percentage: parseFloat(percentageShares[userId] || "0"),
      }));
    } else if (splitMethod === "SHARES") {
      splits = selectedUserIds.map((userId) => ({
        userId,
        shares: parseInt(sharesCounts[userId] || "1", 10),
      }));
    }

    setLoading(true);
    const res = await createExpense({
      groupId,
      paidById,
      categoryId,
      amount: numAmount,
      description,
      expenseDate,
      splitMethod,
      notes,
      receiptUrl,
      splits,
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
          <h2 className="text-lg font-bold text-foreground">Add New Shared Expense</h2>
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
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-secondary/40 p-4 transition-all hover:border-purple-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                {ocrScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Smart AI Receipt Scanner
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    OCR
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Upload a photo of your receipt to auto-extract amount, date & vendor details
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
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-all">
                <Upload className="h-3.5 w-3.5" />
                <span>{ocrScanning ? "Scanning..." : "Scan Receipt"}</span>
              </span>
            </label>
          </div>

          {ocrMessage && (
            <div className="mt-3 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-300 flex items-center space-x-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-purple-400" />
              <span>{ocrMessage}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Total Amount (₹)</label>
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
                placeholder="Groceries, Rent, Dinner..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Paid By & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Paid By</label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          {/* Expense Date & Receipt Mock URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Receipt URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Split Method Tabs */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Split Method</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-secondary/60 rounded-xl border border-border text-xs font-semibold">
              {(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"] as const).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setSplitMethod(method)}
                  className={`py-1.5 rounded-lg transition-colors ${
                    splitMethod === method ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Members Involved */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-muted-foreground">Members Involved</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members.map((m) => {
                const isSelected = selectedUserIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected ? "border-primary/50 bg-primary/10" : "border-border/60 bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUser(m.id)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">{m.name}</span>
                    </div>

                    {isSelected && (
                      <div className="w-28 text-right">
                        {splitMethod === "EQUAL" && (
                          <span className="text-xs font-bold text-muted-foreground">Equal Share</span>
                        )}
                        {splitMethod === "EXACT" && (
                          <input
                            type="number"
                            placeholder="₹ Exact"
                            value={exactAmounts[m.id] || ""}
                            onChange={(e) => setExactAmounts({ ...exactAmounts, [m.id]: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        )}
                        {splitMethod === "PERCENTAGE" && (
                          <input
                            type="number"
                            placeholder="% Pct"
                            value={percentageShares[m.id] || ""}
                            onChange={(e) => setPercentageShares({ ...percentageShares, [m.id]: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        )}
                        {splitMethod === "SHARES" && (
                          <input
                            type="number"
                            placeholder="Shares (1)"
                            value={sharesCounts[m.id] || "1"}
                            onChange={(e) => setSharesCounts({ ...sharesCounts, [m.id]: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
