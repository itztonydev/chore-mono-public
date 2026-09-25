import React, { useState } from 'react';
import { RotateCw, AlertTriangle, CheckCircle2, Plus, Sparkles, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { UserData, ChoreData } from '../data/mockInitialData';
import { ChoreCircularQueueTS } from '../dsa/circularQueue';
import { getPrematureAlert } from '../dsa/sarcasticAlerts';

interface ChoreRouletteViewProps {
  roommates: UserData[];
  chores: ChoreData[];
  onRotateChore: (choreId: string, completed: boolean, skipTurn: boolean) => void;
  onAddChore: (title: string, description: string) => void;
  sarcasticToast: string | null;
  onDismissToast: () => void;
}

export const ChoreRouletteView: React.FC<ChoreRouletteViewProps> = ({
  roommates,
  chores,
  onRotateChore,
  onAddChore,
  sarcasticToast,
  onDismissToast,
}) => {
  const [selectedChoreId, setSelectedChoreId] = useState<string>(chores[0]?.id || '');
  const [isRotating, setIsRotating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const selectedChore = chores.find((c) => c.id === selectedChoreId) || chores[0];
  const activeAssignee = roommates.find((r) => r.id === selectedChore?.currentAssigneeId);

  // Circular Queue helper
  const memberIds = roommates.map((r) => r.id);
  const activeIndex = selectedChore ? memberIds.indexOf(selectedChore.currentAssigneeId) : 0;
  const circularQueue = new ChoreCircularQueueTS(memberIds, activeIndex);
  const nextMemberId = circularQueue.peekNext();
  const nextAssignee = roommates.find((r) => r.id === nextMemberId);

  const handleRotate = (completed: boolean, skipTurn: boolean) => {
    if (!selectedChore) return;
    setIsRotating(true);
    setTimeout(() => {
      onRotateChore(selectedChore.id, completed, skipTurn);
      setIsRotating(false);
    }, 450);
  };

  const handleCreateChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddChore(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Sarcastic Alert Banner */}
      {sarcasticToast && (
        <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-4 shadow-lg flex items-start justify-between gap-3 animate-bounce">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-300 text-sm uppercase tracking-wider">
                Sarcastic Alert System Triggered
              </h4>
              <p className="text-zinc-200 text-sm font-medium mt-0.5">{sarcasticToast}</p>
            </div>
          </div>
          <button
            onClick={onDismissToast}
            className="text-zinc-400 hover:text-zinc-200 px-2.5 py-1 text-xs bg-zinc-800/80 rounded-lg"
          >
            Acknowledge Shame
          </button>
        </div>
      )}

      {/* Top Header & Context */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                DSA: Circular Queue (Ring Buffer)
              </span>
              <span className="text-xs text-zinc-400 font-mono">Complexity: O(1) Turn Shift</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Household Chore Rotation Roulette</h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Implements a deterministic circular queue ring. Every turn shift advances the pointer by{' '}
              <code className="text-emerald-400 font-mono text-xs">(index + 1) % N</code>, preventing roommate chore disputes.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm border border-zinc-700 transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Add New Chore
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chores List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Active Household Duties ({chores.length})
            </h3>
            <span className="text-xs text-zinc-500">Select to inspect roulette wheel</span>
          </div>

          <div className="space-y-2.5">
            {chores.map((chore) => {
              const isSelected = chore.id === selectedChore?.id;
              const assignee = roommates.find((r) => r.id === chore.currentAssigneeId);

              return (
                <div
                  key={chore.id}
                  onClick={() => setSelectedChoreId(chore.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-zinc-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-white text-base">{chore.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{chore.description}</p>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg shrink-0">
                      Turn #{chore.turnCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/60 text-xs">
                    <span className="text-zinc-400">Current Assignee:</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${assignee?.avatarColor || 'bg-zinc-500'}`} />
                      <span className="font-medium text-zinc-200">{assignee?.fullName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Circular Queue Ring Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Active Chore: {selectedChore?.title}
                </span>
                <h3 className="text-lg font-bold text-white">Circular Queue Ring Visualization</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 font-mono">
                  Pointer Index: <strong className="text-emerald-400">{activeIndex}</strong> / {roommates.length}
                </span>
              </div>
            </div>

            {/* Circular Ring Layout */}
            <div className="relative py-8 flex items-center justify-center">
              {/* Circular Ring Background Guide */}
              <div className="w-72 h-72 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center relative">
                {/* Center Hub Display */}
                <div className="text-center p-4 z-10 bg-zinc-950/90 rounded-2xl border border-zinc-800 shadow-2xl max-w-[190px]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    On Duty Now
                  </span>
                  <div className="text-base font-bold text-white truncate mt-0.5">
                    {activeAssignee?.fullName}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center justify-center gap-1">
                    <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin text-emerald-400' : ''}`} />
                    Next: {nextAssignee?.fullName.split(' ')[0]}
                  </div>
                </div>

                {/* Circular Queue Node Points */}
                {roommates.map((rm, idx) => {
                  const total = roommates.length;
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2; // start from top
                  const radius = 130; // distance from center
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isActive = idx === activeIndex;
                  const isNext = rm.id === nextMemberId;

                  return (
                    <div
                      key={rm.id}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className="absolute flex flex-col items-center justify-center transition-all duration-300"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all duration-300 ${
                          isActive
                            ? 'scale-125 border-emerald-400 bg-emerald-500/20 shadow-emerald-500/30 z-20 ring-4 ring-emerald-500/20'
                            : isNext
                            ? 'border-blue-500/70 bg-zinc-900 shadow-blue-500/20'
                            : 'border-zinc-700/80 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${rm.avatarColor}`} />
                      </div>
                      <div className="mt-1 text-center">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-md ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-zinc-400 bg-zinc-950/80'
                          }`}
                        >
                          {rm.fullName.split(' ')[0]}
                        </span>
                        <span className="block text-[9px] font-mono text-zinc-500">
                          Index #{rm.turnOrderIndex}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Circular Queue Queue Order Vector */}
            <div className="mt-4 bg-zinc-950/60 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-semibold text-zinc-300">Circular Buffer Turn Order:</span>
                <span className="font-mono text-[11px] text-zinc-500">
                  Head: [0] • Tail: [{roommates.length - 1}]
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {roommates.map((rm, idx) => (
                  <React.Fragment key={rm.id}>
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 shrink-0 border ${
                        idx === activeIndex
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${rm.avatarColor}`} />
                      {rm.fullName}
                      {idx === activeIndex && (
                        <span className="text-[10px] bg-emerald-500/40 text-emerald-200 px-1.5 py-0.2 rounded">
                          POINTER
                        </span>
                      )}
                    </div>
                    {idx < roommates.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
                <span className="text-zinc-600 text-xs shrink-0 font-mono">↺ Wraps to [0]</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleRotate(true, false)}
                disabled={isRotating}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Duty Completed (Rotate Next)</span>
              </button>

              <button
                onClick={() => handleRotate(false, true)}
                disabled={isRotating}
                className="flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-semibold py-3 px-4 rounded-2xl transition active:scale-95 disabled:opacity-50"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Sneakily Skip Turn (Test Sarcasm)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Chore Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Household Chore</h3>
            <p className="text-xs text-zinc-400 mt-1">
              New chores are automatically registered into the Circular Queue ring.
            </p>

            <form onSubmit={handleCreateChore} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Chore Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balcony Sweeping & Plant Watering"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Description / Specific Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sweep dry leaves, water ferns, wipe glass railing."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Create Chore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
