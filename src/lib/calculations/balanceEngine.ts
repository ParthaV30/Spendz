export interface MemberExpenseData {
  userId: string;
  amountPaid: number;   // Total paid by user for expenses
  amountShared: number; // Total expense share consumed by user
}

export interface SettlementData {
  fromUserId: string;
  toUserId: string;
  amount: number;       // Confirmed settlement amount
}

export interface MemberBalance {
  userId: string;
  totalPaid: number;
  totalShare: number;
  settlementsSent: number;
  settlementsReceived: number;
  netBalance: number; // positive = owed money, negative = owes money
}

export interface SimplifiedTransaction {
  fromUserId: string;
  toUserId: string;
  amount: number; // minor units
}

/**
 * Calculates net balances for all group members.
 */
export function calculateGroupBalances(
  userIds: string[],
  expenses: { paidById: string; splits: { userId: string; amount: number }[] }[],
  settlements: { fromUserId: string; toUserId: string; amount: number; status: string }[]
): Record<string, MemberBalance> {
  const balances: Record<string, MemberBalance> = {};

  // Initialize for all group members
  userIds.forEach((id) => {
    balances[id] = {
      userId: id,
      totalPaid: 0,
      totalShare: 0,
      settlementsSent: 0,
      settlementsReceived: 0,
      netBalance: 0,
    };
  });

  // Calculate expenses paid and shares consumed
  expenses.forEach((expense) => {
    if (balances[expense.paidById]) {
      const totalExpenseCost = expense.splits.reduce((acc, s) => acc + s.amount, 0);
      balances[expense.paidById].totalPaid += totalExpenseCost;
    }
    expense.splits.forEach((split) => {
      if (balances[split.userId]) {
        balances[split.userId].totalShare += split.amount;
      }
    });
  });

  // Calculate confirmed settlements
  settlements.forEach((settlement) => {
    if (settlement.status === "CONFIRMED") {
      if (balances[settlement.fromUserId]) {
        balances[settlement.fromUserId].settlementsSent += settlement.amount;
      }
      if (balances[settlement.toUserId]) {
        balances[settlement.toUserId].settlementsReceived += settlement.amount;
      }
    }
  });

  // Calculate net balance:
  // Net = (totalPaid - totalShare) + settlementsSent - settlementsReceived
  Object.values(balances).forEach((member) => {
    member.netBalance =
      member.totalPaid -
      member.totalShare +
      member.settlementsSent -
      member.settlementsReceived;
  });

  return balances;
}

/**
 * Smart Debt Simplification Algorithm (Min-Cash-Flow Greedy Solver)
 * Minimizes unnecessary transactions across group members.
 */
export function simplifyDebts(
  memberBalances: Record<string, number>
): SimplifiedTransaction[] {
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  Object.entries(memberBalances).forEach(([userId, net]) => {
    if (net < 0) {
      debtors.push({ userId, amount: Math.abs(net) });
    } else if (net > 0) {
      creditors.push({ userId, amount: net });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedTransaction[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settleAmount,
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
    }

    if (debtor.amount === 0) {
      dIdx++;
    }
    if (creditor.amount === 0) {
      cIdx++;
    }
  }

  return transactions;
}
