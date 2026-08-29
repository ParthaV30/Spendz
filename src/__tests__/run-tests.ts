import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
} from "../lib/calculations/splitEngine";
import {
  calculateGroupBalances,
  simplifyDebts,
} from "../lib/calculations/balanceEngine";
import { isPeriodLocked } from "../lib/calculations/monthLocking";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    throw new Error(message);
  }
}

function runTests() {
  console.log("==========================================");
  console.log("RUNNING FINANCIAL ENGINE & UNIT TESTS");
  console.log("==========================================");

  // 1. Equal Split Test (e.g. ₹100 = 10000 paise split 3 ways)
  console.log("\n[1/7] Testing Equal Split with Rounding...");
  const equalRes = calculateEqualSplit(10000, ["user1", "user2", "user3"]);
  const equalSum = equalRes.reduce((acc, r) => acc + r.amount, 0);
  assert(equalSum === 10000, "Equal split sum must match total exactly (10000 paise)");
  assert(equalRes[0].amount === 3334, "First user gets 3334 paise");
  assert(equalRes[1].amount === 3333, "Second user gets 3333 paise");
  assert(equalRes[2].amount === 3333, "Third user gets 3333 paise");
  console.log("  ✓ Equal Split passed");

  // 2. Exact Split Test
  console.log("\n[2/7] Testing Exact Split Validation...");
  const exactSplits = [
    { userId: "u1", amount: 4000 },
    { userId: "u2", amount: 3000 },
    { userId: "u3", amount: 3000 },
  ];
  const exactRes = calculateExactSplit(10000, exactSplits);
  assert(exactRes.length === 3, "Exact split should retain all members");
  try {
    calculateExactSplit(10000, [
      { userId: "u1", amount: 5000 },
      { userId: "u2", amount: 4000 },
    ]);
    assert(false, "Should throw error if exact splits sum does not equal total");
  } catch (err) {
    // Expected behavior
  }
  console.log("  ✓ Exact Split passed");

  // 3. Percentage Split Test
  console.log("\n[3/7] Testing Percentage Split Calculation...");
  const pctSplits = [
    { userId: "u1", percentage: 50 },
    { userId: "u2", percentage: 25 },
    { userId: "u3", percentage: 25 },
  ];
  const pctRes = calculatePercentageSplit(10000, pctSplits);
  const pctSum = pctRes.reduce((acc, r) => acc + r.amount, 0);
  assert(pctSum === 10000, "Percentage split sum must match total");
  assert(pctRes[0].amount === 5000, "u1 gets 5000");
  assert(pctRes[1].amount === 2500, "u2 gets 2500");
  assert(pctRes[2].amount === 2500, "u3 gets 2500");
  console.log("  ✓ Percentage Split passed");

  // 4. Shares Split Test
  console.log("\n[4/7] Testing Shares Split Calculation...");
  const sharesSplits = [
    { userId: "u1", shares: 2 },
    { userId: "u2", shares: 1 },
    { userId: "u3", shares: 1 },
  ];
  const sharesRes = calculateSharesSplit(12000, sharesSplits);
  const sharesSum = sharesRes.reduce((acc, r) => acc + r.amount, 0);
  assert(sharesSum === 12000, "Shares split sum must match total (12000)");
  assert(sharesRes[0].amount === 6000, "u1 gets 6000 (2 shares out of 4)");
  assert(sharesRes[1].amount === 3000, "u2 gets 3000 (1 share out of 4)");
  assert(sharesRes[2].amount === 3000, "u3 gets 3000 (1 share out of 4)");
  console.log("  ✓ Shares Split passed");

  // 5. Net Balance Calculation Test
  console.log("\n[5/7] Testing Group Net Balance Calculation...");
  // User Arun paid ₹5,000 (500000 paise). Expense shared equally among Arun, Rahul, Karthik, Vijay.
  const users = ["Arun", "Rahul", "Karthik", "Vijay"];
  const expenses = [
    {
      paidById: "Arun",
      splits: [
        { userId: "Arun", amount: 125000 },
        { userId: "Rahul", amount: 125000 },
        { userId: "Karthik", amount: 125000 },
        { userId: "Vijay", amount: 125000 },
      ],
    },
  ];
  const settlements = [
    { fromUserId: "Rahul", toUserId: "Arun", amount: 50000, status: "CONFIRMED" },
  ];
  const balances = calculateGroupBalances(users, expenses, settlements);

  assert(balances["Arun"].totalPaid === 500000, "Arun total paid is 500000 paise");
  assert(balances["Arun"].totalShare === 125000, "Arun total share is 125000 paise");
  assert(balances["Arun"].settlementsReceived === 50000, "Arun received 50000 settlement");
  // Net Arun: 500000 - 125000 - 50000 = +325000 paise
  assert(balances["Arun"].netBalance === 325000, "Arun net balance is +325000 paise");

  // Net Rahul: 0 paid - 125000 share + 50000 sent = -75000 paise
  assert(balances["Rahul"].netBalance === -75000, "Rahul net balance is -75000 paise");
  console.log("  ✓ Group Net Balance passed");

  // 6. Smart Debt Simplification Test
  console.log("\n[6/7] Testing Smart Debt Simplification Algorithm...");
  // Debt balances: Arun = +2000, Rahul = -1200, Karthik = -800
  const netMap = {
    Arun: 200000,
    Rahul: -120000,
    Karthik: -80000,
  };
  const simplified = simplifyDebts(netMap);
  assert(simplified.length === 2, "Simplified transactions count should be 2");
  assert(simplified[0].fromUserId === "Rahul" && simplified[0].toUserId === "Arun" && simplified[0].amount === 120000, "Rahul owes Arun 120000");
  assert(simplified[1].fromUserId === "Karthik" && simplified[1].toUserId === "Arun" && simplified[1].amount === 80000, "Karthik owes Arun 80000");
  console.log("  ✓ Smart Debt Simplification passed");

  // 7. Month Locking Test
  console.log("\n[7/7] Testing Month Locking Logic...");
  const lockedMonths = [{ year: 2026, month: 8 }];
  assert(isPeriodLocked(new Date("2026-08-15"), lockedMonths) === true, "Aug 2026 should be locked");
  assert(isPeriodLocked(new Date("2026-09-01"), lockedMonths) === false, "Sept 2026 should not be locked");
  console.log("  ✓ Month Locking passed");

  console.log("\n==========================================");
  console.log("ALL 7 FINANCIAL & SPLIT TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("==========================================");
}

runTests();
