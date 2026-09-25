import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal } from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  category: 'DSA Engine' | 'Core & Crypto' | 'Models & DB' | 'API Endpoints';
  description: string;
  code: string;
}

const BACKEND_FILES: CodeFile[] = [
  {
    path: 'backend/app/dsa_engines/circular_queue.py',
    name: 'circular_queue.py',
    category: 'DSA Engine',
    description: 'Circular Queue (Ring Buffer) data structure for fair O(1) chore turn shifts with lookahead.',
    code: `"""
Chore Rotation Engine: Circular Queue Data Structure.
Implements a Circular Queue to fairly assign and rotate household duties.
"""
from typing import Any, Dict, List, Optional, Tuple

class ChoreCircularQueue:
    def __init__(self, members: Optional[List[str]] = None, current_index: int = 0):
        self._members: List[str] = list(members) if members else []
        self._current_index: int = current_index if self._members else 0
        if self._members:
            self._current_index %= len(self._members)

    @property
    def capacity(self) -> int:
        return len(self._members)

    def peek_current(self) -> Optional[str]:
        if not self._members:
            return None
        return self._members[self._current_index]

    def peek_next(self, steps: int = 1) -> Optional[str]:
        if not self._members:
            return None
        next_idx = (self._current_index + steps) % len(self._members)
        return self._members[next_idx]

    def rotate_forward(self) -> Tuple[Optional[str], int]:
        if not self._members:
            return None, 0
        self._current_index = (self._current_index + 1) % len(self._members)
        return self._members[self._current_index], self._current_index

    def rotate_backward(self) -> Tuple[Optional[str], int]:
        if not self._members:
            return None, 0
        self._current_index = (self._current_index - 1 + len(self._members)) % len(self._members)
        return self._members[self._current_index], self._current_index`,
  },
  {
    path: 'backend/app/dsa_engines/graph_debt_simplifier.py',
    name: 'graph_debt_simplifier.py',
    category: 'DSA Engine',
    description: 'Min-Cash-Flow Greedy Directed Graph Algorithm to compress multi-party debt vectors.',
    code: `"""
Debt Simplification Engine: Directed Graph Reduction & Expense Ledger.
Compresses multi-party roommate debts into minimal transaction vectors (<= N - 1).
"""
from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple

@dataclass
class TransactionVector:
    from_user: str
    to_user: str
    amount: float

class DebtSimplificationEngine:
    EPSILON = 0.005

    @classmethod
    def compute_net_balances(cls, expenses: List[Dict[str, Any]], all_member_ids=None):
        balances = defaultdict(lambda: Decimal("0.00"))
        if all_member_ids:
            for m in all_member_ids:
                balances[m] = Decimal("0.00")

        for exp in expenses:
            balances[exp["payer_id"]] += Decimal(str(exp["amount"]))
            for split in exp.get("splits", []):
                balances[split["user_id"]] -= Decimal(str(split["split_amount"]))

        return {u: float(b.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) for u, b in balances.items()}

    @classmethod
    def simplify_debts(cls, expenses: List[Dict[str, Any]], all_member_ids=None):
        net_balances = cls.compute_net_balances(expenses, all_member_ids)
        creditors = [(u, Decimal(str(b))) for u, b in net_balances.items() if b > cls.EPSILON]
        debtors = [(u, -Decimal(str(b))) for u, b in net_balances.items() if b < -cls.EPSILON]

        simplified = []
        while creditors and debtors:
            creditors.sort(key=lambda x: x[1], reverse=True)
            debtors.sort(key=lambda x: x[1], reverse=True)

            c_user, c_amt = creditors.pop(0)
            d_user, d_amt = debtors.pop(0)
            settle = min(c_amt, d_amt)

            if settle > Decimal(str(cls.EPSILON)):
                simplified.append(TransactionVector(from_user=d_user, to_user=c_user, amount=float(settle)))

            if c_amt - settle > Decimal(str(cls.EPSILON)):
                creditors.append((c_user, c_amt - settle))
            if d_amt - settle > Decimal(str(cls.EPSILON)):
                debtors.append((d_user, d_amt - settle))

        return simplified`,
  },
  {
    path: 'backend/app/dsa_engines/activity_stack.py',
    name: 'activity_stack.py',
    category: 'DSA Engine',
    description: 'LIFO Undo Stack engine managing reversible mutations.',
    code: `"""
Recent Actions/Undo Stack Engine.
LIFO data structure representing household history and reversible snapshots.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

class ActionType(str, Enum):
    CREATE_EXPENSE = "CREATE_EXPENSE"
    ROTATE_CHORE = "ROTATE_CHORE"

@dataclass
class StackFrame:
    id: str
    household_id: str
    action_type: ActionType
    payload: Dict[str, Any]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityStack:
    def __init__(self):
        self._stack: List[StackFrame] = []

    def push(self, frame: StackFrame) -> None:
        self._stack.append(frame)

    def pop(self) -> Optional[StackFrame]:
        if self.is_empty():
            return None
        return self._stack.pop()

    def peek(self) -> Optional[StackFrame]:
        if self.is_empty():
            return None
        return self._stack[-1]

    def is_empty(self) -> bool:
        return len(self._stack) == 0`,
  },
  {
    path: 'backend/app/core/crypto_ed25519.py',
    name: 'crypto_ed25519.py',
    category: 'Core & Crypto',
    description: 'Ed25519 Curve25519 keypair generation, signature signing and verification.',
    code: `"""
Ed25519 Cryptographic Utilities for User Signature & Authentication.
"""
import secrets
from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature

class Ed25519CryptoService:
    @staticmethod
    def generate_challenge(length: int = 32) -> str:
        return secrets.token_hex(length)

    @staticmethod
    def generate_keypair() -> Tuple[str, str]:
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        return private_key.private_bytes_raw().hex(), public_key.public_bytes_raw().hex()

    @staticmethod
    def sign_message(private_key_hex: str, message: str) -> str:
        priv_bytes = bytes.fromhex(private_key_hex)
        private_key = ed25519.Ed25519PrivateKey.from_private_bytes(priv_bytes)
        return private_key.sign(message.encode("utf-8")).hex()

    @staticmethod
    def verify_signature(public_key_hex: str, message: str, signature_hex: str) -> bool:
        try:
            pub_bytes = bytes.fromhex(public_key_hex)
            sig_bytes = bytes.fromhex(signature_hex)
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)
            public_key.verify(sig_bytes, message.encode("utf-8"))
            return True
        except (InvalidSignature, ValueError):
            return False`,
  },
  {
    path: 'backend/app/core/uuid7.py',
    name: 'uuid7.py',
    category: 'Core & Crypto',
    description: 'RFC 9562 Monotonic UUIDv7 Generator with dedicated millisecond sequence counter.',
    code: `"""
RFC 9562 Compliant UUIDv7 Generator with Monotonic Sequence Counter.
"""
import os
import time
import uuid
import threading

_lock = threading.Lock()
_last_ms = 0
_seq = 0

def uuid7() -> uuid.UUID:
    global _last_ms, _seq

    with _lock:
        ms = int(time.time() * 1000) & 0xFFFFFFFFFFFF
        if ms > _last_ms:
            _last_ms = ms
            _seq = int.from_bytes(os.urandom(2), byteorder="big") & 0x07FF
        elif ms == _last_ms:
            _seq = (_seq + 1) & 0x0FFF
        else:
            _seq = (_seq + 1) & 0x0FFF
            ms = _last_ms
        curr_seq = _seq

    rand_bytes = os.urandom(8)
    rand_a = rand_bytes[0] & 0x3F
    rand_b = rand_bytes[1:8]

    hi = (ms << 16) | (0x7 << 12) | curr_seq
    lo = (0x2 << 62) | (rand_a << 56) | int.from_bytes(rand_b, byteorder="big")
    return uuid.UUID(int=(hi << 64) | lo)

def uuid7_str() -> str:
    return str(uuid7())`,
  },
  {
    path: 'backend/app/models/user.py',
    name: 'user.py',
    category: 'Models & DB',
    description: 'SQLAlchemy User model with UUID7, Bcrypt hash, Google Sub ID, and Ed25519 public key.',
    code: `"""
User Database Model (SQLAlchemy Async).
"""
from typing import List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUID7PrimaryKeyMixin, TimestampMixin

class User(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    google_sub_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    ed25519_public_key: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True)

    household_memberships: Mapped[List["HouseholdMember"]] = relationship(
        "HouseholdMember", back_populates="user", cascade="all, delete-orphan"
    )`,
  },
];

