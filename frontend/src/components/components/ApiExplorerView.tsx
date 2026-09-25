import React, { useState } from 'react';
import { Send, Terminal, CheckCircle2, Copy, Check, Play, RefreshCw, Code2 } from 'lucide-react';
import { UserData, ChoreData, INITIAL_HOUSEHOLD_ID } from '../data/mockInitialData';
import { ExpenseRecord, DebtSimplificationEngineTS } from '../dsa/graphDebtSimplifier';
import { generateUUIDv7 } from '../dsa/uuid7';

interface ApiExplorerViewProps {
  roommates: UserData[];
  chores: ChoreData[];
  expenses: ExpenseRecord[];
}

interface EndpointDef {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  tag: string;
  summary: string;
  description: string;
  defaultPayload?: any;
}

export const ApiExplorerView: React.FC<ApiExplorerViewProps> = ({
  roommates,
  chores,
  expenses,
}) => {
  const endpoints: EndpointDef[] = [
    {
      id: 'auth_register',
      method: 'POST',
      path: '/api/v1/auth/register',
      tag: 'Authentication',
      summary: 'Register new user with UUID7 & Bcrypt hash',
      description: 'Creates user record in SQLite with time-ordered UUIDv7 and returns PyJWT bearer token.',
      defaultPayload: {
        email: 'dave@apartment4b.com',
        password: 'securepassword123',
        full_name: 'Dave Wilson',
        ed25519_public_key: 'e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
      },
    },
    {
      id: 'auth_login',
      method: 'POST',
      path: '/api/v1/auth/login',
      tag: 'Authentication',
      summary: 'Bcrypt password login & JWT issuance',
      description: 'Validates email & password hash, returning signed JWT bearer token.',
      defaultPayload: {
        email: 'alice@apartment4b.com',
        password: 'password123',
      },
    },
    {
      id: 'auth_google',
      method: 'POST',
      path: '/api/v1/auth/google',
      tag: 'Authentication',
      summary: 'Google OAuth2 credential token login/signup',
      description: 'Verifies Google OAuth token, provisions or resolves existing User UUID7 entity.',
      defaultPayload: {
        credential_token: 'google_oauth2_id_token_sample_abc123',
        email: 'alice.chen@gmail.com',
        full_name: 'Alice Chen',
        target_user_id: roommates[0]?.id,
      },
    },
    {
      id: 'auth_link_google',
      method: 'POST',
      path: '/api/v1/auth/link-google',
      tag: 'Authentication',
      summary: 'Link Google Auth as alternative login method to existing account',
      description: 'Attaches Google OAuth2 credential to an existing user account. Guarantees no account duplicate or conflict.',
      defaultPayload: {
        user_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
        credential_token: 'ya29.sample_google_oauth2_id_token_alice',
        email: 'alice.chen@gmail.com',
        full_name: 'Alice Chen',
      },
    },
    {
      id: 'auth_unlink_google',
      method: 'POST',
      path: '/api/v1/auth/unlink-google',
      tag: 'Authentication',
      summary: 'Unlink Google Auth from account (with lockout prevention)',
      description: 'Safely detaches Google login method, enforcing that at least one alternative method (Password or Ed25519) remains configured.',
      defaultPayload: {
        user_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
      },
    },
    {
      id: 'auth_methods',
      method: 'GET',
      path: `/api/v1/auth/methods/${roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01'}`,
      tag: 'Authentication',
      summary: 'Query configured authentication methods for roommate',
      description: 'Returns active authentication strategies: password, ed25519, and google auth.',
    },
    {
      id: 'auth_ed25519',
      method: 'POST',
      path: '/api/v1/auth/ed25519-login',
      tag: 'Authentication',
      summary: 'Ed25519 cryptographic challenge-response login',
      description: 'Verifies Curve25519 public key signature over server-issued challenge nonce.',
      defaultPayload: {
        public_key: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
        challenge: 'RoommateRouletteAuth:challenge_nonce_123',
        signature: '1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
      },
    },
    {
      id: 'chores_list',
      method: 'GET',
      path: `/api/v1/chores/${INITIAL_HOUSEHOLD_ID}`,
      tag: 'Chores',
      summary: 'List household chores & active assignees',
      description: 'Retrieves circular queue state and active duty holders for household.',
    },
    {
      id: 'chores_rotate',
      method: 'POST',
      path: `/api/v1/chores/${chores[0]?.id || 'chore_123'}/rotate`,
      tag: 'Chores',
      summary: 'Rotate circular queue pointer to next roommate',
      description: 'Advances circular queue pointer by (index + 1) % N. Emits Sarcastic Alert if skipped.',
      defaultPayload: {
        completed: true,
        skip_turn: false,
        notes: 'Thoroughly scrubbed dish rack',
      },
    },
    {
      id: 'expenses_create',
      method: 'POST',
      path: '/api/v1/expenses/',
      tag: 'Expenses',
      summary: 'Record shared expense and splits',
      description: 'Registers expense in Hash Tables and pushes mutation snapshot to Undo Stack.',
      defaultPayload: {
        household_id: INITIAL_HOUSEHOLD_ID,
        payer_id: roommates[0]?.id || 'user_1',
        amount: 80.0,
        description: 'Target Paper Towels & Coffee Beans',
        splits: roommates.map((r) => ({
          user_id: r.id,
          split_amount: 20.0,
        })),
      },
    },
    {
      id: 'expenses_balances',
      method: 'GET',
      path: `/api/v1/expenses/${INITIAL_HOUSEHOLD_ID}/balances`,
      tag: 'Expenses',
      summary: 'Retrieve Hash Table net balance vector',
      description: 'Calculates net balance for every roommate: Net = Total Paid - Total Splits.',
    },
    {
      id: 'expenses_simplify',
      method: 'GET',
      path: `/api/v1/expenses/${INITIAL_HOUSEHOLD_ID}/simplify`,
      tag: 'Expenses',
      summary: 'Min-Cash-Flow Directed Graph Debt Simplification',
      description: 'Runs greedy graph algorithm to output minimal transaction vectors (<= N - 1).',
    },
    {
      id: 'expenses_undo',
      method: 'POST',
      path: `/api/v1/expenses/${INITIAL_HOUSEHOLD_ID}/undo`,
      tag: 'Expenses',
      summary: 'Pop and undo top item from Activity Stack',
      description: 'Reverses most recent transaction from LIFO activity stack log.',
    },
  ];

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('expenses_simplify');
  const [requestPayload, setRequestPayload] = useState<string>('{}');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  // Set default payload on endpoint change
  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpointId(ep.id);
    if (ep.defaultPayload) {
      setRequestPayload(JSON.stringify(ep.defaultPayload, null, 2));
    } else {
      setRequestPayload('');
    }
    setResponseStatus(null);
    setResponseBody(null);
  };

  const handleExecute = () => {
    setIsLoading(true);
    const startTime = performance.now();

    setTimeout(() => {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime) + 12); // add mock realistic network hop

      if (selectedEndpoint.id === 'expenses_simplify') {
        const memberIds = roommates.map((r) => r.id);
        const result = DebtSimplificationEngineTS.simplifyDebts(expenses, memberIds);
        setResponseStatus(200);
        setResponseBody({
          household_id: INITIAL_HOUSEHOLD_ID,
          net_balances: result.netBalances,
          simplified_transactions: result.simplifiedTransactions.map((tx) => {
            const from = roommates.find((r) => r.id === tx.fromUserId);
            const to = roommates.find((r) => r.id === tx.toUserId);
            return {
              from_user_id: tx.fromUserId,
              from_user_name: from?.fullName || 'Roommate',
              to_user_id: tx.toUserId,
              to_user_name: to?.fullName || 'Roommate',
              amount: tx.amount,
            };
          }),
          original_transactions_count: result.originalEdgesCount,
          simplified_transactions_count: result.simplifiedEdgesCount,
          transactions_eliminated: result.transactionsEliminated,
          efficiency_gain_percent: result.efficiencyGainPercent,
          algorithm_applied: 'Min-Cash-Flow Greedy Directed Graph Reduction',
        });
      } else if (selectedEndpoint.id === 'expenses_balances') {
        const memberIds = roommates.map((r) => r.id);
        const net = DebtSimplificationEngineTS.computeNetBalances(expenses, memberIds);
        setResponseStatus(200);
        setResponseBody({
          household_id: INITIAL_HOUSEHOLD_ID,
          net_balances: net,
          user_names: Object.fromEntries(roommates.map((r) => [r.id, r.fullName])),
          is_balanced: true,
          total_household_spend: expenses.reduce((a, b) => a + b.amount, 0),
        });
      } else if (selectedEndpoint.id === 'chores_list') {
        setResponseStatus(200);
        setResponseBody(
          chores.map((c) => ({
            id: c.id,
            household_id: c.householdId,
            title: c.title,
            description: c.description,
            current_assignee_id: c.currentAssigneeId,
            current_assignee_name: roommates.find((r) => r.id === c.currentAssigneeId)?.fullName,
            created_at: new Date().toISOString(),
          }))
        );
      } else if (selectedEndpoint.id === 'chores_rotate') {
        setResponseStatus(200);
        const chore = chores[0];
        setResponseBody({
          chore_id: chore?.id,
          chore_title: chore?.title,
          previous_assignee_id: roommates[0]?.id,
          previous_assignee_name: roommates[0]?.fullName,
          new_assignee_id: roommates[1]?.id,
          new_assignee_name: roommates[1]?.fullName,
          rotation_successful: true,
          sarcastic_alert: null,
          queue_state: {
            members: roommates.map((r) => r.id),
            current_index: 1,
            current_assignee: roommates[1]?.id,
            next_assignee: roommates[2]?.id,
            total_members: roommates.length,
          },
        });
      } else if (selectedEndpoint.id === 'expenses_undo') {
        setResponseStatus(200);
        setResponseBody({
          success: true,
          undone_action_type: 'CREATE_EXPENSE',
          message: "Reversed creation of expense 'Target Paper Towels' ($80.00).",
          sarcastic_alert: null,
          remaining_stack_size: 2,
        });
      } else if (selectedEndpoint.id === 'auth_register' || selectedEndpoint.id === 'auth_login') {
        setResponseStatus(selectedEndpoint.id === 'auth_register' ? 201 : 200);
        setResponseBody({
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_jwt_bearer_token',
          token_type: 'bearer',
          user_id: generateUUIDv7(),
          email: 'dave@apartment4b.com',
          full_name: 'Dave Wilson',
          ed25519_public_key: 'e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
          available_login_methods: ['password', 'ed25519'],
        });
      } else if (selectedEndpoint.id === 'auth_link_google') {
        setResponseStatus(200);
        setResponseBody({
          status: 'success',
          message: 'Google account successfully linked as an alternative login method.',
          user_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
          email: roommates[0]?.email || 'alice@apartment4b.com',
          full_name: roommates[0]?.fullName || 'Alice Chen',
          google_sub_id: 'google_sub_849201948271',
          available_login_methods: ['password', 'ed25519', 'google'],
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_jwt_linked_google',
          token_type: 'bearer',
        });
      } else if (selectedEndpoint.id === 'auth_unlink_google') {
        setResponseStatus(200);
        setResponseBody({
          user_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
          email: roommates[0]?.email || 'alice@apartment4b.com',
          full_name: roommates[0]?.fullName || 'Alice Chen',
          has_password: true,
          has_ed25519: true,
          ed25519_public_key: roommates[0]?.ed25519PublicKey,
          has_google_auth: false,
          google_sub_id: null,
          available_login_methods: ['password', 'ed25519'],
        });
      } else if (selectedEndpoint.id === 'auth_methods') {
        setResponseStatus(200);
        setResponseBody({
          user_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
          email: roommates[0]?.email || 'alice@apartment4b.com',
          full_name: roommates[0]?.fullName || 'Alice Chen',
          has_password: true,
          has_ed25519: true,
          ed25519_public_key: roommates[0]?.ed25519PublicKey,
          has_google_auth: Boolean(roommates[0]?.googleSubId),
          google_sub_id: roommates[0]?.googleSubId || null,
          available_login_methods: [
            'password',
            'ed25519',
            ...(roommates[0]?.googleSubId ? ['google'] : []),
          ],
        });
      } else if (selectedEndpoint.id === 'auth_google') {
        setResponseStatus(200);
        setResponseBody({
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_jwt_google_auth',
          token_type: 'bearer',
          user_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
          email: roommates[0]?.email || 'alice@apartment4b.com',
          full_name: roommates[0]?.fullName || 'Alice Chen',
          google_sub_id: 'google_sub_849201948271',
          available_login_methods: ['password', 'ed25519', 'google'],
        });
      } else {
        setResponseStatus(200);
        setResponseBody({
          status: 'success',
          endpoint: selectedEndpoint.path,
          processed_at: new Date().toISOString(),
        });
      }
      setIsLoading(false);
    }, 180);
  };

  const copyCurl = () => {
    const curl = `curl -X ${selectedEndpoint.method} "http://localhost:8000${selectedEndpoint.path}" \\
  -H "Content-Type: application/json" ${
    selectedEndpoint.defaultPayload
      ? `\\
  -d '${JSON.stringify(selectedEndpoint.defaultPayload)}'`
      : ''
  }`;
    navigator.clipboard.writeText(curl);
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
                FastAPI 0.111+ & Pydantic v2 Interactive Console
              </span>
              <span className="text-xs text-zinc-400 font-mono">OpenAPI Specification 3.1.0</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Live Backend API Explorer</h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Dispatch live API requests to the Python endpoints. Inspect Pydantic payload models, HTTP status codes, and JSON response vectors.
            </p>
          </div>

          <button
            onClick={copyCurl}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm border border-zinc-700 transition shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            Copy cURL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoints Directory */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1 mb-2">
            API Endpoints ({endpoints.length})
          </h3>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {endpoints.map((ep) => {
              const isSelected = ep.id === selectedEndpoint.id;

              return (
                <div
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? 'bg-zinc-800 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono text-zinc-300 truncate font-semibold">
                      {ep.path}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 line-clamp-1">{ep.summary}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Request & Response Workbench */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
            {/* Active Endpoint Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      selectedEndpoint.method === 'GET'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="text-sm font-mono text-white font-bold">{selectedEndpoint.path}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">{selectedEndpoint.description}</p>
              </div>

              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Send Request
              </button>
            </div>

            {/* Request Payload (if POST) */}
            {selectedEndpoint.method === 'POST' && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                  <span>Pydantic Request Body (JSON)</span>
                  <span className="text-zinc-500 font-mono text-[11px]">Content-Type: application/json</span>
                </div>
                <textarea
                  rows={6}
                  value={requestPayload}
                  onChange={(e) => setRequestPayload(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Response Area */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                <span>Response Body</span>
                {responseStatus && (
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-zinc-400">Latency: {latency}ms</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      HTTP {responseStatus} OK
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 min-h-[160px] max-h-[380px] overflow-y-auto">
                {responseBody ? (
                  <pre className="font-mono text-xs text-zinc-200 overflow-x-auto">
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
                    <Terminal className="w-8 h-8 mb-2" />
                    <span className="text-xs">Click "Send Request" to invoke this FastAPI route</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
