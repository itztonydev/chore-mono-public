import React, { useState } from 'react';
import { RotateCw, AlertTriangle, CheckCircle2, Plus, ArrowRight, ShieldAlert, Dice5, History } from 'lucide-react';
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
    }, 400);
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
        <div className="border-2 border-[#f7768e] bg-[#16161E] p-4 flex items-start justify-between gap-4 shadow-brutal-red">
          <div className="flex items-start gap-3">
            <div className="p-2 border border-[#f7768e] bg-black text-[#f7768e]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#f7768e] font-bold">
                SARCASTIC ALERT SYSTEM // TURN VETO
              </div>
              <p className="text-sm font-sans text-white font-medium mt-0.5">{sarcasticToast}</p>
            </div>
          </div>
          <button
            onClick={onDismissToast}
            className="px-3 py-1 text-xs font-mono font-bold bg-black text-[#9aa5ce] hover:text-white border border-[#565f89] hover:border-[#f7768e] cursor-pointer"
          >
            ACKNOWLEDGE
          </button>
        </div>
      )}

      {/* Top Header & Context */}
      <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#7dcfff] font-bold uppercase tracking-wider">
                DSA: CIRCULAR QUEUE (RING BUFFER)
              </span>
              <span className="text-[#565f89]">|</span>
              <span className="text-[#9ece6a] font-mono">O(1) DETERMINISTIC SHIFT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 uppercase tracking-tight">
              Chore Roulette & Duty Rotation Ring
            </h2>
            <p className="text-xs font-mono text-[#9aa5ce] mt-1 max-w-2xl leading-relaxed">
              Maintains mathematical fairness across apartment roommates. Every duty transition advances the pointer by <code className="text-[#7dcfff] font-bold">(index + 1) % N</code>, preventing subjective arguments.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#7dcfff] hover:bg-white text-black font-mono font-bold text-xs px-4 py-2.5 border border-[#7dcfff] transition-none cursor-pointer shadow-brutal-sm-cyan shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ REGISTER NEW CHORE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chores List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs px-1">
            <span className="text-white font-bold uppercase tracking-wider">
              HOUSEHOLD DUTIES ({chores.length})
            </span>
            <span className="text-[#565f89]">[SELECT TO TARGET]</span>
          </div>

          <div className="space-y-2">
            {chores.map((chore) => {
              const isSelected = chore.id === selectedChore?.id;
              const assignee = roommates.find((r) => r.id === chore.currentAssigneeId);

              return (
                <div
                  key={chore.id}
                  onClick={() => setSelectedChoreId(chore.id)}
                  className={`p-3.5 border-2 text-left cursor-pointer transition-none select-none ${
                    isSelected
                      ? 'bg-black border-[#7dcfff] shadow-brutal-sm-cyan'
                      : 'bg-[#16161E] border-[#565f89] hover:border-[#c0caf5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-sans font-bold text-white text-sm tracking-tight">{chore.title}</h4>
                      <p className="text-xs font-mono text-[#9aa5ce] mt-1 line-clamp-2">{chore.description}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#bb9af7] border border-[#565f89] bg-black px-1.5 py-0.5 shrink-0">
                      TURN #{chore.turnCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#24283b] text-xs font-mono">
                    <span className="text-[#565f89]">ON_DUTY:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 ${assignee?.avatarColor || 'bg-zinc-500'}`} />
                      <span className="font-bold text-[#c0caf5]">{assignee?.fullName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Circular Queue Ring Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border-2 border-[#565f89] bg-[#16161E] p-6">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-3 mb-6 font-mono text-xs">
              <div>
                <span className="text-[#7dcfff] font-bold uppercase tracking-wider block text-[11px]">
                  TARGET: {selectedChore?.title}
                </span>
                <span className="text-white font-bold text-sm">CIRCULAR BUFFER RING VISUALIZER</span>
              </div>
              <div className="text-right">
                <span className="text-[#9aa5ce]">
                  INDEX: <strong className="text-[#9ece6a]">{activeIndex}</strong> / {roommates.length}
                </span>
              </div>
            </div>

            {/* Circular Ring Layout */}
            <div className="relative py-12 flex items-center justify-center">
              <div className="w-72 h-72 border-2 border-dashed border-[#565f89] flex items-center justify-center relative">
                {/* Center Hub Display */}
                <div className="text-center p-4 bg-black border-2 border-[#7dcfff] shadow-brutal-cyan max-w-[190px] font-mono">
                  <span className="text-[10px] uppercase tracking-widest text-[#9aa5ce] font-bold block">
                    ACTIVE ASSIGNEE
                  </span>
                  <div className="font-sans text-base font-bold text-white truncate mt-1">
                    {activeAssignee?.fullName}
                  </div>
                  <div className="text-[11px] text-[#7dcfff] font-bold mt-1.5 flex items-center justify-center gap-1">
                    <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-[#7dcfff]' : ''}`} />
                    <span>NEXT: {nextAssignee?.fullName.split(' ')[0]}</span>
                  </div>
                </div>

                {/* Circular Queue Node Points */}
                {roommates.map((rm, idx) => {
                  const total = roommates.length;
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                  const radius = 135;
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
                      className="absolute flex flex-col items-center justify-center"
                    >
                      <div
                        className={`w-11 h-11 flex items-center justify-center border-2 transition-none font-mono font-bold text-xs ${
                          isActive
                            ? 'border-[#7dcfff] bg-[#7dcfff] text-black shadow-brutal-sm-cyan scale-110 z-20'
                            : isNext
                            ? 'border-[#bb9af7] bg-black text-[#bb9af7]'
                            : 'border-[#565f89] bg-black text-[#9aa5ce]'
                        }`}
                      >
                        {rm.fullName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="mt-1 text-center font-mono">
                        <span
                          className={`text-[10px] font-bold px-1 block ${
                            isActive ? 'text-[#7dcfff]' : 'text-[#9aa5ce]'
                          }`}
                        >
                          {rm.fullName.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-[#565f89]">#{rm.turnOrderIndex}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Circular Queue Order Vector */}
            <div className="mt-4 bg-black p-3.5 border-2 border-[#565f89] font-mono text-xs">
              <div className="flex items-center justify-between text-[#9aa5ce] mb-2 text-[11px]">
                <span className="font-bold text-white">CIRCULAR QUEUE SEQUENCE:</span>
                <span>HEAD: [0] • TAIL: [{roommates.length - 1}]</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {roommates.map((rm, idx) => (
                  <React.Fragment key={rm.id}>
                    <div
                      className={`px-2.5 py-1 text-xs font-mono flex items-center gap-1.5 shrink-0 border ${
                        idx === activeIndex
                          ? 'bg-[#7dcfff] text-black border-[#7dcfff] font-bold'
                          : 'bg-[#16161E] text-[#9aa5ce] border-[#565f89]'
                      }`}
                    >
                      <span>{rm.fullName}</span>
                      {idx === activeIndex && (
                        <span className="text-[9px] bg-black text-white px-1">ACTIVE</span>
                      )}
                    </div>
                    {idx < roommates.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-[#565f89] shrink-0" />
                    )}
                  </React.Fragment>
                ))}
                <span className="text-[#565f89] text-[11px] shrink-0">↺ (Wraps)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              <button
                onClick={() => handleRotate(true, false)}
                disabled={isRotating}
                className="flex items-center justify-center gap-2 bg-[#9ece6a] hover:bg-white text-black font-bold py-3 px-4 border border-[#9ece6a] transition-none cursor-pointer shadow-brutal-sm-green text-xs uppercase"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>DUTY COMPLETED (ROTATE)</span>
              </button>

              <button
                onClick={() => handleRotate(false, true)}
                disabled={isRotating}
                className="flex items-center justify-center gap-2 bg-[#16161E] hover:bg-black text-[#f7768e] border-2 border-[#f7768e] font-bold py-3 px-4 transition-none cursor-pointer text-xs uppercase hover:shadow-brutal-red"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>SKIP TURN (TRIGGER SARCASM)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Chore Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#16161E] border-4 border-[#7dcfff] p-6 max-w-md w-full shadow-brutal-lg-cyan text-left font-mono">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-2 mb-4">
              <h3 className="text-base font-bold text-white uppercase">ADD NEW HOUSEHOLD DUTY</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#9aa5ce] hover:text-[#f7768e] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChore} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7dcfff] mb-1 font-bold">
                  DUTY TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balcony Sweeping & Plant Watering"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black border border-[#565f89] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7dcfff] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7dcfff] mb-1 font-bold">
                  DESCRIPTION / SPECIFICATION
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sweep leaves, water ferns, wipe glass railing."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-black border border-[#565f89] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7dcfff] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-[#9aa5ce] hover:text-white border border-[#565f89] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7dcfff] hover:bg-white text-black font-bold text-xs uppercase cursor-pointer shadow-brutal-sm-cyan"
                >
                  COMMIT CHORE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