export const CodebaseExplorerView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(BACKEND_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6 font-mono text-xs text-left">
      <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#9ece6a] font-bold uppercase tracking-wider">
                BACKEND SOURCE EXPLORER
              </span>
              <span className="text-[#565f89]">|</span>
              <span className="text-[#c0caf5]">PYTHON 3.10+ / ASYNC SQLALCHEMY 2.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white mt-1 uppercase tracking-tight">
              Production Python Code Modules
            </h2>
            <p className="text-xs text-[#9aa5ce] mt-1 max-w-2xl leading-relaxed">
              Inspect the real backend algorithms: Circular Queue ring buffer, Min-Cash-Flow graph debt simplifier, LIFO activity stack, Ed25519 cryptographic authentication, and RFC 9562 UUIDv7 generator.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-[#7dcfff] hover:bg-white text-black font-bold px-4 py-2.5 transition-none cursor-pointer shadow-brutal-sm-cyan uppercase shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
            <span>COPY MODULE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-bold text-white uppercase px-1 mb-2">
            BACKEND MODULES ({BACKEND_FILES.length})
          </div>
          <div className="space-y-2">
            {BACKEND_FILES.map((file) => {
              const isSelected = file.path === selectedFile.path;

              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3 border-2 cursor-pointer transition-none ${
                    isSelected
                      ? 'bg-black border-[#7dcfff] shadow-brutal-sm-cyan'
                      : 'bg-[#16161E] border-[#565f89] hover:border-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs truncate">
                      <FileCode className="w-3.5 h-3.5 text-[#7dcfff] shrink-0" />
                      <span>{file.name}</span>
                    </div>
                    <span className="text-[9px] bg-black border border-[#565f89] text-[#9aa5ce] px-1">
                      {file.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9aa5ce] truncate">{file.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8">
          <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-3 mb-4">
              <div>
                <span className="text-[10px] text-[#7dcfff] font-bold uppercase tracking-wider block">
                  PATH: {selectedFile.path}
                </span>
                <span className="font-bold text-white text-sm">{selectedFile.name}</span>
              </div>
              <span className="text-[10px] bg-black border border-[#565f89] text-[#9ece6a] px-2 py-0.5 font-bold">
                PYTHON
              </span>
            </div>

            <pre className="p-4 bg-black border border-[#565f89] text-[#c0caf5] text-xs leading-relaxed overflow-x-auto max-h-[550px]">
              {selectedFile.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
