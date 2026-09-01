export interface BudgetForecast {
  currentSpend: number;
  totalBudget: number;
  dayOfMonth: number;
  daysInMonth: number;
  dailyVelocity: number;
  projectedSpend: number;
  projectedOverrun: number; // positive if over budget
  paceRatio: number; // e.g. 1.15 = 115% of budget projected
  status: "SAFE" | "WARNING" | "EXCEEDED";
  message: string;
}

export function calculateBudgetForecast(
  currentSpend: number,
  totalBudget: number,
  targetDate: Date = new Date()
): BudgetForecast {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  // Total days in target month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = Math.max(1, targetDate.getDate());

  if (totalBudget <= 0) {
    return {
      currentSpend,
      totalBudget: 0,
      dayOfMonth,
      daysInMonth,
      dailyVelocity: 0,
      projectedSpend: currentSpend,
      projectedOverrun: 0,
      paceRatio: 0,
      status: "SAFE",
      message: "No total budget set for this month.",
    };
  }

  const dailyVelocity = currentSpend / dayOfMonth;
  const daysRemaining = daysInMonth - dayOfMonth;
  const projectedSpend = Math.round(currentSpend + dailyVelocity * daysRemaining);
  const paceRatio = projectedSpend / totalBudget;
  const projectedOverrun = Math.max(0, projectedSpend - totalBudget);

  let status: "SAFE" | "WARNING" | "EXCEEDED" = "SAFE";
  let message = "";

  if (currentSpend >= totalBudget) {
    status = "EXCEEDED";
    message = `Budget exceeded! Spent ₹${(currentSpend / 100).toLocaleString("en-IN")} out of ₹${(totalBudget / 100).toLocaleString("en-IN")}.`;
  } else if (projectedSpend > totalBudget) {
    status = "WARNING";
    message = `On track to exceed budget by ₹${(projectedOverrun / 100).toLocaleString("en-IN")} at current daily spend rate (₹${(Math.round(dailyVelocity) / 100).toFixed(0)}/day).`;
  } else if (paceRatio > 0.85) {
    status = "WARNING";
    message = `Pacing close to limit: Projected spend is ${Math.round(paceRatio * 100)}% of monthly budget.`;
  } else {
    status = "SAFE";
    message = `On track! Projected spend is ${Math.round(paceRatio * 100)}% of total monthly budget.`;
  }

  return {
    currentSpend,
    totalBudget,
    dayOfMonth,
    daysInMonth,
    dailyVelocity,
    projectedSpend,
    projectedOverrun,
    paceRatio,
    status,
    message,
  };
}
