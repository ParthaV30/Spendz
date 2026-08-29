export interface SplitResult {
  userId: string;
  amount: number; // in minor units (paise/cents)
  percentage?: number;
  shares?: number;
}

/**
 * Equal Split Calculation
 * Guarantees that sum(split.amount) === totalAmount exactly.
 * Minor unit remainders are distributed 1 paise at a time to members.
 */
export function calculateEqualSplit(
  totalAmount: number,
  userIds: string[]
): SplitResult[] {
  if (userIds.length === 0) {
    throw new Error("At least one member is required for equal split");
  }
  if (totalAmount <= 0) {
    throw new Error("Total amount must be greater than zero");
  }

  const count = userIds.length;
  const baseAmount = Math.floor(totalAmount / count);
  let remainder = totalAmount - baseAmount * count;

  return userIds.map((userId) => {
    let amount = baseAmount;
    if (remainder > 0) {
      amount += 1;
      remainder -= 1;
    }
    return { userId, amount };
  });
}

/**
 * Exact Split Calculation
 * Validates that sum(splits.amount) === totalAmount exactly.
 */
export function calculateExactSplit(
  totalAmount: number,
  splits: { userId: string; amount: number }[]
): SplitResult[] {
  if (splits.length === 0) {
    throw new Error("At least one split is required");
  }
  const sum = splits.reduce((acc, curr) => acc + curr.amount, 0);
  if (sum !== totalAmount) {
    throw new Error(
      `Exact split total (${sum}) does not equal total expense amount (${totalAmount})`
    );
  }
  return splits.map((s) => ({ userId: s.userId, amount: s.amount }));
}

/**
 * Percentage Split Calculation
 * Validates that sum(percentages) === 100.
 * Calculates minor unit amounts and distributes rounding remainders.
 */
export function calculatePercentageSplit(
  totalAmount: number,
  splits: { userId: string; percentage: number }[]
): SplitResult[] {
  if (splits.length === 0) {
    throw new Error("At least one split is required");
  }
  const totalPercentage = splits.reduce((acc, curr) => acc + curr.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.001) {
    throw new Error(
      `Percentage split total (${totalPercentage}%) must equal exactly 100%`
    );
  }

  let allocated = 0;
  const rawResults = splits.map((s) => {
    const amount = Math.floor((totalAmount * s.percentage) / 100);
    allocated += amount;
    return { userId: s.userId, amount, percentage: s.percentage };
  });

  let remainder = totalAmount - allocated;
  // Distribute remainder 1 paise at a time to highest percentage/first members
  const results = rawResults.map((item) => {
    let extra = 0;
    if (remainder > 0) {
      extra = 1;
      remainder -= 1;
    }
    return {
      userId: item.userId,
      amount: item.amount + extra,
      percentage: item.percentage,
    };
  });

  return results;
}

/**
 * Shares Split Calculation
 * Proportionally distributes expense based on member share values.
 */
export function calculateSharesSplit(
  totalAmount: number,
  splits: { userId: string; shares: number }[]
): SplitResult[] {
  if (splits.length === 0) {
    throw new Error("At least one split is required");
  }
  const totalShares = splits.reduce((acc, curr) => acc + curr.shares, 0);
  if (totalShares <= 0) {
    throw new Error("Total shares must be greater than zero");
  }

  let allocated = 0;
  const rawResults = splits.map((s) => {
    const amount = Math.floor((totalAmount * s.shares) / totalShares);
    allocated += amount;
    return { userId: s.userId, amount, shares: s.shares };
  });

  let remainder = totalAmount - allocated;
  return rawResults.map((item) => {
    let extra = 0;
    if (remainder > 0) {
      extra = 1;
      remainder -= 1;
    }
    return {
      userId: item.userId,
      amount: item.amount + extra,
      shares: item.shares,
    };
  });
}
