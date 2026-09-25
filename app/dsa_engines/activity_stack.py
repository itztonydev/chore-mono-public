"""
Recent Actions/Undo Stack Engine.

DSA Concepts:
- Stack (LIFO - Last In, First Out) data structure.
- Records mutations (CREATE_EXPENSE, ROTATE_CHORE, etc.) to enable idempotent reverse operations.
- Integrates with the database and in-memory session states.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class ActionType(str, Enum):
    CREATE_EXPENSE = "CREATE_EXPENSE"
    ROTATE_CHORE = "ROTATE_CHORE"
    DELETE_EXPENSE = "DELETE_EXPENSE"
    SETTLE_PAYMENT = "SETTLE_PAYMENT"


@dataclass
class StackFrame:
    id: str
    household_id: str
    action_type: ActionType
    payload: Dict[str, Any]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "household_id": self.household_id,
            "action_type": self.action_type.value,
            "payload": self.payload,
            "created_at": self.created_at.isoformat(),
        }


class ActivityStack:
    """
    In-Memory LIFO Stack data structure representing household history.
    Synchronized with the persistent `ActivityStackLog` database table.
    """

    def __init__(self):
        self._stack: List[StackFrame] = []

    def push(self, frame: StackFrame) -> None:
        """Push a newly committed action onto the undo stack (O(1))."""
        self._stack.append(frame)

    def pop(self) -> Optional[StackFrame]:
        """Pop the most recent action from the stack for undoing (O(1))."""
        if self.is_empty():
            return None
        return self._stack.pop()

    def peek(self) -> Optional[StackFrame]:
        """Inspect the top of the stack without popping (O(1))."""
        if self.is_empty():
            return None
        return self._stack[-1]

    def is_empty(self) -> bool:
        return len(self._stack) == 0

    def size(self) -> int:
        return len(self._stack)

    def clear(self) -> None:
        self._stack.clear()

    def to_list(self) -> List[Dict[str, Any]]:
        """Return frames in reverse order (most recent first)."""
        return [f.to_dict() for f in reversed(self._stack)]
