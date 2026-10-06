import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldAlert,
  X,
} from 'lucide-react';

interface Roommate {
  id: string;
  fullName: string;
  email?: string | null;
  turnOrderIndex: number;
  avatarColor: string;
}

interface Chore {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  currentAssigneeId: string | null;
  currentAssigneeName: string | null;
  createdAt: string;
}

interface HouseholdMemberApi {
  id: string;
  household_id: string;
  user_id: string;
  turn_order_index: number;
  user_full_name?: string | null;
  user_email?: string | null;
}

interface HouseholdResponse {
  id: string;
  name: string;
  created_at: string;
  members: HouseholdMemberApi[];
}

interface ChoreResponse {
  id: string;
  household_id: string;
  title: string;
  description?: string | null;
  current_assignee_id?: string | null;
  current_assignee_name?: string | null;
  created_at: string;
}

interface RotateResponse {
  chore_id: string;
  chore_title: string;
  previous_assignee_id?: string | null;
  previous_assignee_name?: string | null;
  new_assignee_id?: string | null;
  new_assignee_name?: string | null;
  rotation_successful: boolean;
  sarcastic_alert?: string | null;
  queue_state: Record<string, unknown>;
}

interface ChoreRouletteViewProps {
  householdId: string;

  /**
   * JWT returned by /api/v1/auth/login or /api/v1/auth/register.
   *
   * If omitted, the component also checks localStorage for
   * "access_token".
   */
  accessToken?: string;

  /**
   * Optional API URL.
   * Defaults to VITE_API_URL or http://localhost:8000.
   */
  apiBaseUrl?: string;
}

const avatarColors = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
];

const getAvatarColor = (index: number) =>
  avatarColors[index % avatarColors.length];

