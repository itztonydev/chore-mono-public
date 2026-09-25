"""
Debt Simplification Engine: Directed Graph Reduction & Expense Ledger.

DSA Concepts:
1. Expense Ledger: Hash Tables (Dictionaries) for O(1) balance lookups & updates.
2. Debt Simplification Engine: Min-Cash-Flow Greedy Directed Graph Algorithm.
   Compresses multi-party roommate debts into minimal transaction vectors,
   reducing O(N^2) circular debts down to at most N - 1 settlement transactions.
"""

from collections import defaultdict
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class TransactionVector:
    from_user: str
    to_user: str
    amount: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_user": self.from_user,
            "to_user": self.to_user,
            "amount": round(self.amount, 2),
        }


@dataclass
class SimplificationResult:
    net_balances: Dict[str, float]
    simplified_transactions: List[TransactionVector]
    original_transactions_count: int
    simplified_transactions_count: int
    transactions_eliminated: int
    efficiency_gain_percent: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "net_balances": {k: round(v, 2) for k, v in self.net_balances.items()},
            "simplified_transactions": [t.to_dict() for t in self.simplified_transactions],
            "original_transactions_count": self.original_transactions_count,
            "simplified_transactions_count": self.simplified_transactions_count,
            "transactions_eliminated": self.transactions_eliminated,
            "efficiency_gain_percent": round(self.efficiency_gain_percent, 1),
        }


class DebtSimplificationEngine:
    """
    Solves the Multi-Party Roommate Cash Flow Problem using Directed Graph Reduction.
    """

    EPSILON = 0.005  # Fractional cent threshold

    @classmethod
    def compute_net_balances(
        cls,
        expenses: List[Dict[str, Any]],
        all_member_ids: Optional[List[str]] = None,
    ) -> Dict[str, float]:
        """
        Calculates the net balance for each roommate using a Hash Table (dict).
        Net Balance = Total Amount Paid - Total Split Owed.
        - Positive (> 0): Roommate is owed money (Net Creditor).
        - Negative (< 0): Roommate owes money (Net Debtor).
        - Zero (== 0): Settled.
        """
        balances: Dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))

        if all_member_ids:
            for member_id in all_member_ids:
                balances[member_id] = Decimal("0.00")

        for exp in expenses:
            payer_id = exp["payer_id"]
            total_amount = Decimal(str(exp["amount"]))
            splits = exp.get("splits", [])

            # Credit the payer
            balances[payer_id] += total_amount

            # Debit each participant
            for split in splits:
                uid = split["user_id"]
                split_amt = Decimal(str(split["split_amount"]))
                balances[uid] -= split_amt

        # Convert to standard float rounded to 2 decimal places
        return {
            user_id: float(bal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
            for user_id, bal in balances.items()
        }

    @classmethod
    def simplify_debts(
        cls,
        expenses: List[Dict[str, Any]],
        all_member_ids: Optional[List[str]] = None,
    ) -> SimplificationResult:
        """
        Execute Min-Cash-Flow Greedy Directed Graph Algorithm.
        
        Complexity:
        - Time: O(N log N) where N is number of roommates
        - Space: O(N) for balance tracking
        
        Guarantees:
        - At most N - 1 transactions generated (N = total members with non-zero balance).
        """
        # Step 1: Compute Net Balances in O(T) where T is total splits
        net_balances = cls.compute_net_balances(expenses, all_member_ids)

        # Count original pairwise debt edges before simplification
        original_edges_count = 0
        for exp in expenses:
            splits = exp.get("splits", [])
            payer = exp["payer_id"]
            for s in splits:
                if s["user_id"] != payer and float(s["split_amount"]) > 0:
                    original_edges_count += 1

        # Step 2: Separate into Creditors and Debtors
        # Using Decimal internally to prevent floating point drift
        creditors: List[Tuple[str, Decimal]] = []
        debtors: List[Tuple[str, Decimal]] = []

        for uid, bal in net_balances.items():
            dec_bal = Decimal(str(bal)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if dec_bal > Decimal(str(cls.EPSILON)):
                creditors.append((uid, dec_bal))
            elif dec_bal < Decimal(str(-cls.EPSILON)):
                # Store debt as positive amount for calculation
                debtors.append((uid, -dec_bal))

        simplified_txs: List[TransactionVector] = []

        # Step 3: Greedy bipartite match: highest debtor pays highest creditor
        # Sort both lists descending by amount
        while creditors and debtors:
            creditors.sort(key=lambda x: x[1], reverse=True)
            debtors.sort(key=lambda x: x[1], reverse=True)

            c_user, c_amount = creditors.pop(0)
            d_user, d_amount = debtors.pop(0)

            # Settle minimum of what debtor owes and what creditor is owed
            settle_amount = min(c_amount, d_amount)

            if settle_amount > Decimal(str(cls.EPSILON)):
                simplified_txs.append(
                    TransactionVector(
                        from_user=d_user,
                        to_user=c_user,
                        amount=float(settle_amount.quantize(Decimal("0.01"))),
                    )
                )

            remaining_c = c_amount - settle_amount
            remaining_d = d_amount - settle_amount

            if remaining_c > Decimal(str(cls.EPSILON)):
                creditors.append((c_user, remaining_c))

            if remaining_d > Decimal(str(cls.EPSILON)):
                debtors.append((d_user, remaining_d))

        simplified_count = len(simplified_txs)
        tx_saved = max(0, original_edges_count - simplified_count)
        efficiency = (
            (tx_saved / original_edges_count * 100.0)
            if original_edges_count > 0
            else 0.0
        )

        return SimplificationResult(
            net_balances=net_balances,
            simplified_transactions=simplified_txs,
            original_transactions_count=original_edges_count,
            simplified_transactions_count=simplified_count,
            transactions_eliminated=tx_saved,
            efficiency_gain_percent=efficiency,
        )
