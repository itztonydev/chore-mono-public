"""
Sarcastic Alert System.

Generates hilarious, contextual, dynamic sarcastic responses when roommates:
- Attempt to skip a turn or mark incomplete duties prematurely
- Log invalid or self-serving expenses ($0 splits, quantum receipts)
- Attempt to pop an empty undo stack
- Evade household responsibilities
"""

import random
from typing import List, Optional


class SarcasticAlertSystem:
    """
    Generates dynamic sarcastic message responses for household violations.
    """

    PREMATURE_ROTATION_ALERTS = [
        "Leaving the frying pan to 'soak' for the 4th consecutive business day? Bold architectural decision.",
        "Nice try shifting trash duty to your roommate. The circular queue has an O(1) memory and zero empathy.",
        "You spun the chore roulette wheel hoping it'd magically skip your turn. The algorithm has rejected your prayer.",
        "Marking a chore done while the sink remains an active UNESCO bio-hazard site is a federal crime in this apartment.",
        "A 30-second rinse is not a completed chore. Please respect the thermodynamic laws of dish soap.",
        "Attempting a premature chore rotation? The Roommate Council will convene at dawn to discuss your banishment.",
        "Chore evasion detected. The circular queue pointer refuses to budge until actual elbow grease is detected.",
    ]

    INVALID_TRANSACTION_ALERTS = [
        "Splitting $0.00? Did you purchase invisible oat milk, or are you just testing the mathematical fabric of reality?",
        "Splitting an expense exclusively with yourself is called 'shopping', not a shared expense vector.",
        "Negative amounts detected. Unless the grocery store paid you to take kale off their hands, please fix this.",
        "Splitting total amount of ${amount} across 0 roommates? Division by zero is prohibited by both Python and common decency.",
        "Wait, you bought a $40 artisanal scented candle and categorized it as 'Critical Living Infrastructure'?",
        "Logging a receipt with no debtors? Charitable donations to yourself are not tax deductible in this household.",
    ]

    EMPTY_UNDO_ALERTS = [
        "Undo what? Your life choices? The activity stack is completely empty.",
        "Stack Underflow Exception: You cannot undo transactions that only occurred in your daydreams.",
        "Attempting to pop from an empty stack is like checking the fridge for the 5th time expecting pizza to appear.",
        "Nothing to undo. The ledger is clean, unlike the bathroom mirror.",
    ]

    CHORE_SKIP_DENIED = [
        "Skip denied! You cannot pass Go, you cannot collect $200, and you cannot evade taking out the compost.",
        "Nice try, Houdini! The circular queue pointer remains locked on your name until duty is discharged.",
        "Skipping turns is strictly reserved for people whose roommates don't know how to query SQLite.",
    ]

    @classmethod
    def get_premature_rotation_alert(cls, chore_title: Optional[str] = None, user_name: Optional[str] = None) -> str:
        base = random.choice(cls.PREMATURE_ROTATION_ALERTS)
        if chore_title and user_name:
            return f"🚨 [Sarcastic Alert] {user_name}, step away from the button! {base} ('{chore_title}')"
        return f"🚨 [Sarcastic Alert] {base}"

    @classmethod
    def get_invalid_expense_alert(cls, amount: float = 0.0, reason: Optional[str] = None) -> str:
        base = random.choice(cls.INVALID_TRANSACTION_ALERTS)
        msg = base.replace("{amount}", f"{amount:.2f}")
        if reason:
            return f"💸 [Ledger Sarcasm] {msg} ({reason})"
        return f"💸 [Ledger Sarcasm] {msg}"

    @classmethod
    def get_empty_undo_alert(cls) -> str:
        return f"⏳ [Stack Sarcasm] {random.choice(cls.EMPTY_UNDO_ALERTS)}"

    @classmethod
    def get_skip_denied_alert(cls, assignee_name: str) -> str:
        return f"⛔ [Roulette Veto] {assignee_name}: {random.choice(cls.CHORE_SKIP_DENIED)}"
