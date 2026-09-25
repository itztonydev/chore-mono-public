import React, { useState } from 'react';
import { FileCode, Folder, Copy, Check, Terminal, ExternalLink, ShieldAlert } from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  category: 'DSA Engine' | 'Core & Crypto' | 'Models & DB' | 'API Endpoints';
  description: string;
  code: string;
}

const BACKEND_FILES: CodeFile[] = [
  {
    path: '/app/dsa_engines/circular_queue.py',
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
    path: '/app/dsa_engines/graph_debt_simplifier.py',
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
    path: '/app/dsa_engines/activity_stack.py',
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
    path: '/app/core/crypto_ed25519.py',
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
    path: '/app/core/uuid7.py',
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
    path: '/app/models/user.py',
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
  {
    path: '/app/api/v1/endpoints/chores.py',
    name: 'chores.py',
    category: 'API Endpoints',
    description: 'Chore rotation endpoint, circular queue advance, and sarcastic alerts.',
    code: `"""
Chore Management API Endpoints: Circular Queue Rotation & Sarcastic Alert System.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.dsa_engines.circular_queue import ChoreCircularQueue
from app.dsa_engines.sarcastic_alerts import SarcasticAlertSystem
from app.models.chore import Chore
from app.models.household import HouseholdMember

router = APIRouter(prefix="/chores", tags=["Chores & Circular Queue"])

@router.post("/{chore_id}/rotate")
async def rotate_chore(chore_id: str, req: ChoreRotateRequest, db: AsyncSession = Depends(get_db)):
    chore = (await db.execute(select(Chore).where(Chore.id == chore_id))).scalars().first()
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found.")

    members = (await db.execute(select(HouseholdMember).where(HouseholdMember.household_id == chore.household_id).order_by(HouseholdMember.turn_order_index))).scalars().all()
    member_ids = [m.user_id for m in members]

    queue = ChoreCircularQueue(members=member_ids)
    if chore.current_assignee_id in member_ids:
        queue.set_pointer_to_member(chore.current_assignee_id)

    sarcastic_alert = None
    if req.skip_turn or not req.completed:
        sarcastic_alert = SarcasticAlertSystem.get_premature_rotation_alert(chore.title)

    new_assignee_id, new_idx = queue.rotate_forward()
    chore.current_assignee_id = new_assignee_id
    await db.commit()
    return {"rotation_successful": True, "new_assignee_id": new_assignee_id, "sarcastic_alert": sarcastic_alert}`,
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
    <div className="space-y-6">
      {/* Top DSA Context Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                FastAPI + Async SQLAlchemy 2.0 Codebase
              </span>
              <span className="text-xs text-zinc-400 font-mono">Python 3.10+ / Pydantic v2</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Backend Source Code Inspector</h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Inspect the production Python modules created under <code className="text-emerald-400 font-mono text-xs">/app</code>, including the Circular Queue, Directed Graph Simplifier, UUIDv7, and Ed25519 Cryptography.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm border border-zinc-700 transition shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            Copy Source
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1 mb-2">
            Project Architecture ({BACKEND_FILES.length} Files)
          </h3>
          <div className="space-y-2">
            {BACKEND_FILES.map((file) => {
              const isSelected = file.path === selectedFile.path;

              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? 'bg-zinc-800 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-white truncate">
                      <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {file.name}
                    </div>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                      {file.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{file.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Path: {selectedFile.path}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedFile.name}</h3>
              </div>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg">
                Python 3.10
              </span>
            </div>

            <div className="bg-zinc-950 rounded-2xl border border-zinc-800/90 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[550px]">
              <pre className="leading-relaxed whitespace-pre font-mono">
                {selectedFile.code}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
