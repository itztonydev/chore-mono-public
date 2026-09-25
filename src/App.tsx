import React, { useState } from 'react';
import {
  RotateCw,
  DollarSign,
  Layers,
  Key,
  Terminal,
  FileText,
  Code2,
  Undo2,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Home,
  Users,
  Menu,
  X,
  ChevronRight,
  Info,
  Activity,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';

import {
  INITIAL_ROOMMATES,
  INITIAL_CHORES,
  INITIAL_EXPENSES,
  INITIAL_HOUSEHOLD_ID,
  UserData,
  ChoreData,
} from './data/mockInitialData';
import { ExpenseRecord, DebtSimplificationEngineTS } from './dsa/graphDebtSimplifier';
import { ChoreCircularQueueTS } from './dsa/circularQueue';
import { ActivityStackFrame, ActivityUndoStackView } from './components/ActivityUndoStackView';
import { ChoreRouletteView } from './components/ChoreRouletteView';
import { ExpenseLedgerView } from './components/ExpenseLedgerView';
import { AuthCryptoStudio } from './components/AuthCryptoStudio';
import { ApiExplorerView } from './components/ApiExplorerView';
import { SwaggerDocsView } from './components/SwaggerDocsView';
import { CodebaseExplorerView } from './components/CodebaseExplorerView';
import { generateUUIDv7 } from './dsa/uuid7';
import {
  getPrematureAlert,
  getInvalidExpenseAlert,
  getEmptyUndoAlert,
} from './dsa/sarcasticAlerts';

type PageTab = 'chores' | 'expenses' | 'stack' | 'auth' | 'api' | 'docs' | 'code';

export default function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('chores');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core application state synchronized with FastAPI backend architecture
  const [roommates, setRoommates] = useState<UserData[]>(INITIAL_ROOMMATES);
  const [chores, setChores] = useState<ChoreData[]>(INITIAL_CHORES);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);

  // Initial Activity Stack (LIFO) mirroring recent backend activity logs
  const [activityStack, setActivityStack] = useState<ActivityStackFrame[]>([
    {
      id: generateUUIDv7(),
      actionType: 'CREATE_EXPENSE',
      description: 'Logged $40.00: Target Cleaning Supplies & Paper Towels',
      payload: {
        amount: 40.0,
        payerId: INITIAL_ROOMMATES[2].id,
        description: 'Target Cleaning Supplies & Paper Towels',
      },
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: generateUUIDv7(),
      actionType: 'CREATE_EXPENSE',
      description: 'Logged $60.00: Gigabit Fiber Internet Bill',
      payload: {
        amount: 60.0,
        payerId: INITIAL_ROOMMATES[1].id,
        description: 'Gigabit Fiber Internet Bill',
      },
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    {
      id: generateUUIDv7(),
      actionType: 'ROTATE_CHORE',
      description: 'Rotated "Kitchen Dishes & Sink Sanitization" to Alice Chen',
      payload: {
        choreId: INITIAL_CHORES[0].id,
        prevAssigneeId: INITIAL_ROOMMATES[3].id,
        newAssigneeId: INITIAL_ROOMMATES[0].id,
      },
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    },
  ]);

  // Sarcastic Toast Alert State
  const [sarcasticToast, setSarcasticToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSarcasticToast(msg);
  };

  const dismissToast = () => {
    setSarcasticToast(null);
  };

  // Chore rotation handler using Circular Queue
  const handleRotateChore = (choreId: string, completed: boolean, skipTurn: boolean) => {
    const targetChore = chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    const memberIds = roommates.map((r) => r.id);
    const currIndex = memberIds.indexOf(targetChore.currentAssigneeId);
    const queue = new ChoreCircularQueueTS(memberIds, currIndex >= 0 ? currIndex : 0);

    const prevAssigneeId = targetChore.currentAssigneeId;
    const { newAssignee } = queue.rotateForward();
    const nextAssigneeId = newAssignee || memberIds[0];

    const prevUser = roommates.find((r) => r.id === prevAssigneeId);
    const nextUser = roommates.find((r) => r.id === nextAssigneeId);

    // Update chore in state
    setChores((prev) =>
      prev.map((c) =>
        c.id === choreId
          ? {
              ...c,
              currentAssigneeId: nextAssigneeId,
              turnCount: (c.turnCount || 0) + 1,
            }
          : c
      )
    );

    // Push action onto Activity Stack (LIFO)
    const newFrame: ActivityStackFrame = {
      id: generateUUIDv7(),
      actionType: 'ROTATE_CHORE',
      description: `Turn rotation: "${targetChore.title}" handed off from ${prevUser?.fullName || 'Roommate'} to ${nextUser?.fullName || 'Next'}`,
      payload: {
        choreId,
        prevAssigneeId,
        newAssigneeId: nextAssigneeId,
        choreTitle: targetChore.title,
      },
      createdAt: new Date().toISOString(),
    };
    setActivityStack((prev) => [newFrame, ...prev]);

    // Handle sarcastic alerts
    if (skipTurn) {
      triggerToast(
        getPrematureAlert(
          targetChore.title,
          prevUser?.fullName || 'Roommate'
        )
      );
    } else {
      triggerToast(
        `🎯 [Queue Pointer Shift] Rotated "${targetChore.title}" -> ${nextUser?.fullName || 'Next Roommate'}. Turn saved to LIFO stack!`
      );
    }
  };

  // Add new chore
  const handleAddChore = (title: string, description: string) => {
    const newChore: ChoreData = {
      id: generateUUIDv7(),
      householdId: INITIAL_HOUSEHOLD_ID,
      title,
      description,
      currentAssigneeId: roommates[0].id,
      turnCount: 0,
      createdAt: new Date().toISOString(),
    };

    setChores((prev) => [newChore, ...prev]);

    const newFrame: ActivityStackFrame = {
      id: generateUUIDv7(),
      actionType: 'ROTATE_CHORE',
      description: `Created new chore: "${title}" assigned to ${roommates[0].fullName}`,
      payload: { choreId: newChore.id, title },
      createdAt: new Date().toISOString(),
    };
    setActivityStack((prev) => [newFrame, ...prev]);

    triggerToast(`✨ [Chore Added] "${title}" enrolled into circular rotation queue.`);
  };

  // Add shared expense
  const handleAddExpense = (
    payerId: string,
    amount: number,
    description: string,
    splits: { userId: string; splitAmount: number }[]
  ) => {
    const payer = roommates.find((r) => r.id === payerId);
    const newExp: ExpenseRecord = {
      id: generateUUIDv7(),
      payerId,
      amount,
      description,
      splits,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExp, ...prev]);

    // Push onto Activity Stack (LIFO)
    const newFrame: ActivityStackFrame = {
      id: generateUUIDv7(),
      actionType: 'CREATE_EXPENSE',
      description: `Expense logged: $${amount.toFixed(2)} for "${description}" by ${payer?.fullName || 'Roommate'}`,
      payload: { expenseId: newExp.id, amount, description, payerId },
      createdAt: new Date().toISOString(),
    };
    setActivityStack((prev) => [newFrame, ...prev]);

    triggerToast(
      `💸 [Expense Ledger] Added $${amount.toFixed(2)} "${description}". Directed graph debts recomputed!`
    );
  };

  // Stack Undo Engine (LIFO reverse operation)
  const handleUndo = () => {
    if (activityStack.length === 0) {
      triggerToast(getEmptyUndoAlert());
      return;
    }

    const [topFrame, ...remainingStack] = activityStack;
    setActivityStack(remainingStack);

    if (topFrame.actionType === 'CREATE_EXPENSE') {
      const expId = topFrame.payload?.expenseId;
      if (expId) {
        setExpenses((prev) => prev.filter((e) => e.id !== expId));
      } else {
        // Fallback pop newest expense
        setExpenses((prev) => prev.slice(1));
      }
      triggerToast(
        `↩️ [Stack Pop O(1)] Undid expense: "${topFrame.payload?.description || 'Recent expense'}". Graph balances restored!`
      );
    } else if (topFrame.actionType === 'ROTATE_CHORE') {
      const choreId = topFrame.payload?.choreId;
      const prevAssigneeId = topFrame.payload?.prevAssigneeId;
      if (choreId && prevAssigneeId) {
        setChores((prev) =>
          prev.map((c) =>
            c.id === choreId
              ? {
                  ...c,
                  currentAssigneeId: prevAssigneeId,
                  turnCount: Math.max(0, (c.turnCount || 1) - 1),
                }
              : c
          )
        );
      }
      triggerToast(
        `↩️ [Stack Pop O(1)] Reversed chore rotation! Restored previous circular queue assignee.`
      );
    } else {
      triggerToast(`↩️ [Stack Pop O(1)] Undid last action: ${topFrame.description}`);
    }
  };

  // Update roommate info (e.g. auth credentials)
  const handleUpdateRoommate = (updated: UserData) => {
    setRoommates((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    triggerToast(`🔐 Updated credentials & authentication profiles for ${updated.fullName}`);
  };

  // Navigation tabs definition
  const navigationItems = [
    {
      id: 'chores' as PageTab,
      label: 'Chore Roulette',
      badge: 'Circular Queue',
      icon: RotateCw,
      color: '#7dcfff',
    },
    {
      id: 'expenses' as PageTab,
      label: 'Expense Ledger',
      badge: 'Min-Cash-Flow',
      icon: DollarSign,
      color: '#9ece6a',
    },
    {
      id: 'stack' as PageTab,
      label: 'Activity & Undo',
      badge: `LIFO [${activityStack.length}]`,
      icon: Layers,
      color: '#bb9af7',
    },
    {
      id: 'auth' as PageTab,
      label: 'Auth & Crypto',
      badge: 'Ed25519 + OAuth',
      icon: Key,
      color: '#f7768e',
    },
    {
      id: 'api' as PageTab,
      label: 'API Explorer',
      badge: 'Live Client',
      icon: Terminal,
      color: '#e0af68',
    },
    {
      id: 'docs' as PageTab,
      label: 'Swagger / OpenAPI',
      badge: 'API v1.0.0',
      icon: FileText,
      color: '#7aa2f7',
    },
    {
      id: 'code' as PageTab,
      label: 'Backend Codebase',
      badge: 'Python / FastAPI',
      icon: Code2,
      color: '#2ac3de',
    },
  ];

  // Quick stats calculations
  const totalExpenseVolume = expenses.reduce((sum, e) => sum + e.amount, 0);
  const graphResult = DebtSimplificationEngineTS.simplifyDebts(
    expenses,
    roommates.map((r) => r.id)
  );

  return (
    <div className="min-h-screen bg-[#000000] text-[#c0caf5] font-sans selection:bg-[#7dcfff] selection:text-black">
      {/* Top Telemetry & Architecture Header */}
      <header className="border-b-2 border-[#565f89] bg-[#16161E] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Backend Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7dcfff] text-black font-black flex items-center justify-center border-2 border-white shadow-brutal-cyan text-xl">
              🎲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base md:text-lg tracking-wider uppercase">
                  Roommate Chore & Expense Roulette
                </span>
                <span className="bg-[#9ece6a] text-black text-[10px] font-mono font-bold px-1.5 py-0.5 uppercase">
                  FastAPI v1.0.0
                </span>
              </div>
              <p className="text-xs text-[#7dcfff] font-mono flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#9ece6a] animate-pulse"></span>
                DSA Engine Running // Apartment 4B Communal Node
              </p>
            </div>
          </div>

          {/* Top Quick Actions Bar: Stats + Undo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-mono text-xs">
            <div className="hidden lg:flex items-center gap-2 border border-[#24283b] bg-[#000000] px-3 py-1.5">
              <span className="text-[#565f89]">EXPENSES:</span>
              <span className="text-white font-bold">${totalExpenseVolume.toFixed(2)}</span>
              <span className="text-[#565f89]">|</span>
              <span className="text-[#9ece6a] font-bold">
                -{graphResult.efficiencyGainPercent}% TX SAVED
              </span>
            </div>

            {/* Global Undo Button */}
            <button
              onClick={handleUndo}
              disabled={activityStack.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-bold transition-all cursor-pointer ${
                activityStack.length > 0
                  ? 'border-[#bb9af7] bg-[#bb9af7]/15 text-[#bb9af7] hover:bg-[#bb9af7] hover:text-black shadow-brutal-sm-purple active:translate-x-0.5 active:translate-y-0.5'
                  : 'border-[#565f89] text-[#565f89] opacity-50 cursor-not-allowed'
              }`}
              title="Pop top frame from LIFO stack to reverse last mutation"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>POP UNDO STACK</span>
              <span className="bg-[#000000] text-white px-1.5 py-0.2 border border-current font-bold text-[10px]">
                {activityStack.length}
              </span>
            </button>

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 border-2 border-[#565f89] bg-[#000000] text-white"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Global Multipage Tabs Navigation Bar */}
        <div className="border-t border-[#24283b] bg-[#0a0a0f]">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1 sm:space-x-2 py-1.5 font-mono text-xs whitespace-nowrap">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 border-2 transition-all cursor-pointer uppercase ${
                      isActive
                        ? 'border-[#7dcfff] bg-[#7dcfff] text-black font-extrabold shadow-brutal-cyan'
                        : 'border-[#24283b] bg-[#16161E] text-[#9aa5ce] hover:border-[#565f89] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 border ${
                        isActive
                          ? 'border-black bg-black text-[#7dcfff]'
                          : 'border-[#565f89] bg-[#000000] text-[#7dcfff]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Sarcastic Alert Notification Banner */}
      {sarcasticToast && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="border-2 border-[#f7768e] bg-[#241724] p-3 sm:p-4 text-white flex items-start justify-between gap-3 shadow-brutal-red font-mono text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#f7768e] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#f7768e] uppercase mr-2 tracking-wider">
                  [SYSTEM SARCASM ENGINE]
                </span>
                <span className="text-[#c0caf5]">{sarcasticToast}</span>
              </div>
            </div>
            <button
              onClick={dismissToast}
              className="text-[#9aa5ce] hover:text-white p-1 hover:bg-[#f7768e]/20 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Roommates Active Status Ribbon */}
      <section className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <div className="border border-[#24283b] bg-[#101017] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#7dcfff]" />
            <span className="text-white font-bold">APARTMENT 4B ROSTER:</span>
            <span className="text-[#565f89] hidden sm:inline">|</span>
            <span className="text-[#7dcfff] hidden sm:inline">CIRCULAR QUEUE RING</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {roommates.map((r, idx) => {
              const assignedChoreCount = chores.filter((c) => c.currentAssigneeId === r.id).length;
              const netBal = graphResult.netBalances[r.id] || 0;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-1.5 border border-[#24283b] bg-[#16161E] px-2.5 py-1 text-[11px]"
                >
                  <span className={`w-2 h-2 rounded-full ${r.avatarColor}`}></span>
                  <span className="text-white font-bold">{r.fullName.split(' ')[0]}</span>
                  <span className="text-[#565f89]">#{idx}</span>
                  <span className="bg-[#24283b] text-[#7dcfff] px-1 text-[10px]">
                    {assignedChoreCount} chores
                  </span>
                  <span
                    className={`font-mono text-[10px] ${
                      netBal > 0
                        ? 'text-[#9ece6a]'
                        : netBal < 0
                        ? 'text-[#f7768e]'
                        : 'text-[#565f89]'
                    }`}
                  >
                    {netBal > 0 ? `+$${netBal.toFixed(1)}` : netBal < 0 ? `-$${Math.abs(netBal).toFixed(1)}` : '$0'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Multipage Viewport Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'chores' && (
          <div className="space-y-6">
            <ChoreRouletteView
              roommates={roommates}
              chores={chores}
              onRotateChore={handleRotateChore}
              onAddChore={handleAddChore}
              sarcasticToast={null}
              onDismissToast={dismissToast}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <ExpenseLedgerView
              roommates={roommates}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onTriggerAlert={triggerToast}
            />
          </div>
        )}

        {activeTab === 'stack' && (
          <div className="space-y-6">
            <ActivityUndoStackView
              stack={activityStack}
              onUndo={handleUndo}
              onTriggerAlert={triggerToast}
            />
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-6">
            <AuthCryptoStudio
              roommates={roommates}
              onUpdateRoommate={handleUpdateRoommate}
            />
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <ApiExplorerView
              roommates={roommates}
              chores={chores}
              expenses={expenses}
            />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <SwaggerDocsView roommates={roommates} chores={chores} />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <CodebaseExplorerView />
          </div>
        )}
      </main>

      {/* Brutalist Architecture Footer */}
      <footer className="w-full border-t-2 border-[#565f89] bg-[#16161E] mt-16 font-mono text-xs">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="font-extrabold text-white text-sm uppercase mb-2">
              ROOMMATE ROULETTE BACKEND
            </div>
            <p className="text-[11px] text-[#9aa5ce] leading-relaxed">
              Production-ready FastAPI backend and interactive DSA visualizer implementing circular
              queues, min-cash-flow graph reduction, LIFO undo engines, and cryptographic authentication.
            </p>
          </div>

          <div>
            <div className="font-bold text-white text-xs uppercase mb-2">
              DATA STRUCTURES & ALGORITHMS
            </div>
            <ul className="text-[11px] text-[#7dcfff] space-y-1">
              <li>• Circular Queue (Ring Buffer) O(1) turn shifts</li>
              <li>• Hash Table O(1) balance lookups</li>
              <li>• Directed Graph Greedy Debt Simplifier</li>
              <li>• LIFO Activity & Undo Stack</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white text-xs uppercase mb-2">
              SECURITY & STANDARDS
            </div>
            <ul className="text-[11px] text-[#bb9af7] space-y-1">
              <li>• RFC 9562 UUIDv7 Monotonic IDs</li>
              <li>• Ed25519 Cryptographic Signatures</li>
              <li>• Google OAuth2 ID Token Verification</li>
              <li>• OpenAPI 3.1 & JWT Bearer Auth</li>
            </ul>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="font-bold text-white text-xs uppercase mb-2">
                FASTAPI APP STATUS
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-black border border-[#9ece6a] text-[#9ece6a] text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#9ece6a] animate-pulse"></span>
                <span>SYSTEM HEALTHY: 200 OK</span>
              </div>
            </div>
            <div className="text-[10px] text-[#565f89] mt-3">
              PORT: 3000 // PROTOCOL: HTTP/2 // THEME: TOKYO NIGHT BRUTALIST
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
