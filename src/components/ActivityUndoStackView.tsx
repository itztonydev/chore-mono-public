import React from 'react';
import { Undo2, Layers, Clock, AlertCircle, ArrowDown, ShieldAlert } from 'lucide-react';
import { getEmptyUndoAlert } from '../dsa/sarcasticAlerts';

export interface ActivityStackFrame {
  id: string;
  actionType: 'CREATE_EXPENSE' | 'ROTATE_CHORE' | 'SETTLE_PAYMENT';
  description: string;
  payload: any;
  createdAt: string;
}

interface ActivityUndoStackViewProps {
  stack: ActivityStackFrame[];
  onUndo: () => void;
  onTriggerAlert: (msg: string) => void;
}

export const ActivityUndoStackView: React.FC<ActivityUndoStackViewProps> = ({
  stack,
  onUndo,
  onTriggerAlert,
}) => {
  const handleUndo = () => {
    if (stack.length === 0) {
      onTriggerAlert(getEmptyUndoAlert());
      return;
    }
    onUndo();
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top DSA Context Bar */}
      <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#9ece6a] font-bold uppercase tracking-wider">
                DSA: STACK (LIFO - LAST IN, FIRST OUT)
              </span>
              <span className="text-[#565f89]">|</span>
              <span className="text-[#c0caf5]">O(1) PUSH / POP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white mt-1 uppercase tracking-tight">
              Household Activity & Undo Stack
            </h2>
            <p className="text-xs text-[#9aa5ce] mt-1 max-w-2xl leading-relaxed">
              Every committed state change (chore rotation, expense creation) pushes a snapshot onto <code className="text-[#9ece6a]">ActivityStackLog</code>. Popping triggers reversible, idempotent state rollbacks.
            </p>
          </div>

          <button
            onClick={handleUndo}
            className="flex items-center gap-2 bg-[#f7768e] hover:bg-white text-black font-bold px-4 py-2.5 border border-[#f7768e] transition-none cursor-pointer shadow-brutal-sm-red shrink-0 uppercase"
          >
            <Undo2 className="w-4 h-4" />
            <span>POP & UNDO LAST ACTION</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stack Frames */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7dcfff]" />
              STACK DEPTH: {stack.length} FRAMES
            </span>
            <span className="text-[#565f89]">[TOP OF STACK IS AT THE TOP]</span>
          </div>

          {stack.length === 0 ? (
            <div className="bg-[#16161E] border-2 border-dashed border-[#565f89] p-12 text-center">
              <Layers className="w-8 h-8 text-[#565f89] mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm">UNDO STACK IS CURRENTLY EMPTY</h4>
              <p className="text-[#9aa5ce] mt-1 max-w-sm mx-auto">
                Any chore rotations or expense creations will push a state snapshot frame here.
              </p>
              <button
                onClick={() => onTriggerAlert(getEmptyUndoAlert())}
                className="mt-4 px-3 py-1.5 bg-black border border-[#f7768e] text-[#f7768e] hover:bg-[#f7768e] hover:text-black font-bold uppercase cursor-pointer"
              >
                TEST POP EMPTY STACK (SARCASTIC ALERT)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stack.map((frame, index) => {
                const isTop = index === 0;

                return (
                  <div
                    key={frame.id}
                    className={`p-4 border-2 transition-none relative ${
                      isTop
                        ? 'bg-black border-[#7dcfff] shadow-brutal-sm-cyan'
                        : 'bg-[#16161E] border-[#565f89]'
                    }`}
                  >
                    {isTop && (
                      <div className="absolute top-0 right-0 bg-[#7dcfff] text-black text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                        TOP OF STACK (TOS)
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`font-bold px-1.5 py-0.5 border text-[10px] ${
                              frame.actionType === 'ROTATE_CHORE'
                                ? 'border-[#9ece6a] text-[#9ece6a]'
                                : frame.actionType === 'CREATE_EXPENSE'
                                ? 'border-[#7dcfff] text-[#7dcfff]'
                                : 'border-[#bb9af7] text-[#bb9af7]'
                            }`}
                          >
                            {frame.actionType}
                          </span>
                          <span className="text-[#565f89]">[LIFO-{stack.length - 1 - index}]</span>
                        </div>

                        <h4 className="font-sans font-bold text-white text-sm">{frame.description}</h4>

                        {/* Payload Inspection */}
                        <div className="mt-2.5 bg-black p-2.5 border border-[#565f89]">
                          <div className="text-[9px] text-[#565f89] uppercase tracking-wider mb-1">
                            SNAPSHOT PAYLOAD:
                          </div>
                          <pre className="text-[11px] text-[#c0caf5] overflow-x-auto leading-relaxed">
                            {JSON.stringify(frame.payload, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-[#565f89] flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {new Date(frame.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Stack Specs */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
            <h3 className="text-white font-bold uppercase mb-2">STACK OPERATIONS CONTRACT</h3>
            <p className="text-[#9aa5ce] leading-relaxed mb-4">
              Mirrors the SQLite <code className="text-[#7dcfff]">activity_stack_logs</code> table.
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-black border border-[#565f89]">
                <div className="text-[#7dcfff] font-bold">push(action, payload)</div>
                <p className="text-[#9aa5ce] text-[11px] mt-0.5">
                  Appends mutation snapshot with millisecond UUIDv7 identifier.
                </p>
              </div>

              <div className="p-3 bg-black border border-[#565f89]">
                <div className="text-[#9ece6a] font-bold">pop() -&gt; StackFrame</div>
                <p className="text-[#9aa5ce] text-[11px] mt-0.5">
                  Retrieves top record and executes reversing database mutation.
                </p>
              </div>

              <div className="p-3 bg-black border border-[#565f89]">
                <div className="text-[#bb9af7] font-bold">peek() -&gt; StackFrame</div>
                <p className="text-[#9aa5ce] text-[11px] mt-0.5">
                  Inspects active TOS without mutating stack depth.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#24283b] text-[10px] text-[#565f89]">
              UNDERFLOW DEFENSE: Popping from an empty stack is safely intercepted by the Sarcastic Alert System.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
