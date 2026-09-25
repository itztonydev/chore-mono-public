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
      id: 'expenses_simplify',
      method: 'GET',
      path: `/api/v1/expenses/${INITIAL_HOUSEHOLD_ID}/simplify`,
      tag: 'Expenses',
      summary: 'Min-Cash-Flow Directed Graph Debt Simplification',
      description: 'Runs greedy graph algorithm to output minimal transaction vectors (<= N - 1).',
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
      id: 'expenses_undo',
      method: 'POST',
      path: `/api/v1/expenses/${INITIAL_HOUSEHOLD_ID}/undo`,
      tag: 'Expenses',
      summary: 'Pop and undo top item from Activity Stack',
      description: 'Reverses most recent transaction from LIFO activity stack log.',
    },
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
  ];

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('expenses_simplify');
  const [requestPayload, setRequestPayload] = useState<string>('{}');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

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
      setLatency(Math.round(endTime - startTime) + 10);

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
      } else if (selectedEndpoint.id === 'auth_register') {
        setResponseStatus(201);
        setResponseBody({
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_jwt_token',
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
          user_id: roommates[0]?.id,
          email: roommates[0]?.email,
          full_name: roommates[0]?.fullName,
          google_sub_id: 'google_sub_849201948271',
          available_login_methods: ['password', 'ed25519', 'google'],
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_jwt_linked_google',
          token_type: 'bearer',
        });
      } else {
        setResponseStatus(200);
        setResponseBody({ status: 'success', endpoint: selectedEndpoint.path });
      }
      setIsLoading(false);
    }, 150);
  };

  const copyCurl = () => {
    const curl = `curl -X ${selectedEndpoint.method} "http://localhost:8000${selectedEndpoint.path}" \\
  -H "Content-Type: application/json"${
    selectedEndpoint.defaultPayload ? ` \\\n  -d '${JSON.stringify(selectedEndpoint.defaultPayload)}'` : ''
  }`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6 font-mono text-xs text-left">
      {/* Top Banner */}
      <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#9ece6a] font-bold uppercase tracking-wider">
                LIVE API WORKBENCH
              </span>
              <span className="text-[#565f89]">|</span>
              <span className="text-[#c0caf5]">FASTAPI 0.111+ & PYDANTIC V2</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white mt-1 uppercase tracking-tight">
              Backend Endpoints Explorer
            </h2>
            <p className="text-xs text-[#9aa5ce] mt-1 max-w-2xl leading-relaxed">
              Dispatch live simulated API requests to the Python endpoints. Inspect Pydantic payload models, HTTP status codes, and JSON response vectors.
            </p>
          </div>

          <button
            onClick={copyCurl}
            className="flex items-center gap-2 bg-black border border-[#7dcfff] text-[#7dcfff] hover:bg-[#7dcfff] hover:text-black font-bold px-4 py-2.5 transition-none cursor-pointer shrink-0 uppercase"
          >
            {copied ? <Check className="w-4 h-4 text-[#9ece6a]" /> : <Copy className="w-4 h-4" />}
            <span>COPY cURL</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoints Directory */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-bold text-white uppercase px-1 mb-2">
            SELECT ENDPOINT ({endpoints.length})
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {endpoints.map((ep) => {
              const isSelected = ep.id === selectedEndpoint.id;

              return (
                <div
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-3 border-2 cursor-pointer transition-none ${
                    isSelected
                      ? 'bg-black border-[#7dcfff] shadow-brutal-sm-cyan'
                      : 'bg-[#16161E] border-[#565f89] hover:border-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.2 font-bold text-[10px] ${
                        ep.method === 'GET' ? 'bg-[#7dcfff] text-black' : 'bg-[#9ece6a] text-black'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-bold text-white text-xs truncate">{ep.path}</span>
                  </div>
                  <div className="text-[11px] text-[#9aa5ce] truncate">{ep.summary}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Workbench */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
            <div className="flex items-start justify-between gap-4 border-b-2 border-[#565f89] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.2 font-bold text-xs ${
                      selectedEndpoint.method === 'GET' ? 'bg-[#7dcfff] text-black' : 'bg-[#9ece6a] text-black'
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-bold text-white text-sm">{selectedEndpoint.path}</span>
                </div>
                <p className="text-xs text-[#9aa5ce] mt-1">{selectedEndpoint.description}</p>
              </div>

              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#9ece6a] hover:bg-white text-black font-extrabold px-5 py-2.5 border border-[#9ece6a] shadow-brutal-sm-green cursor-pointer uppercase shrink-0"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>EXECUTE</span>
              </button>
            </div>

            {/* Request Payload */}
            {selectedEndpoint.method === 'POST' && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-[#7dcfff] uppercase mb-1">
                  PYDANTIC REQUEST BODY (JSON):
                </div>
                <textarea
                  rows={6}
                  value={requestPayload}
                  onChange={(e) => setRequestPayload(e.target.value)}
                  className="w-full bg-black border border-[#565f89] p-3 text-xs text-[#9ece6a] focus:outline-none focus:border-[#7dcfff] font-mono leading-relaxed"
                />
              </div>
            )}

            {/* Response Area */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase mb-1">
                <span className="text-[#bb9af7]">SERVER RESPONSE</span>
                {responseStatus && (
                  <span className="text-[#9ece6a]">
                    HTTP {responseStatus} OK ({latency}ms)
                  </span>
                )}
              </div>

              <div className="bg-black border border-[#565f89] p-4 min-h-[160px] max-h-[350px] overflow-y-auto">
                {responseBody ? (
                  <pre className="text-xs text-[#9ece6a] overflow-x-auto leading-relaxed">
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-[#565f89]">
                    Click &apos;EXECUTE&apos; to dispatch HTTP request to backend
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
