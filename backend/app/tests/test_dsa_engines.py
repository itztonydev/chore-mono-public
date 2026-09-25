"""
Comprehensive Unit Tests for Data Structures & Algorithms (DSA) Engines:
- Circular Queue Chore Rotation
- Directed Graph Min-Cash-Flow Debt Simplifier
- Activity Stack LIFO Undo Engine
- Sarcastic Alert Generator
- RFC 9562 UUIDv7 Generator
"""

import unittest
from decimal import Decimal
from app.core.uuid7 import uuid7, uuid7_str
from app.dsa_engines.circular_queue import ChoreCircularQueue
from app.dsa_engines.graph_debt_simplifier import DebtSimplificationEngine
from app.dsa_engines.activity_stack import ActivityStack, StackFrame, ActionType
from app.dsa_engines.sarcastic_alerts import SarcasticAlertSystem


class TestUUID7(unittest.TestCase):
    def test_uuid7_generation(self):
        u = uuid7()
        u_str = str(u)
        self.assertEqual(len(u_str), 36)
        self.assertEqual(u.version, 7)
        self.assertIn("4122", u.variant)

    def test_uuid7_monotonic_sortability(self):
        u1 = uuid7_str()
        u2 = uuid7_str()
        # Time-based IDs should be lexicographically sortable or monotonic
        self.assertTrue(u1 <= u2)


class TestCircularQueue(unittest.TestCase):
    def setUp(self):
        self.members = ["Alice", "Bob", "Charlie", "Diana"]
        self.queue = ChoreCircularQueue(members=self.members, current_index=0)

    def test_initial_state(self):
        self.assertEqual(self.queue.capacity, 4)
        self.assertEqual(self.queue.peek_current(), "Alice")
        self.assertEqual(self.queue.peek_next(), "Bob")

    def test_rotation_cycle(self):
        # Alice -> Bob
        assignee, idx = self.queue.rotate_forward()
        self.assertEqual(assignee, "Bob")
        self.assertEqual(idx, 1)

        # Bob -> Charlie
        assignee, idx = self.queue.rotate_forward()
        self.assertEqual(assignee, "Charlie")
        self.assertEqual(idx, 2)

        # Charlie -> Diana
        assignee, idx = self.queue.rotate_forward()
        self.assertEqual(assignee, "Diana")
        self.assertEqual(idx, 3)

        # Diana -> Alice (Wraparound)
        assignee, idx = self.queue.rotate_forward()
        self.assertEqual(assignee, "Alice")
        self.assertEqual(idx, 0)

    def test_rotation_backward_undo(self):
        self.queue.rotate_forward()  # Alice -> Bob
        self.assertEqual(self.queue.peek_current(), "Bob")
        self.queue.rotate_backward()  # Bob -> Alice
        self.assertEqual(self.queue.peek_current(), "Alice")

    def test_peek_lookahead(self):
        self.assertEqual(self.queue.peek_next(steps=1), "Bob")
        self.assertEqual(self.queue.peek_next(steps=2), "Charlie")
        self.assertEqual(self.queue.peek_next(steps=3), "Diana")
        self.assertEqual(self.queue.peek_next(steps=4), "Alice")