export const ChoreRouletteView: React.FC<ChoreRouletteViewProps> = ({
  householdId,
  accessToken,
  apiBaseUrl,
}) => {
  const API_BASE_URL =
    apiBaseUrl ||
    import.meta.env["API_BASE_URL"] ||
    'http://localhost:8000';

  const token =
    accessToken ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null);

  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [selectedChoreId, setSelectedChoreId] = useState('');
  const [isRotating, setIsRotating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sarcasticToast, setSarcasticToast] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  /*
   * Central API helper.
   *
   * The backend is responsible for authentication, circular queue
   * rotation, and sarcastic-alert generation.
   */
  const apiRequest = useCallback(
    async <T,>(
      path: string,
      options: RequestInit = {},
    ): Promise<T> => {
      const headers = new Headers(options.headers);

      headers.set('Content-Type', 'application/json');

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let message = `API request failed (${response.status})`;

        try {
          const body = await response.json();

          if (typeof body?.detail === 'string') {
            message = body.detail;
          } else if (Array.isArray(body?.detail)) {
            message = body.detail
              .map((item: { msg?: string }) => item.msg)
              .filter(Boolean)
              .join(', ');
          }
        } catch {
          // Keep the default HTTP error message.
        }

        throw new Error(message);
      }

      return response.json() as Promise<T>;
    },
    [API_BASE_URL, token],
  );

  /*
   * Load household members + chores from the API.
   */
  const loadData = useCallback(async () => {
    if (!householdId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [household, choreResponse] = await Promise.all([
        apiRequest<HouseholdResponse>(
          `/api/v1/households/${householdId}`,
        ),
        apiRequest<ChoreResponse[]>(
          `/api/v1/chores/${householdId}`,
        ),
      ]);

      const members: Roommate[] = (household.members ?? [])
  .slice()
  .sort(
    (a: HouseholdMemberApi, b: HouseholdMemberApi) =>
      a.turn_order_index - b.turn_order_index,
  )
  .map(
    (member: HouseholdMemberApi, index: number): Roommate => ({
      id: member.user_id,
      fullName:
        member.user_full_name ??
        member.user_email ??
        'Unknown roommate',
      email: member.user_email ?? null,
      turnOrderIndex: member.turn_order_index,
      avatarColor: getAvatarColor(index)!,
    }),
  );

      const mappedChores: Chore[] = choreResponse.map((chore) => ({
        id: chore.id,
        householdId: chore.household_id,
        title: chore.title,
        description: chore.description || null,
        currentAssigneeId: chore.current_assignee_id || null,
        currentAssigneeName: chore.current_assignee_name || null,
        createdAt: chore.created_at,
      }));

      setRoommates(members);
      setChores(mappedChores);

      /*
       * Keep the current selection if it still exists.
       * Otherwise select the first chore.
       */
      setSelectedChoreId((current) => {
        if (mappedChores.some((chore) => chore.id === current)) {
          return current;
        }

        return mappedChores[0]?.id || '';
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load household data.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest, householdId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedChore = useMemo(
    () =>
      chores.find((chore) => chore.id === selectedChoreId) ||
      chores[0] ||
      null,
    [chores, selectedChoreId],
  );

  const activeAssignee = useMemo(
    () => roommates.find(
        (roommate) => roommate.id === selectedChore?.currentAssigneeId,
      ),
    [roommates, selectedChore],
  );

  /*
   * IMPORTANT:
   *
   * This is only for displaying the queue.
   * The actual rotation is performed by the backend.
   *
   * We deliberately do NOT instantiate a local CircularQueue.
   */
  const activeIndex = useMemo(() => {
    if (!selectedChore || roommates.length === 0) {
      return -1;
    }

    return roommates.findIndex(
      (roommate) => roommate.id === selectedChore.currentAssigneeId,
    );
  }, [roommates, selectedChore]);

  const nextIndex =
    activeIndex >= 0 && roommates.length > 0
      ? (activeIndex + 1) % roommates.length
      : -1;

  const nextAssignee =
    nextIndex >= 0 ? roommates[nextIndex] : undefined;

  /*
   * Rotate through the API.
   *
   * Backend endpoint:
   * POST /api/v1/chores/{chore_id}/rotate
   */
  const handleRotate = async (
    completed: boolean,
    skipTurn: boolean,
  ) => {
    if (!selectedChore || isRotating) return;

    setIsRotating(true);
    setError(null);

    try {
      const result = await apiRequest<RotateResponse>(
        `/api/v1/chores/${selectedChore.id}/rotate`,
        {
          method: 'POST',
          body: JSON.stringify({
            completed,
            skip_turn: skipTurn,
            notes: null,
          }),
        },
      );

      if (result.sarcastic_alert) {
        setSarcasticToast(result.sarcastic_alert);
      }

      /*
       * The API has already performed the queue rotation.
       * Re-fetch so the UI exactly matches server state.
       */
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to rotate chore.',
      );
    } finally {
      setIsRotating(false);
    }
  };

  /*
   * Create chore through the API.
   *
   * Backend endpoint:
   * POST /api/v1/chores/
   */
  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = newTitle.trim();
    const description = newDesc.trim();

    if (!title || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      await apiRequest<ChoreResponse>('/api/v1/chores/', {
        method: 'POST',
        body: JSON.stringify({
          household_id: householdId,
          title,
          description: description || null,
          initial_assignee_id: null,
        }),
      });

      setNewTitle('');
      setNewDesc('');
      setShowAddModal(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create chore.',
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-zinc-400">
          <RotateCw className="w-5 h-5 animate-spin text-emerald-400" />
          Loading household chores...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />

            <div>
              <p className="font-semibold text-red-300 text-sm">
                API Error
              </p>

              <p className="text-red-200/80 text-sm mt-1">
                {error}
              </p>
            </div>
          </div>

          <button
            onClick={() => setError(null)}
            className="text-zinc-500 hover:text-zinc-200"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sarcastic Alert */}
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

              <p className="text-zinc-200 text-sm font-medium mt-0.5">
                {sarcasticToast}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSarcasticToast(null)}
            className="text-zinc-400 hover:text-zinc-200 px-2.5 py-1 text-xs bg-zinc-800/80 rounded-lg"
          >
            Acknowledge Shame
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                API: Circular Queue
              </span>

              <span className="text-xs text-zinc-400 font-mono">
                Rotation handled by backend
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mt-1">
              Household Chore Rotation Roulette
            </h2>

            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              The backend owns the circular queue and chore rotation.
              This interface only visualizes the current server state.
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

      {chores.length === 0 ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-10 text-center">
          <p className="text-zinc-300 font-semibold">
            No chores yet.
          </p>

          <p className="text-zinc-500 text-sm mt-1">
            Add the first household chore to start the rotation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chores */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Active Household Duties ({chores.length})
              </h3>

              <span className="text-xs text-zinc-500">
                Select a chore
              </span>
            </div>

            <div className="space-y-2.5">
              {chores.map((chore) => {
                const isSelected = chore.id === selectedChore?.id;

                const assignee = roommates.find(
                  (roommate) =>
                    roommate.id === chore.currentAssigneeId,
                );

                return (
                  <button
                    key={chore.id}
                    type="button"
                    onClick={() => setSelectedChoreId(chore.id)}
                    className={`w-full p-4 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-zinc-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-white text-base">
                          {chore.title}
                        </h4>

                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {chore.description || 'No description'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/60 text-xs">
                      <span className="text-zinc-400">
                        Current Assignee:
                      </span>

                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            assignee?.avatarColor || 'bg-zinc-500'
                          }`}
                        />

                        <span className="font-medium text-zinc-200">
                          {assignee?.fullName ||
                            chore.currentAssigneeName ||
                            'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Queue Visualization */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
                <div>
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    Active Chore: {selectedChore?.title}
                  </span>

                  <h3 className="text-lg font-bold text-white">
                    Circular Queue
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-500 font-mono">
                    Pointer Index:{' '}
                    <strong className="text-emerald-400">
                      {activeIndex >= 0 ? activeIndex : '-'}
                    </strong>{' '}
                    / {roommates.length}
                  </span>
                </div>
              </div>

              {/* Ring */}
              <div className="relative py-8 flex items-center justify-center">
                <div className="w-72 h-72 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center relative">
                  {/* Center */}
                  <div className="text-center p-4 z-10 bg-zinc-950/90 rounded-2xl border border-zinc-800 shadow-2xl max-w-[190px]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      On Duty Now
                    </span>

                    <div className="text-base font-bold text-white truncate mt-0.5">
                      {activeAssignee?.fullName ||
                        selectedChore?.currentAssigneeName ||
                        'Unassigned'}
                    </div>

                    <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center justify-center gap-1">
                      <RotateCw
                        className={`w-3 h-3 ${
                          isRotating ? 'animate-spin' : ''
                        }`}
                      />

                      Next:{' '}
                      {nextAssignee
                        ? nextAssignee.fullName.split(' ')[0]
                        : '—'}
                    </div>
                  </div>

                  {/* Members */}
                  {roommates.map((roommate, index) => {
                    const total = roommates.length;

                    if (total === 0) return null;

                    const angle =
                      (index / total) * 2 * Math.PI - Math.PI / 2;

                    const radius = 130;

                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    const isActive = index === activeIndex;
                    const isNext = index === nextIndex;

                    return (
                      <div
                        key={roommate.id}
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
                          <span
                            className={`w-4 h-4 rounded-full ${roommate.avatarColor}`}
                          />
                        </div>

                        <div className="mt-1 text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-md ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-zinc-400 bg-zinc-950/80'
                            }`}
                          >
                            {roommate.fullName.split(' ')[0]}
                          </span>

                          <span className="block text-[9px] font-mono text-zinc-500">
                            Index #{roommate.turnOrderIndex}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Queue Order */}
              <div className="mt-4 bg-zinc-950/60 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="font-semibold text-zinc-300">
                    Circular Buffer Turn Order:
                  </span>

                  <span className="font-mono text-[11px] text-zinc-500">
                    {roommates.length > 0
                      ? `Head: [0] • Tail: [${
                          roommates.length - 1
                        }]`
                      : 'Empty'}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {roommates.map((roommate, index) => (
                    <React.Fragment key={roommate.id}>
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 shrink-0 border ${
                          index === activeIndex
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${roommate.avatarColor}`}
                        />

                        {roommate.fullName}

                        {index === activeIndex && (
                          <span className="text-[10px] bg-emerald-500/40 text-emerald-200 px-1.5 py-0.5 rounded">
                            POINTER
                          </span>
                        )}
                      </div>

                      {index < roommates.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}

                  {roommates.length > 0 && (
                    <span className="text-zinc-600 text-xs shrink-0 font-mono">
                      ↺ Wraps to [0]
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleRotate(true, false)}
                  disabled={isRotating || !selectedChore}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Roullete of Chore</span>
                </button>

                <button
                  onClick={() => handleRotate(false, true)}
                  disabled={isRotating || !selectedChore}
                  className="flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-semibold py-3 px-4 rounded-2xl transition active:scale-95 disabled:opacity-50"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Skip Turn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Add New Household Chore
                </h3>

                <p className="text-xs text-zinc-400 mt-1">
                  The backend will assign the starting queue position.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateChore}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Chore Title
                </label>

                <input
                  type="text"
                  required
                  maxLength={255}
                  placeholder="e.g. Balcony Sweeping & Plant Watering"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Description
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
                  disabled={isCreating || !newTitle.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Chore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};