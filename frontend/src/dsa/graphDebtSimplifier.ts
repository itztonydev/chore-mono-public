/**
 * Debt Simplification Engine: Min-Cash-Flow Greedy Directed Graph Algorithm.
 * Matches Python implementation in backend/dsa_engines/graph_debt_simplifier.py
 */

export interface SplitItem {
  userId: string;
  splitAmount: number;
}

export interface ExpenseRecord {
  id: string;
  payerId: string;
  amount: number;
  description: string;
  splits: SplitItem[];
  createdAt: string;
}

export interface TransactionVector {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface SimplificationResult {
  netBalances: Record<string, number>;
  simplifiedTransactions: TransactionVector[];
  originalEdgesCount: number;
  simplifiedEdgesCount: number;
  transactionsEliminated: number;
  efficiencyGainPercent: number;
}

export class DebtSimplificationEngineTS {
  static readonly EPSILON = 0.005;

  static computeNetBalances(
    expenses: ExpenseRecord[],
    memberIds: string[] = []
  ): Record<string, number> {
    const balances: Record<string, number> = {};

    for (const id of memberIds) {
      balances[id] = 0;
    }

    for (const exp of expenses) {
      balances[exp.payerId] = (balances[exp.payerId] || 0) + exp.amount;
      for (const split of exp.splits) {
        balances[split.userId] = (balances[split.userId] || 0) - split.splitAmount;
      }
    }

    // Round each balance to 2 decimals
    const rounded: Record<string, number> = {};
    for (const [uid, bal] of Object.entries(balances)) {
      rounded[uid] = Math.round(bal * 100) / 100;
    }
    return rounded;
  }

  static simplifyDebts(
    expenses: ExpenseRecord[],
    memberIds: string[] = []
  ): SimplificationResult {
    const netBalances = this.computeNetBalances(expenses, memberIds);

    // Count original pairwise debt edges
    let originalEdgesCount = 0;
    for (const exp of expenses) {
      for (const s of exp.splits) {
        if (s.userId !== exp.payerId && s.splitAmount > 0) {
          originalEdgesCount++;
        }
      }
    }

    // Partition into Creditors (> 0) and Debtors (< 0)
    const creditors: { userId: string; amount: number }[] = [];
    const debtors: { userId: string; amount: number }[] = [];

    for (const [uid, bal] of Object.entries(netBalances)) {
      if (bal > this.EPSILON) {
        creditors.push({ userId: uid, amount: bal });
      } else if (bal < -this.EPSILON) {
        debtors.push({ userId: uid, amount: -bal }); // store as positive
      }
    }

    const simplifiedTransactions: TransactionVector[] = [];

    while (creditors.length > 0 && debtors.length > 0) {
      // Sort descending by amount
      creditors.sort((a, b) => b.amount - a.amount);
      debtors.sort((a, b) => b.amount - a.amount);

      const c = creditors.shift()!;
      const d = debtors.shift()!;

      const settle = Math.min(c.amount, d.amount);

      if (settle > this.EPSILON) {
        simplifiedTransactions.push({
          fromUserId: d.userId,
          toUserId: c.userId,
          amount: Math.round(settle * 100) / 100,
        });
      }

      const remC = Math.round((c.amount - settle) * 100) / 100;
      const remD = Math.round((d.amount - settle) * 100) / 100;

      if (remC > this.EPSILON) {
        creditors.push({ userId: c.userId, amount: remC });
      }
      if (remD > this.EPSILON) {
        debtors.push({ userId: d.userId, amount: remD });
      }
    }

    const simplifiedCount = simplifiedTransactions.length;
    const eliminated = Math.max(0, originalEdgesCount - simplifiedCount);
    const efficiency = originalEdgesCount > 0 ? (eliminated / originalEdgesCount) * 100 : 0;

    return {
      netBalances,
      simplifiedTransactions,
      originalEdgesCount,
      simplifiedEdgesCount: simplifiedCount,
      transactionsEliminated: eliminated,
      efficiencyGainPercent: Math.round(efficiency * 10) / 10,
    };
  }
}
