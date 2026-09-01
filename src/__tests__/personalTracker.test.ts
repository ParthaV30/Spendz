import { parseReceiptText } from "../lib/ocrScanner";
import { calculateBudgetForecast } from "../lib/budgetForecast";

console.log("==========================================");
console.log("RUNNING PERSONAL TRACKER & OCR FIX TESTS");
console.log("==========================================");

// 1. Test Date Parsing with Indian receipt format (DD/MM/YYYY)
const mockReceiptDDMMYYYY = `
STARBUCKS COFFEE INDIA
Date: 25/08/2026
Total Amount: ₹380.00
`;

const parsed1 = parseReceiptText(mockReceiptDDMMYYYY);
console.log("[1/3] Testing DD/MM/YYYY OCR Date Parsing...");
if (parsed1.date === "2026-08-25") {
  console.log(`  ✓ Correctly parsed DD/MM/YYYY date: ${parsed1.date}`);
} else {
  console.error(`  ✕ Date parsing failed: expected 2026-08-25, got ${parsed1.date}`);
  process.exit(1);
}

if (parsed1.amount === 380) {
  console.log(`  ✓ Correctly parsed receipt amount: ₹${parsed1.amount}`);
} else {
  console.error(`  ✕ Amount parsing failed: expected 380, got ${parsed1.amount}`);
  process.exit(1);
}

// 2. Test Personal Budget Velocity Forecast (Safe)
console.log("\n[2/3] Testing Personal Budget Velocity Forecast (Safe)...");
const fakeDateSafe = new Date(2026, 7, 5); // Aug 5, 2026 (day 5)
const forecastSafe = calculateBudgetForecast(1000 * 100, 10000 * 100, fakeDateSafe);
if (forecastSafe.status === "SAFE") {
  console.log(`  ✓ Forecast safe status verified: pace = ${Math.round(forecastSafe.paceRatio * 100)}%`);
} else {
  console.error(`  ✕ Forecast status error: expected SAFE, got ${forecastSafe.status}`);
  process.exit(1);
}

// 3. Test Personal Budget Velocity Forecast (Exceeded)
console.log("\n[3/3] Testing Personal Budget Velocity Forecast (Exceeded)...");
const forecastExceeded = calculateBudgetForecast(12000 * 100, 10000 * 100, fakeDateSafe);
if (forecastExceeded.status === "EXCEEDED") {
  console.log(`  ✓ Forecast exceeded status verified: overrun = ₹${forecastExceeded.projectedOverrun / 100}`);
} else {
  console.error(`  ✕ Forecast status error: expected EXCEEDED, got ${forecastExceeded.status}`);
  process.exit(1);
}

console.log("\n==========================================");
console.log("ALL PERSONAL TRACKER & OCR TESTS PASSED SUCCESSFULLY! 🎉");
console.log("==========================================");
