"""
Chore Rotation Engine: Circular Queue Data Structure.

Implements a Circular Queue to fairly assign and rotate household duties.
Guarantees deterministic O(1) turn transitions and tracks rotation history.
"""

from typing import Any, Dict, List, Optional, Tuple


class CircularQueueException(Exception):
    """Base exception for circular queue operations."""
    pass


class ChoreCircularQueue:
    """
    Circular Queue implementation for fair roommate chore rotation.
    
    Data Structure Properties:
    - Fixed or dynamic list of member IDs forming a logical ring.
    - Pointer index points to the active duty assignee.
    - Next index = (pointer + 1) % len(members).
    - Previous index = (pointer - 1 + len(members)) % len(members).
    """

    def __init__(self, members: Optional[List[str]] = None, current_index: int = 0):
        self._members: List[str] = list(members) if members else []
        self._current_index: int = current_index if self._members else 0
        if self._members:
            self._current_index %= len(self._members)

    @property
    def capacity(self) -> int:
        return len(self._members)

    @property
    def current_index(self) -> int:
        return self._current_index

    @property
    def members(self) -> List[str]:
        return list(self._members)

    def is_empty(self) -> bool:
        return len(self._members) == 0

    def add_member(self, member_id: str) -> None:
        """Add a new roommate to the circular queue ring."""
        if member_id not in self._members:
            self._members.append(member_id)

    def remove_member(self, member_id: str) -> None:
        """Remove a roommate from the circular queue ring."""
        if member_id in self._members:
            idx = self._members.index(member_id)
            self._members.remove(member_id)
            if self._members:
                if self._current_index >= len(self._members):
                    self._current_index = 0
            else:
                self._current_index = 0

    def peek_current(self) -> Optional[str]:
        """Return the current assignee without advancing the pointer."""
        if self.is_empty():
            return None
        return self._members[self._current_index]

    def peek_next(self, steps: int = 1) -> Optional[str]:
        """Predict the assignee N steps ahead in the rotation."""
        if self.is_empty():
            return None
        next_idx = (self._current_index + steps) % len(self._members)
        return self._members[next_idx]

    def peek_previous(self) -> Optional[str]:
        """Get the member who had the turn immediately prior to the current."""
        if self.is_empty():
            return None
        prev_idx = (self._current_index - 1 + len(self._members)) % len(self._members)
        return self._members[prev_idx]

    def rotate_forward(self) -> Tuple[Optional[str], int]:
        """
        Advance the circular pointer to the next member in the ring.
        Returns:
            Tuple[Optional[str], int]: (new_assignee_id, new_pointer_index)
        """
        if self.is_empty():
            return None, 0

        self._current_index = (self._current_index + 1) % len(self._members)
        return self._members[self._current_index], self._current_index

    def rotate_backward(self) -> Tuple[Optional[str], int]:
        """
        Reverse the circular pointer to the previous member in the ring (used for Undo).
        Returns:
            Tuple[Optional[str], int]: (previous_assignee_id, previous_pointer_index)
        """
        if self.is_empty():
            return None, 0

        self._current_index = (self._current_index - 1 + len(self._members)) % len(self._members)
        return self._members[self._current_index], self._current_index

    def set_pointer_to_member(self, member_id: str) -> int:
        """Set the circular queue pointer directly to a given member ID."""
        if member_id not in self._members:
            raise CircularQueueException(f"Member {member_id} not found in circular queue.")
        self._current_index = self._members.index(member_id)
        return self._current_index

    def to_dict(self) -> Dict[str, Any]:
        """Export internal state representation for API responses & JSON serialization."""
        return {
            "members": self._members,
            "current_index": self._current_index,
            "current_assignee": self.peek_current(),
            "next_assignee": self.peek_next(),
            "total_members": len(self._members),
        }
