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
  const [description, setDescription] = useState<string>('Costco Household Haul');
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

  const memberIds = roommates.map((r) => r.id);
  const simplification = DebtSimplificationEngineTS.simplifyDebts(expenses, memberIds);
  const netBalances = simplification.netBalances;
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
      <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#bb9af7] font-bold uppercase tracking-wider">
                DSA: HASH TABLES + DIRECTED GRAPH MIN-CASH-FLOW
              </span>
              <span className="text-[#565f89]">|</span>
              <span className="text-[#7dcfff] font-mono">O(N log N) GRAPH REDUCTION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 uppercase tracking-tight">
              Expense Ledger & Debt Simplifier
            </h2>
            <p className="text-xs font-mono text-[#9aa5ce] mt-1 max-w-2xl leading-relaxed">
              Shared expenses are tracked via O(1) Hash Map balance lookups. The Min-Cash-Flow Greedy Directed Graph compresses $O(N^2)$ pairwise debts into at most <code className="text-[#7dcfff] font-bold">N - 1</code> minimal settlement vectors.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#bb9af7] hover:bg-white text-black font-mono font-bold text-xs px-4 py-2.5 border border-[#bb9af7] transition-none cursor-pointer shadow-brutal-sm-purple shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ RECORD SHARED EXPENSE</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-[#565f89] bg-black divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#565f89]">
        <div className="p-3.5 bg-[#16161E] font-mono">
          <div className="text-[10px] text-[#9aa5ce] font-bold uppercase">TOTAL SPEND</div>
          <div className="text-2xl font-sans font-extrabold text-white mt-1">
            ${totalSpend.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#565f89] mt-0.5">{expenses.length} RECEIPTS LOGGED</div>
        </div>

        <div className="p-3.5 bg-[#16161E] font-mono">
          <div className="text-[10px] text-[#9aa5ce] font-bold uppercase">RAW DEBT EDGES</div>
          <div className="text-2xl font-sans font-extrabold text-[#e0af68] mt-1">
            {simplification.originalEdgesCount} EDGES
          </div>
          <div className="text-[10px] text-[#565f89] mt-0.5">BEFORE GRAPH REDUCTION</div>
        </div>

        <div className="p-3.5 bg-[#16161E] font-mono">
          <div className="text-[10px] text-[#9aa5ce] font-bold uppercase">SIMPLIFIED VECTORS</div>
          <div className="text-2xl font-sans font-extrabold text-[#7dcfff] mt-1">
            {simplification.simplifiedEdgesCount} SETTLEMENTS
          </div>
          <div className="text-[10px] text-[#565f89] mt-0.5">&le; {roommates.length - 1} TRANSACTIONS</div>
        </div>

        <div className="p-3.5 bg-[#16161E] font-mono">
          <div className="text-[10px] text-[#9aa5ce] font-bold uppercase">EFFICIENCY GAIN</div>
          <div className="text-2xl font-sans font-extrabold text-[#9ece6a] mt-1">
            {simplification.efficiencyGainPercent}% SAVED
          </div>
          <div className="text-[10px] text-[#565f89] mt-0.5">{simplification.transactionsEliminated} EDGES ELIMINATED</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hash Table Net Balances */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-3 mb-4 font-mono text-xs">
              <div>
                <span className="text-white font-bold block uppercase">HASH TABLE NET BALANCES</span>
                <span className="text-[11px] text-[#9aa5ce]">Net = Total Paid - Total Splits (Zero-Sum)</span>
              </div>
            </div>

            <div className="space-y-2 font-mono">
              {roommates.map((rm) => {
                const bal = netBalances[rm.id] || 0;
                const isCreditor = bal > 0.005;
                const isDebtor = bal < -0.005;

                return (
                  <div
                    key={rm.id}
                    className="p-3 bg-black border border-[#565f89] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 ${rm.avatarColor}`} />
                      <div>
                        <div className="font-bold text-white text-xs">{rm.fullName}</div>
                        <div className="text-[10px] text-[#565f89]">{rm.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-bold flex items-center justify-end gap-0.5 ${
                          isCreditor
                            ? 'text-[#9ece6a]'
                            : isDebtor
                            ? 'text-[#f7768e]'
                            : 'text-[#9aa5ce]'
                        }`}
                      >
                        {isCreditor ? `+$${bal.toFixed(2)}` : isDebtor ? `-$${Math.abs(bal).toFixed(2)}` : '$0.00'}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-[#565f89]">
                        {isCreditor ? 'CREDITOR (IS OWED)' : isDebtor ? 'DEBTOR (OWES)' : 'SETTLED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ledger History List */}
          <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-2 mb-3 font-mono text-xs">
              <span className="text-white font-bold uppercase">LEDGER TRANSACTIONS ({expenses.length})</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 font-mono text-xs">
              {expenses.map((exp) => {
                const payer = roommates.find((r) => r.id === exp.payerId);
                return (
                  <div
                    key={exp.id}
                    className="p-2.5 bg-black border border-[#565f89] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{exp.description}</div>
                      <div className="text-[10px] text-[#9aa5ce]">
                        Paid by {payer?.fullName || 'Roommate'} • {exp.splits.length} splits
                      </div>
                    </div>
                    <div className="font-bold text-[#7dcfff] text-sm">
                      ${exp.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Directed Graph Simplification */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-3 mb-4 font-mono text-xs">
              <div>
                <span className="text-[#bb9af7] font-bold uppercase tracking-wider block text-[11px]">
                  GREEDY GRAPH REDUCTION
                </span>
                <span className="text-white font-bold text-sm">MINIMAL SETTLEMENT TRANSACTIONS</span>
              </div>
              <span className="text-black bg-[#bb9af7] font-bold px-2 py-0.5 text-[10px]">
                {simplification.simplifiedTransactions.length} VECTORS
              </span>
            </div>

            <p className="text-xs font-mono text-[#9aa5ce] mb-4">
              Instead of roommates settling dozens of mutual IOUs, the greedy algorithm pairs maximal debtors with maximal creditors, resolving all debts in $\le N - 1$ payments:
            </p>

            {simplification.simplifiedTransactions.length === 0 ? (
              <div className="p-8 text-center bg-black border-2 border-dashed border-[#565f89] font-mono">
                <Check className="w-8 h-8 text-[#9ece6a] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">ALL BALANCES FULLY SETTLED</h4>
                <p className="text-xs text-[#9aa5ce] mt-1">Zero net debt vectors remain in the household.</p>
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                {simplification.simplifiedTransactions.map((tx, idx) => {
                  const fromUser = roommates.find((r) => r.id === tx.fromUserId);
                  const toUser = roommates.find((r) => r.id === tx.toUserId);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-black border-2 border-[#565f89] hover:border-[#bb9af7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* From User */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#16161E] border border-[#565f89] flex items-center justify-center font-bold text-white">
                          {fromUser?.fullName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <span className="text-[9px] text-[#f7768e] font-bold uppercase">DEBTOR (PAYS)</span>
                          <div className="font-bold text-white text-xs">{fromUser?.fullName}</div>
                        </div>
                      </div>

                      {/* Directed Arrow with Amount Badge */}
                      <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#16161E] border border-[#565f89]">
                        <span className="font-bold text-[#9ece6a] text-sm">
                          ${tx.amount.toFixed(2)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#7dcfff]" />
                      </div>

                      {/* To User */}
                      <div className="flex items-center gap-2.5 sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-[#7dcfff] font-bold uppercase">CREDITOR (RECEIVES)</span>
                          <div className="font-bold text-white text-xs">{toUser?.fullName}</div>
                        </div>
                        <div className="w-8 h-8 bg-[#16161E] border border-[#565f89] flex items-center justify-center font-bold text-white">
                          {toUser?.fullName.split(' ').map((n) => n[0]).join('')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#16161E] border-4 border-[#bb9af7] p-6 max-w-lg w-full shadow-brutal-lg-purple text-left font-mono">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-2 mb-4">
              <h3 className="text-base font-bold text-white uppercase">RECORD SHARED EXPENSE</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#9aa5ce] hover:text-[#f7768e] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-[#bb9af7] mb-1 font-bold">
                  EXPENSE DESCRIPTION
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Costco Household Haul & Olive Oil"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black border border-[#565f89] px-3 py-2 text-white focus:outline-none focus:border-[#bb9af7] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-[#bb9af7] mb-1 font-bold">
                    AMOUNT ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black border border-[#565f89] px-3 py-2 text-white focus:outline-none focus:border-[#bb9af7] font-mono"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-[#bb9af7] mb-1 font-bold">
                    PAYER (CREDITED)
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full bg-black border border-[#565f89] px-3 py-2 text-white focus:outline-none focus:border-[#bb9af7] font-mono"
                  >
                    {roommates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-[#9aa5ce] hover:text-white border border-[#565f89] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#bb9af7] hover:bg-white text-black font-bold text-xs uppercase cursor-pointer shadow-brutal-sm-purple"
                >
                  COMMIT TO LEDGER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
