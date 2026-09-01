import { createWorker } from "tesseract.js";

export interface ParsedReceiptData {
  amount?: number;
  date?: string; // YYYY-MM-DD
  description?: string;
  suggestedCategoryKeyword?: string;
  rawText: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["restaurant", "cafe", "food", "pizza", "burger", "coffee", "baking", "kitchen", "diner", "bar", "swiggy", "zomato", "starbucks", "mcdonald"],
  Groceries: ["supermarket", "groceries", "mart", "store", "baking", "milk", "vegetable", "fruit", "zepto", "blinkit", "instamart", "walmart"],
  Travel: ["uber", "ola", "cab", "flight", "airline", "train", "metro", "irctc", "fuel", "petrol", "diesel", "shell", "hp", "ticket"],
  Utilities: ["electricity", "water", "gas", "broadband", "wifi", "airtel", "jio", "bill", "recharge", "utility"],
  Entertainment: ["cinema", "movie", "pvr", "inox", "netflix", "spotify", "game", "bowling", "event", "show"],
  Healthcare: ["pharmacy", "medical", "hospital", "doctor", "clinic", "chemist", "apollo", "1mg"],
  Shopping: ["apparel", "clothing", "zara", "h&m", "amazon", "flipkart", "myntra", "shoes", "fashion", "mall"],
};

export async function processReceiptImage(
  imageSource: File | Blob | string
): Promise<ParsedReceiptData> {
  let rawText = "";

  try {
    const worker = await createWorker("eng");
    const res = await worker.recognize(imageSource);
    rawText = res.data.text || "";
    await worker.terminate();
  } catch (err) {
    console.error("Tesseract OCR error:", err);
  }

  return parseReceiptText(rawText);
}

export function parseReceiptText(rawText: string): ParsedReceiptData {
  if (!rawText.trim()) {
    return { rawText: "" };
  }

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Extract Description (Usually the first prominent header line)
  let description: string | undefined;
  const skipWords = ["tax", "invoice", "receipt", "bill", "welcome", "copy", "customer", "date", "cashier", "order"];
  for (const line of lines.slice(0, 5)) {
    const lower = line.toLowerCase();
    if (!skipWords.some((w) => lower.includes(w)) && line.length >= 3 && /[a-zA-Z]/.test(line)) {
      description = line;
      break;
    }
  }
  if (!description && lines.length > 0) {
    description = lines[0];
  }

  // 2. Extract Amount (Iterate bottom-to-top as grand totals appear near the bottom)
  let amount: number | undefined;
  const amountRegexes = [
    /(?:grand\s*total|total\s*amount|net\s*amount|total|paid|amount\s*due|bal(?:ance)?)\s*[:=]?\s*(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:₹|\$|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/i,
  ];

  const reversedLines = [...lines].reverse();

  for (const regex of amountRegexes) {
    for (const line of reversedLines) {
      // Ignore subtotal lines if looking for final total
      if (line.toLowerCase().includes("subtotal")) continue;

      const match = line.match(regex);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed;
          break;
        }
      }
    }
    if (amount) break;
  }

  // Fallback: largest decimal number under 500,000
  if (!amount) {
    const allNumbers: number[] = [];
    const numberRegex = /(?:\b)(\d+\.\d{2})(?:\b)/g;
    let match;
    while ((match = numberRegex.exec(rawText)) !== null) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val < 500000) {
        allNumbers.push(val);
      }
    }
    if (allNumbers.length > 0) {
      amount = Math.max(...allNumbers);
    }
  }

  // 3. Extract Date
  let date: string | undefined;
  
  // YYYY-MM-DD match
  const ymdMatch = rawText.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const dt = new Date(Date.UTC(y, m, d));
    if (!isNaN(dt.getTime())) {
      date = dt.toISOString().split("T")[0];
    }
  }

  // DD/MM/YYYY or MM/DD/YYYY match
  if (!date) {
    const dmyMatch = rawText.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      let p1 = parseInt(dmyMatch[1], 10);
      let p2 = parseInt(dmyMatch[2], 10);
      const y = parseInt(dmyMatch[3], 10);

      // If p1 > 12, it's definitely DD/MM/YYYY
      let day = p1;
      let month = p2;
      if (p1 <= 12 && p2 <= 12) {
        // Default to DD/MM/YYYY for Indian/UK receipt context unless impossible
        day = p1;
        month = p2;
      } else if (p1 > 12) {
        day = p1;
        month = p2;
      } else if (p2 > 12) {
        day = p2;
        month = p1;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const dt = new Date(Date.UTC(y, month - 1, day));
        if (!isNaN(dt.getTime())) {
          date = dt.toISOString().split("T")[0];
        }
      }
    }
  }

  // Named Month date match e.g. 15 Aug 2026 or Aug 15, 2026
  if (!date) {
    const textMonthMatch = rawText.match(/(\d{1,2})?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{1,2})?,?\s*(\d{4})/i);
    if (textMonthMatch) {
      try {
        const parsedDate = new Date(textMonthMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split("T")[0];
        }
      } catch {}
    }
  }

  // 4. Match Category Keyword
  let suggestedCategoryKeyword: string | undefined;
  const lowerText = rawText.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      suggestedCategoryKeyword = cat;
      break;
    }
  }

  return {
    amount,
    date,
    description,
    suggestedCategoryKeyword,
    rawText,
  };
}
