import React, { useState } from 'react';
import { Plus, ArrowRight, DollarSign, GitFork, ArrowUpRight, ArrowDownLeft, Check, Sparkles, TrendingDown, Scale } from 'lucide-react';
import { UserData } from '../data/mockInitialData';
import { ExpenseRecord, DebtSimplificationEngineTS } from '../dsa/graphDebtSimplifier';
import { getInvalidExpenseAlert } from '../dsa/sarcasticAlerts';

interface ExpenseLedgerViewProps {
  roommates: UserData[];
  expenses: ExpenseRecord[];
  onAddExpense: (payerId: string, amount: number, description: string, splits: { userId: string; splitAmount: number }[]) => void;
  onTriggerAlert: (msg: string) => void;
}

export const ExpenseLedgerView: React.FC<ExpenseLedgerViewProps> = ({
  roommates,
  expenses,
  onAddExpense,
  onTriggerAlert,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [payerId, setPayerId] = useState<string>(roommates[0]?.id || '');
  const [amount, setAmount] = useState<string>('60.00');
  const [description, setDescription] = useState<string>('Groceries & Snacks');
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

  const memberIds = roommates.map((r) => r.id);
  const simplification = DebtSimplificationEngineTS.simplifyDebts(expenses, memberIds);
  const netBalances = simplification.netBalances;

  // Calculate total household spend
  const totalSpend = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      onTriggerAlert(getInvalidExpenseAlert(0, 'Zero or negative transaction'));
      return;
    }

    let finalSplits: { userId: string; splitAmount: number }[] = [];

    if (splitType === 'EQUAL') {
      const splitEach = Math.round((numAmount / roommates.length) * 100) / 100;
      finalSplits = roommates.map((r) => ({
        userId: r.id,
        splitAmount: splitEach,
      }));
    } else {
      finalSplits = Object.entries(customSplits).map(([uid, amt]) => ({
        userId: uid,
        splitAmount: amt,
      }));
      const totalCustom = finalSplits.reduce((acc, s) => acc + s.splitAmount, 0);
      if (Math.abs(totalCustom - numAmount) > 0.05) {
        onTriggerAlert(
          getInvalidExpenseAlert(
            numAmount,
            `Splits sum ($${totalCustom.toFixed(2)}) doesn't match total ($${numAmount.toFixed(2)})`
          )
        );
        return;
      }
    }

    onAddExpense(payerId, numAmount, description.trim(), finalSplits);
    setShowAddModal(false);
    setDescription('');
    setAmount('50.00');
  };

  return (
    <div className="space-y-6">
      {/* Top DSA Context Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                DSA: Hash Tables + Directed Graph Min-Cash-Flow
              </span>
              <span className="text-xs text-zinc-400 font-mono">Complexity: O(N log N) Graph Reduction</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Expense Ledger & Debt Simplifier</h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Shared expenses are tabulated in Hash Maps. The directed cash flow graph simplifies multi-party debts down to at most{' '}
              <code className="text-blue-400 font-mono text-xs">N - 1</code> minimal transaction vectors.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Log Shared Expense
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Total Ledger Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            ${totalSpend.toFixed(2)}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Across {expenses.length} shared receipts
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Raw Debt Edges</span>
            <GitFork className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {simplification.originalEdgesCount} Transactions
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Before graph reduction</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Simplified Vectors</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {simplification.simplifiedEdgesCount} Settlements
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Guaranteed &le; {roommates.length - 1} transactions
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Graph Efficiency Gain</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {simplification.efficiencyGainPercent}% Saved
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {simplification.transactionsEliminated} redundant payments eliminated
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hash Table Net Balances */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Hash Table Net Balances
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  O(1) dictionary mapping: Net = Total Paid - Total Splits
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {roommates.map((rm) => {
                const bal = netBalances[rm.id] || 0;
                const isCreditor = bal > 0.005;
                const isDebtor = bal < -0.005;

                return (
                  <div
                    key={rm.id}
                    className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${rm.avatarColor}`} />
                      <div>
                        <div className="text-sm font-semibold text-white">{rm.fullName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{rm.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-mono font-bold flex items-center justify-end gap-1 ${
                          isCreditor
                            ? 'text-emerald-400'
                            : isDebtor
                            ? 'text-rose-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {isCreditor && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isDebtor && <ArrowDownLeft className="w-3.5 h-3.5" />}
                        {isCreditor ? `+$${bal.toFixed(2)}` : isDebtor ? `-$${Math.abs(bal).toFixed(2)}` : '$0.00'}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                        {isCreditor ? 'Is Owed Money' : isDebtor ? 'Owes Money' : 'Settled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Expenses List */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-3">Ledger Transactions ({expenses.length})</h3>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {expenses.map((exp) => {
                const payer = roommates.find((r) => r.id === exp.payerId);
                return (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200">{exp.description}</div>
                      <div className="text-zinc-500 text-[11px]">
                        Paid by <strong className="text-zinc-300">{payer?.fullName || 'Roommate'}</strong> • Split {exp.splits.length} ways
                      </div>
                    </div>
                    <div className="font-mono font-bold text-white text-sm">
                      ${exp.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Directed Graph Simplification Visualizer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  Greedy Graph Optimization
                </span>
                <h3 className="text-lg font-bold text-white">
                  Min-Cash-Flow Directed Debt Vectors
                </h3>
              </div>
              <span className="text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                {simplification.simplifiedTransactions.length} Settlement Vectors
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Instead of roommates paying each other for each receipt, the greedy bipartite algorithm matches maximum debtors with maximum creditors to settle everything in minimal payments:
            </p>

            {/* Directed Transaction Cards */}
            {simplification.simplifiedTransactions.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800">
                <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">All Balances Settled!</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Zero outstanding debts across all roommates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {simplification.simplifiedTransactions.map((tx, idx) => {
                  const fromUser = roommates.find((r) => r.id === tx.fromUserId);
                  const toUser = roommates.find((r) => r.id === tx.toUserId);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-blue-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* From User */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <span className={`w-3 h-3 rounded-full ${fromUser?.avatarColor}`} />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">Debtor (Pays)</span>
                          <div className="font-semibold text-sm text-white">{fromUser?.fullName}</div>
                        </div>
                      </div>

                      {/* Directed Arrow with Amount Badge */}
                      <div className="flex items-center justify-center gap-2 py-1 px-3 bg-zinc-900/90 rounded-xl border border-zinc-800">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${tx.amount.toFixed(2)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                      </div>

                      {/* To User */}
                      <div className="flex items-center gap-3 sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">Creditor (Receives)</span>
                          <div className="font-semibold text-sm text-white">{toUser?.fullName}</div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                          <span className={`w-3 h-3 rounded-full ${toUser?.avatarColor}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Algorithm Explanation Box */}
            <div className="mt-6 bg-zinc-950/90 rounded-2xl p-4 border border-zinc-800/80">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Algorithm Guarantees
              </h4>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                <li>
                  <strong>Net Conservation:</strong> &Sigma; net balances = $0.00, ensuring no funds are fabricated or lost.
                </li>
                <li>
                  <strong>Edge Bound:</strong> Compresses cyclic debts from $O(N^2)$ down to at most $N - 1$ directed edges.
                </li>
                <li>
                  <strong>Greedy Matching:</strong> Resolves maximal debtor and creditor iteratively in $O(N \log N)$ time.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white">Record Shared Expense</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Registered into the household Hash Table ledger and pushed onto the Undo Stack.
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Costco Household Haul & Olive Oil"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Payer (Credited)
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {roommates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Split Methodology
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitType('EQUAL')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                      splitType === 'EQUAL'
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Equal Split (All {roommates.length} Roommates)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitType('CUSTOM');
                      const base = Math.round((parseFloat(amount || '0') / roommates.length) * 100) / 100;
                      const initial: Record<string, number> = {};
                      roommates.forEach((r) => (initial[r.id] = base));
                      setCustomSplits(initial);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                      splitType === 'CUSTOM'
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Custom Allocation
                  </button>
                </div>
              </div>

              {splitType === 'CUSTOM' && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400">Specify Share per Roommate:</span>
                  {roommates.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span>{r.fullName}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSplits[r.id] || 0}
                        onChange={(e) =>
                          setCustomSplits({
                            ...customSplits,
                            [r.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-right font-mono text-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Commit Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
