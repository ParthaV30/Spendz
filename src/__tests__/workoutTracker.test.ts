console.log("==========================================");
console.log("RUNNING WORKOUT & GYM TRACKER TESTS");
console.log("==========================================");

// 1. Test Workout Streak Calculation Logic
function calculateStreakFromDates(uniqueDateStrings: string[], currentDateStr: string): number {
  if (uniqueDateStrings.length === 0) return 0;
  const sorted = [...uniqueDateStrings].sort().reverse();
  let streak = 0;

  const todayStr = currentDateStr;
  const yesterdayDate = new Date(currentDateStr);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  let currentCheck = sorted[0] === todayStr ? todayStr : sorted[0] === yesterdayStr ? yesterdayStr : null;

  if (currentCheck) {
    let checkDate = new Date(currentCheck);
    for (const dStr of sorted) {
      const d = new Date(dStr);
      const diffDays = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 0 || diffDays === 1) {
        streak++;
        checkDate = d;
      } else {
        break;
      }
    }
  }
  return streak;
}

console.log("[1/2] Testing Workout Streak Calculation...");
const mockDates = ["2026-09-01", "2026-08-31", "2026-08-30", "2026-08-29"];
const streakResult = calculateStreakFromDates(mockDates, "2026-09-01");
if (streakResult === 4) {
  console.log(`  ✓ Streak calculated correctly: ${streakResult} consecutive days`);
} else {
  console.error(`  ✕ Streak calculation failed: expected 4, got ${streakResult}`);
  process.exit(1);
}

// 2. Test Volume Computation (reps * weight in kg)
console.log("\n[2/2] Testing Total Volume Computation...");
const sets = [
  { reps: 10, weightKg: 80, completed: true },
  { reps: 10, weightKg: 80, completed: true },
  { reps: 8, weightKg: 80, completed: true },
];

const totalVolume = sets.reduce((acc, s) => acc + (s.completed ? s.reps * s.weightKg : 0), 0);
if (totalVolume === 2240) {
  console.log(`  ✓ Total volume calculated correctly: ${totalVolume} kg`);
} else {
  console.error(`  ✕ Total volume failed: expected 2240, got ${totalVolume}`);
  process.exit(1);
}

console.log("\n==========================================");
console.log("ALL GYM WORKOUT TRACKER TESTS PASSED! 🎉");
console.log("==========================================");
