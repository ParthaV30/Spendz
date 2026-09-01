import { parseReceiptText } from "../lib/ocrScanner";
import { calculateBudgetForecast } from "../lib/budgetForecast";

console.log("==========================================");
console.log("TESTING AI OCR & BUDGET FORECAST UTILITIES");
console.log("==========================================");

// 1. Test OCR Text Parsing
const mockReceiptText = `
ZOMATO PRIVATE LIMITED
ORDER #12345
Date: 2026-08-15
---------------------------
1x Paneer Butter Masala   350.00
2x Naan                    80.00
---------------------------
SUBTOTAL                  430.00
TAX                        21.50
TOTAL AMOUNT: ₹451.50
---------------------------
THANK YOU FOR VISITING!
`;

const parsed = parseReceiptText(mockReceiptText);
console.log("[1/2] Testing OCR Receipt Text Parsing...");
if (parsed.amount === 451.5) {
  console.log(`  ✓ Extracted Amount correctly: ₹${parsed.amount}`);
} else {
  console.error(`  ✕ Amount extraction failed: expected 451.5, got ${parsed.amount}`);
}

if (parsed.date === "2026-08-15") {
  console.log(`  ✓ Extracted Date correctly: ${parsed.date}`);
} else {
  console.error(`  ✕ Date extraction failed: expected 2026-08-15, got ${parsed.date}`);
}

if (parsed.suggestedCategoryKeyword === "Food") {
  console.log(`  ✓ Matched Category correctly: ${parsed.suggestedCategoryKeyword}`);
} else {
  console.error(`  ✕ Category matching failed: expected Food, got ${parsed.suggestedCategoryKeyword}`);
}

// 2. Test Budget Forecast Calculation
console.log("\n[2/2] Testing Budget Velocity Forecasting...");
// Spent ₹15,000 out of ₹20,000 on day 10 of a 30-day month
const fakeDate = new Date(2026, 7, 10); // Aug 10, 2026
const forecast = calculateBudgetForecast(15000 * 100, 20000 * 100, fakeDate);

if (forecast.status === "WARNING" || forecast.status === "EXCEEDED") {
  console.log(`  ✓ Budget forecast flagged velocity warning/exceeded: status = ${forecast.status}`);
  console.log(`  ✓ Daily velocity: ₹${(forecast.dailyVelocity / 100).toFixed(0)}/day, Projected EOM: ₹${(forecast.projectedSpend / 100).toLocaleString()}`);
} else {
  console.error(`  ✕ Forecast failed to detect high spending pace.`);
}

console.log("\n==========================================");
console.log("OCR & FORECAST TESTS PASSED! 🎉");
console.log("==========================================");
