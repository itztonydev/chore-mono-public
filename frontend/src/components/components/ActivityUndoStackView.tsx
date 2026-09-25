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
    <div className="space-y-6">
      {/* Top DSA Context Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                DSA: Stack (LIFO - Last In, First Out)
              </span>
              <span className="text-xs text-zinc-400 font-mono">Complexity: O(1) Push / Pop</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Household Activity & Undo Stack</h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Every state modification (chore rotations, expense entries) is pushed onto the persistent{' '}
              <code className="text-violet-400 font-mono text-xs">ActivityStackLog</code>. Pops reverse state mutations with idempotency.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-violet-600/20 transition active:scale-95"
            >
              <Undo2 className="w-4 h-4" />
              Pop & Undo Last Action
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stack Frames Visualizer */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              Stack State: {stack.length} Elements
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Top of Stack is at the top</span>
          </div>

          {stack.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-12 text-center">
              <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-white">Undo Stack is Currently Empty</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Any new chore rotations or expense entries you commit will push a new snapshot frame onto the stack.
              </p>
              <button
                onClick={() => onTriggerAlert(getEmptyUndoAlert())}
                className="mt-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono border border-zinc-700 transition"
              >
                Test Pop on Empty Stack (Sarcastic Alert)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stack.map((frame, index) => {
                const isTop = index === 0;

                return (
                  <div
                    key={frame.id}
                    className={`p-5 rounded-2xl border transition relative overflow-hidden ${
                      isTop
                        ? 'bg-zinc-900/90 border-violet-500/60 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/60'
                    }`}
                  >
                    {isTop && (
                      <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-xl uppercase tracking-widest font-mono">
                        TOP OF STACK (TOS)
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                              frame.actionType === 'ROTATE_CHORE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : frame.actionType === 'CREATE_EXPENSE'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {frame.actionType}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            Depth: [LIFO-{stack.length - 1 - index}]
                          </span>
                        </div>

                        <h4 className="font-semibold text-white text-base mt-2">{frame.description}</h4>

                        {/* Payload Inspection */}
                        <div className="mt-3 bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80">
                          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                            Snapshot Payload:
                          </div>
                          <pre className="text-xs font-mono text-zinc-300 overflow-x-auto">
                            {JSON.stringify(frame.payload, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 justify-end">
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

        {/* Right Column: Stack Data Structure Guide */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Stack Operations Contract</h3>
            <p className="text-xs text-zinc-400">
              The Activity Stack mirrors the database table <code className="text-violet-400 font-mono text-xs">activity_stack_logs</code>.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-mono text-violet-400 font-bold">push(action, payload)</span>
                <p className="text-zinc-400 mt-1">
                  Appends a transaction log entry with UUIDv7 ID and action payload snapshot.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-mono text-violet-400 font-bold">pop() -&gt; StackFrame</span>
                <p className="text-zinc-400 mt-1">
                  Retrieves and deletes the top snapshot, executing the inverse rollback operation on the database.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-mono text-violet-400 font-bold">peek() -&gt; StackFrame</span>
                <p className="text-zinc-400 mt-1">
                  Inspects the active TOS without mutating stack depth.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500">
              💡 <strong>Underflow Protection:</strong> Calling pop on an empty stack is safely intercepted by the Sarcastic Alert System.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