class TestDebtSimplificationGraph(unittest.TestCase):
    def test_net_balance_calculation(self):
        # Alice paid $60 for Alice, Bob, Charlie ($20 each)
        expenses = [
            {
                "payer_id": "Alice",
                "amount": 60.0,
                "splits": [
                    {"user_id": "Alice", "split_amount": 20.0},
                    {"user_id": "Bob", "split_amount": 20.0},
                    {"user_id": "Charlie", "split_amount": 20.0},
                ],
            }
        ]
        balances = DebtSimplificationEngine.compute_net_balances(expenses)
        self.assertEqual(balances["Alice"], 40.0)
        self.assertEqual(balances["Bob"], -20.0)
        self.assertEqual(balances["Charlie"], -20.0)
        self.assertAlmostEqual(sum(balances.values()), 0.0)

    def test_min_cash_flow_greedy_simplification(self):
        # Cycle scenario:
        # Alice paid $30 split with Bob
        # Bob paid $30 split with Charlie
        # Charlie paid $30 split with Alice
        # Net: All paid $30, all owed $30 -> Net balances are 0.0!
        expenses = [
            {"payer_id": "Alice", "amount": 30.0, "splits": [{"user_id": "Bob", "split_amount": 30.0}]},
            {"payer_id": "Bob", "amount": 30.0, "splits": [{"user_id": "Charlie", "split_amount": 30.0}]},
            {"payer_id": "Charlie", "amount": 30.0, "splits": [{"user_id": "Alice", "split_amount": 30.0}]},
        ]
        result = DebtSimplificationEngine.simplify_debts(expenses)
        # Cycle cancelled out! Simplified transactions should be 0
        self.assertEqual(len(result.simplified_transactions), 0)
        self.assertEqual(result.transactions_eliminated, 3)

    def test_complex_multi_roommate_reduction(self):
        # 4 roommates: Alice, Bob, Charlie, Dave
        # Alice paid $120 for all 4 ($30 each)
        # Bob paid $40 for Charlie & Dave ($20 each)
        expenses = [
            {
                "payer_id": "Alice",
                "amount": 120.0,
                "splits": [
                    {"user_id": "Alice", "split_amount": 30.0},
                    {"user_id": "Bob", "split_amount": 30.0},
                    {"user_id": "Charlie", "split_amount": 30.0},
                    {"user_id": "Dave", "split_amount": 30.0},
                ],
            },
            {
                "payer_id": "Bob",
                "amount": 40.0,
                "splits": [
                    {"user_id": "Charlie", "split_amount": 20.0},
                    {"user_id": "Dave", "split_amount": 20.0},
                ],
            },
        ]
        result = DebtSimplificationEngine.simplify_debts(expenses)
        # Net balances:
        # Alice: +90
        # Bob: +40 - 30 = +10
        # Charlie: -30 - 20 = -50
        # Dave: -30 - 20 = -50
        # Max creditors: Alice (+90), Bob (+10)
        # Max debtors: Charlie (-50), Dave (-50)
        # Algorithm should match debtors with creditors in <= 3 transactions
        self.assertLessEqual(len(result.simplified_transactions), 3)
        total_settled = sum(t.amount for t in result.simplified_transactions)
        self.assertAlmostEqual(total_settled, 100.0, places=2)


class TestActivityStack(unittest.TestCase):
    def test_stack_lifo_operations(self):
        stack = ActivityStack()
        self.assertTrue(stack.is_empty())

        f1 = StackFrame(id="1", household_id="h1", action_type=ActionType.ROTATE_CHORE, payload={"chore": "Dishes"})
        f2 = StackFrame(id="2", household_id="h1", action_type=ActionType.CREATE_EXPENSE, payload={"amount": 45.0})

        stack.push(f1)
        stack.push(f2)
        self.assertEqual(stack.size(), 2)
        self.assertEqual(stack.peek().id, "2")

        popped = stack.pop()
        self.assertEqual(popped.id, "2")
        self.assertEqual(stack.size(), 1)
        self.assertEqual(stack.peek().id, "1")


class TestSarcasticAlerts(unittest.TestCase):
    def test_alert_generation(self):
        alert1 = SarcasticAlertSystem.get_premature_rotation_alert("Dishes", "Alex")
        self.assertIn("Dishes", alert1)
        self.assertIn("Alex", alert1)

        alert2 = SarcasticAlertSystem.get_invalid_expense_alert(0.0)
        self.assertTrue(alert2.startswith("💸 [Ledger Sarcasm]"))

        alert3 = SarcasticAlertSystem.get_empty_undo_alert()
        self.assertTrue(len(alert3) > 10)
        self.assertTrue(alert3.startswith("⏳ [Stack Sarcasm]"))


if __name__ == "__main__":
    unittest.main()
