/**
 * SwaggerDocsView - Full-Featured Interactive Swagger UI (OpenAPI 3.1.0)
 * Replicates the standard OpenAPI / FastAPI Swagger UI experience with dark mode,
 * interactive parameter testing, live curl generation, schema inspectors, and auth modal.
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Check,
  Download,
  Code2,
  ExternalLink,
  Shield,
  Layers,
  Database,
  Terminal,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import {
  OPENAPI_SPEC,
  OpenApiEndpoint,
  OpenApiSchema,
  OpenApiResponse,
} from '../data/openApiSpec';
import { UserData, ChoreData } from '../data/mockInitialData';

interface SwaggerDocsViewProps {
  roommates: UserData[];
  chores: ChoreData[];
}

export const SwaggerDocsView: React.FC<SwaggerDocsViewProps> = ({ roommates, chores }) => {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'swagger' | 'raw_json'>('swagger');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedServer, setSelectedServer] = useState(OPENAPI_SPEC.servers[0].url);

  // Expanded Endpoints & Tags
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({
    Authentication: true,
    'Households & Memberships': true,
    'Chores & Circular Queue': true,
    'Expenses & Debt Simplification': true,
    Health: true,
  });

  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    chores_rotate: true,
    expenses_simplify: true,
  });

  // Try It Out State per Endpoint
  const [tryItOutState, setTryItOutState] = useState<Record<string, boolean>>({
    chores_rotate: true,
    expenses_simplify: true,
  });

  // Editable parameters & request bodies
  const [endpointParamValues, setEndpointParamValues] = useState<Record<string, Record<string, string>>>({
    chores_rotate: { chore_id: chores[0]?.id || '018e6e5a-8001-7b3c-9a11-111111111111' },
    expenses_simplify: { household_id: '018e6e5a-73c0-7f2a-8c11-001122334455' },
    expenses_balances: { household_id: '018e6e5a-73c0-7f2a-8c11-001122334455' },
    households_get: { household_id: '018e6e5a-73c0-7f2a-8c11-001122334455' },
    chores_list: { household_id: '018e6e5a-73c0-7f2a-8c11-001122334455' },
  });

  const [endpointBodyValues, setEndpointBodyValues] = useState<Record<string, string>>({
    chores_rotate: JSON.stringify(
      {
        completed: true,
        skip_turn: false,
        notes: 'Cleaned and sanitized to military standards.',
      },
      null,
      2
    ),
    expenses_create: JSON.stringify(
      {
        household_id: '018e6e5a-73c0-7f2a-8c11-001122334455',
        payer_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
        amount: 80.0,
        description: 'Costco Bulk Household Goods',
        splits: roommates.map((r) => ({ user_id: r.id, split_amount: 20.0 })),
      },
      null,
      2
    ),
    auth_register: JSON.stringify(
      {
        email: 'elena.rostova@apartment4b.com',
        password: 'secure_password123!',
        full_name: 'Elena Rostova',
        ed25519_public_key: 'e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
      },
      null,
      2
    ),
    auth_login: JSON.stringify(
      {
        email: 'alice@apartment4b.com',
        password: 'secret_password_123',
      },
      null,
      2
    ),
  });

  // Live Execution Results
  const [executionResults, setExecutionResults] = useState<
    Record<
      string,
      {
        status: number;
        statusText: string;
        timeMs: number;
        curlCommand: string;
        requestUrl: string;
        responseBody: any;
        responseHeaders: Record<string, string>;
      }
    >
  >({});

  // Schemas section expanded state
  const [isSchemasExpanded, setIsSchemasExpanded] = useState(true);
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({
    UserRegisterRequest: true,
    SimplifiedDebtResponse: true,
    ChoreRotateResponse: true,
  });

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bearerToken, setBearerToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.roommate_sample_jwt_token...');
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Copy Feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle helpers
  const toggleTag = (tagName: string) => {
    setExpandedTags((prev) => ({ ...prev, [tagName]: !prev[tagName] }));
  };

  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [endpointId]: !prev[endpointId] }));
  };

  const toggleTryItOut = (endpointId: string, endpoint: OpenApiEndpoint) => {
    setTryItOutState((prev) => {
      const nextState = !prev[endpointId];
      // initialize body if needed
      if (nextState && endpoint.requestBody && !endpointBodyValues[endpointId]) {
        setEndpointBodyValues((b) => ({
          ...b,
          [endpointId]: JSON.stringify(endpoint.requestBody?.example || {}, null, 2),
        }));
      }
      return { ...prev, [endpointId]: nextState };
    });
  };

  const toggleSchema = (schemaName: string) => {
    setExpandedSchemas((prev) => ({ ...prev, [schemaName]: !prev[schemaName] }));
  };

  const handleExpandAll = (expand: boolean) => {
    const newTags: Record<string, boolean> = {};
    OPENAPI_SPEC.tags.forEach((t) => (newTags[t.name] = expand));
    setExpandedTags(newTags);

    const newEndpoints: Record<string, boolean> = {};
    OPENAPI_SPEC.endpoints.forEach((e) => (newEndpoints[e.id] = expand));
    setExpandedEndpoints(newEndpoints);
  };

  // Filtered Endpoints
  const filteredEndpoints = useMemo(() => {
    if (!filterQuery.trim()) return OPENAPI_SPEC.endpoints;
    const q = filterQuery.toLowerCase();
    return OPENAPI_SPEC.endpoints.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tag.toLowerCase().includes(q) ||
        e.method.toLowerCase().includes(q)
    );
  }, [filterQuery]);

  // Execute Simulated Request
  const handleExecute = (endpoint: OpenApiEndpoint) => {
    let url = `${selectedServer}${endpoint.path}`;
    const params = endpointParamValues[endpoint.id] || {};

    // replace path params
    if (endpoint.parameters) {
      endpoint.parameters.forEach((param) => {
        if (param.in === 'path') {
          const val = params[param.name] || param.schema.example || 'unknown';
          url = url.replace(`{${param.name}}`, encodeURIComponent(val));
        }
      });
    }

    let parsedBody: any = null;
    if (endpoint.requestBody && endpointBodyValues[endpoint.id]) {
      try {
        parsedBody = JSON.parse(endpointBodyValues[endpoint.id]);
      } catch (err) {
        // syntax error
        setExecutionResults((prev) => ({
          ...prev,
          [endpoint.id]: {
            status: 422,
            statusText: 'Unprocessable Entity',
            timeMs: 4,
            curlCommand: `curl -X '${endpoint.method.toUpperCase()}' '${url}'`,
            requestUrl: url,
            responseBody: {
              detail: [{ loc: ['body'], msg: 'Malformed JSON payload syntax', type: 'json_invalid' }],
            },
            responseHeaders: {
              'content-type': 'application/json',
              date: new Date().toUTCString(),
            },
          },
        }));
        return;
      }
    }

    // Build cURL
    const headers: string[] = ['-H "accept: application/json"'];
    if (endpoint.requestBody) {
      headers.push('-H "Content-Type: application/json"');
    }
    if (endpoint.security && isAuthorized && bearerToken) {
      headers.push(`-H "Authorization: Bearer ${bearerToken}"`);
    }

    const curlCmd = `curl -X '${endpoint.method.toUpperCase()}' \\\n  '${url}' \\\n  ${headers.join(
      ' \\\n  '
    )}${parsedBody ? ` \\\n  -d '${JSON.stringify(parsedBody)}'` : ''}`;

    // Compute realistic mock response based on endpoint
    const mockSuccessResponse = endpoint.responses.find((r) => r.statusCode.startsWith('2'));
    const responsePayload = mockSuccessResponse?.example || { status: 'success' };

    setExecutionResults((prev) => ({
      ...prev,
      [endpoint.id]: {
        status: parseInt(mockSuccessResponse?.statusCode || '200', 10),
        statusText: mockSuccessResponse?.description || 'OK',
        timeMs: Math.floor(Math.random() * 18) + 6,
        curlCommand: curlCmd,
        requestUrl: url,
        responseBody: responsePayload,
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'server': 'uvicorn',
          'x-process-time-ms': '8.2',
          date: new Date().toUTCString(),
        },
      },
    }));
  };

  // Download OpenAPI Spec JSON
  const handleDownloadSpec = () => {
    const jsonStr = JSON.stringify(OPENAPI_SPEC, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'openapi.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-6">
      {/* Swagger UI Top Header Bar */}
      <div className="bg-[#1b1b1b] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#141414] px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#85ea2d]/10 border border-[#85ea2d]/40 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#85ea2d]" />
              <span className="font-mono text-xs font-black tracking-wider text-[#85ea2d] uppercase">
                swagger
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] font-mono text-zinc-300">
              OAS 3.1.0
            </span>
            <span className="hidden sm:inline text-xs text-zinc-400 font-mono">
              FastAPI Interactive API Explorer
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                isAuthorized
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {isAuthorized ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isAuthorized ? 'Authorized (JWT)' : 'Authorize'}</span>
            </button>

            <button
              onClick={handleDownloadSpec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition"
              title="Download openapi.json"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export OAS</span>
            </button>
          </div>
        </div>

        {/* API Title and Specification Header */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {OPENAPI_SPEC.info.title}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-zinc-800 text-emerald-400 border border-emerald-500/30">
                  v{OPENAPI_SPEC.info.version}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  OAS 3.1
                </span>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                {OPENAPI_SPEC.info.description}
              </p>

              {/* Direct Links and Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                <a
                  href="/openapi.json"
                  onClick={(e) => {
                    e.preventDefault();
                    setViewMode('raw_json');
                  }}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  /openapi.json
                </a>
                <span>•</span>
                <span>
                  License:{' '}
                  <strong className="text-zinc-200">{OPENAPI_SPEC.info.license.name}</strong>
                </span>
                <span>•</span>
                <span>
                  Support:{' '}
                  <strong className="text-zinc-200">{OPENAPI_SPEC.info.contact.email}</strong>
                </span>
              </div>
            </div>

            {/* Server Selector Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl space-y-2 min-w-[280px]">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Target Server
              </label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              >
                {OPENAPI_SPEC.servers.map((s) => (
                  <option key={s.url} value={s.url}>
                    {s.url} — {s.description}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500">
                Live requests will be dispatched to this base endpoint.
              </p>
            </div>
          </div>

          {/* Quick DSA Guarantees Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-xs">
              <span className="text-zinc-500 block font-mono">Chore Queue</span>
              <strong className="text-emerald-400 font-mono text-sm block mt-0.5">Circular Ring O(1)</strong>
              <span className="text-[11px] text-zinc-400">Pointer modulo turn shift</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-xs">
              <span className="text-zinc-500 block font-mono">Expense Ledger</span>
              <strong className="text-blue-400 font-mono text-sm block mt-0.5">Hash Tables O(1)</strong>
              <span className="text-[11px] text-zinc-400">&Sigma; balances = 0.00</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-xs">
              <span className="text-zinc-500 block font-mono">Debt Simplifier</span>
              <strong className="text-purple-400 font-mono text-sm block mt-0.5">Min-Cash-Flow</strong>
              <span className="text-[11px] text-zinc-400">Reduces to &le; N - 1 vectors</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-xs">
              <span className="text-zinc-500 block font-mono">Security & ID</span>
              <strong className="text-amber-400 font-mono text-sm block mt-0.5">Ed25519 + UUID7</strong>
              <span className="text-[11px] text-zinc-400">Monotonic time ordering</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by path, verb, or tag..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('swagger')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'swagger'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Swagger UI
            </button>
            <button
              onClick={() => setViewMode('raw_json')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'raw_json'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              OpenAPI JSON
            </button>
          </div>

          {viewMode === 'swagger' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExpandAll(true)}
                className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Expand All
              </button>
              <button
                onClick={() => handleExpandAll(false)}
                className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Raw JSON Mode View */}
      {viewMode === 'raw_json' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-zinc-200">openapi.json (OpenAPI 3.1.0 Specification)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy('spec_json', JSON.stringify(OPENAPI_SPEC, null, 2))}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition"
              >
                {copiedKey === 'spec_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'spec_json' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadSpec}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300/90 bg-[#101010] overflow-x-auto max-h-[700px] leading-relaxed select-all">
            {JSON.stringify(OPENAPI_SPEC, null, 2)}
          </pre>
        </div>
      )}

      {/* Swagger UI Interactive Mode View */}
      {viewMode === 'swagger' && (
        <div className="space-y-6">
          {OPENAPI_SPEC.tags.map((tag) => {
            const endpointsInTag = filteredEndpoints.filter((e) => e.tag === tag.name);
            if (endpointsInTag.length === 0) return null;

            const isTagExpanded = expandedTags[tag.name] ?? true;

            return (
              <div
                key={tag.name}
                className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-md"
              >
                {/* Tag Header Banner */}
                <button
                  onClick={() => toggleTag(tag.name)}
                  className="w-full px-5 py-3.5 bg-zinc-900/90 hover:bg-zinc-900 flex items-center justify-between border-b border-zinc-800/80 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    {isTagExpanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                    <h2 className="text-base font-bold text-white tracking-tight">{tag.name}</h2>
                    <span className="text-xs text-zinc-400 hidden sm:inline">{tag.description}</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-zinc-800 text-zinc-400">
                    {endpointsInTag.length} endpoints
                  </span>
                </button>

                {/* Tag Endpoints List */}
                {isTagExpanded && (
                  <div className="p-4 space-y-3">
                    {endpointsInTag.map((endpoint) => {
                      const isExpanded = expandedEndpoints[endpoint.id] ?? false;
                      const isTrying = tryItOutState[endpoint.id] ?? false;
                      const result = executionResults[endpoint.id];

                      // HTTP verb color schemes adhering to Swagger standard
                      const methodColors: Record<
                        string,
                        { badgeBg: string; borderColor: string; pillBg: string; pillText: string }
                      > = {
                        get: {
                          badgeBg: 'bg-blue-500/10 border-blue-500/30',
                          borderColor: 'border-blue-500/40',
                          pillBg: 'bg-blue-600 text-white font-bold',
                          pillText: 'text-blue-400',
                        },
                        post: {
                          badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
                          borderColor: 'border-emerald-500/40',
                          pillBg: 'bg-emerald-600 text-white font-bold',
                          pillText: 'text-emerald-400',
                        },
                        put: {
                          badgeBg: 'bg-amber-500/10 border-amber-500/30',
                          borderColor: 'border-amber-500/40',
                          pillBg: 'bg-amber-600 text-white font-bold',
                          pillText: 'text-amber-400',
                        },
                        delete: {
                          badgeBg: 'bg-rose-500/10 border-rose-500/30',
                          borderColor: 'border-rose-500/40',
                          pillBg: 'bg-rose-600 text-white font-bold',
                          pillText: 'text-rose-400',
                        },
                      };

                      const color = methodColors[endpoint.method] || methodColors.get;

                      return (
                        <div
                          key={endpoint.id}
                          className={`rounded-xl border transition overflow-hidden ${
                            isExpanded ? `${color.borderColor} bg-zinc-950/80` : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                          }`}
                        >
                          {/* Endpoint Summary Bar */}
                          <div
                            onClick={() => toggleEndpoint(endpoint.id)}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer select-none gap-3"
                          >
                            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
                              <span
                                className={`w-20 text-center py-1 text-xs font-mono uppercase tracking-wider rounded ${color.pillBg}`}
                              >
                                {endpoint.method}
                              </span>
                              <span className="font-mono text-sm font-semibold text-zinc-100">
                                {endpoint.path}
                              </span>
                              <span className="text-xs text-zinc-400 truncate hidden md:inline">
                                {endpoint.summary}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {endpoint.security && (
                                <span title="Secured endpoint (requires JWT Bearer)">
                                  <Lock
                                    className={`w-3.5 h-3.5 ${isAuthorized ? 'text-emerald-400' : 'text-zinc-500'}`}
                                  />
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Endpoint Body */}
                          {isExpanded && (
                            <div className="p-5 border-t border-zinc-800/80 space-y-6 bg-zinc-950/60">
                              {/* Description */}
                              <div className="space-y-1">
                                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                  Description
                                </h4>
                                <p className="text-xs text-zinc-300 leading-relaxed">
                                  {endpoint.description}
                                </p>
                              </div>

                              {/* Try It Out Action Bar */}
                              <div className="flex items-center justify-between border-y border-zinc-800/60 py-2.5">
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                  Parameters & Request Body
                                </span>
                                <button
                                  onClick={() => toggleTryItOut(endpoint.id, endpoint)}
                                  className={`px-3 py-1 rounded text-xs font-mono transition border ${
                                    isTrying
                                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                                  }`}
                                >
                                  {isTrying ? 'Cancel' : 'Try it out'}
                                </button>
                              </div>

                              {/* Parameters Table */}
                              {endpoint.parameters && endpoint.parameters.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                    Parameters
                                  </h4>
                                  <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-900/50">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 font-mono">
                                        <tr>
                                          <th className="px-3 py-2">Name</th>
                                          <th className="px-3 py-2">In</th>
                                          <th className="px-3 py-2">Type</th>
                                          <th className="px-3 py-2">Description</th>
                                          {isTrying && <th className="px-3 py-2">Value</th>}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                                        {endpoint.parameters.map((param) => (
                                          <tr key={param.name} className="hover:bg-zinc-800/20">
                                            <td className="px-3 py-2.5 font-mono text-white font-semibold">
                                              {param.name}
                                              {param.required && (
                                                <span className="text-rose-400 ml-1 font-bold">*</span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-zinc-400">
                                              {param.in}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-emerald-400">
                                              {param.schema.type}
                                            </td>
                                            <td className="px-3 py-2.5 text-zinc-400">
                                              {param.description}
                                            </td>
                                            {isTrying && (
                                              <td className="px-3 py-2">
                                                <input
                                                  type="text"
                                                  value={
                                                    endpointParamValues[endpoint.id]?.[param.name] ??
                                                    param.schema.example ??
                                                    ''
                                                  }
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEndpointParamValues((prev) => ({
                                                      ...prev,
                                                      [endpoint.id]: {
                                                        ...(prev[endpoint.id] || {}),
                                                        [param.name]: val,
                                                      },
                                                    }));
                                                  }}
                                                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                                                />
                                              </td>
                                            )}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Request Body */}
                              {endpoint.requestBody && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                        Request Body
                                      </h4>
                                      <span className="text-rose-400 text-xs font-mono font-bold">* required</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-zinc-500">
                                      application/json
                                    </span>
                                  </div>

                                  {isTrying ? (
                                    <div className="space-y-1">
                                      <textarea
                                        rows={8}
                                        value={
                                          endpointBodyValues[endpoint.id] ??
                                          JSON.stringify(endpoint.requestBody.example, null, 2)
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEndpointBodyValues((prev) => ({
                                            ...prev,
                                            [endpoint.id]: val,
                                          }));
                                        }}
                                        className="w-full bg-[#101010] border border-zinc-700 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed"
                                        placeholder="Enter JSON payload..."
                                      />
                                      <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                                        <span>Schema: {endpoint.requestBody.schemaRef}</span>
                                        <button
                                          onClick={() =>
                                            setEndpointBodyValues((prev) => ({
                                              ...prev,
                                              [endpoint.id]: JSON.stringify(endpoint.requestBody?.example, null, 2),
                                            }))
                                          }
                                          className="text-emerald-400 hover:underline"
                                        >
                                          Reset to Default Example
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-[#101010] border border-zinc-800 rounded-xl p-3 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-56">
                                      <pre>{JSON.stringify(endpoint.requestBody.example, null, 2)}</pre>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Execute Button */}
                              {isTrying && (
                                <div className="pt-2">
                                  <button
                                    onClick={() => handleExecute(endpoint)}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                                  >
                                    <Play className="w-4 h-4 fill-zinc-950" />
                                    Execute
                                  </button>
                                </div>
                              )}

                              {/* Execution Result (cURL, Status, Response Body) */}
                              {result && (
                                <div className="space-y-4 pt-3 border-t border-zinc-800/80">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Server Response
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                          result.status < 300
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        }`}
                                      >
                                        Code {result.status}
                                      </span>
                                      <span className="text-[11px] font-mono text-zinc-500">
                                        {result.timeMs} ms
                                      </span>
                                    </div>
                                  </div>

                                  {/* cURL Command */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                                      <span>Generated cURL Command</span>
                                      <button
                                        onClick={() => handleCopy(`curl_${endpoint.id}`, result.curlCommand)}
                                        className="text-emerald-400 hover:underline flex items-center gap-1"
                                      >
                                        {copiedKey === `curl_${endpoint.id}` ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                        <span>{copiedKey === `curl_${endpoint.id}` ? 'Copied' : 'Copy'}</span>
                                      </button>
                                    </div>
                                    <pre className="bg-[#121212] border border-zinc-800 rounded-xl p-3 text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
                                      {result.curlCommand}
                                    </pre>
                                  </div>

                                  {/* Request URL */}
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-mono text-zinc-400 block">
                                      Request URL
                                    </span>
                                    <div className="bg-[#121212] border border-zinc-800 rounded-xl p-2.5 text-xs font-mono text-zinc-300 break-all">
                                      {result.requestUrl}
                                    </div>
                                  </div>

                                  {/* Response Body */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                                      <span>Response Body</span>
                                      <button
                                        onClick={() =>
                                          handleCopy(
                                            `resp_${endpoint.id}`,
                                            JSON.stringify(result.responseBody, null, 2)
                                          )
                                        }
                                        className="text-emerald-400 hover:underline flex items-center gap-1"
                                      >
                                        {copiedKey === `resp_${endpoint.id}` ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                        <span>{copiedKey === `resp_${endpoint.id}` ? 'Copied' : 'Copy'}</span>
                                      </button>
                                    </div>
                                    <pre className="bg-[#101010] border border-zinc-800 rounded-xl p-4 text-xs font-mono text-emerald-300/95 overflow-x-auto max-h-72 leading-relaxed">
                                      {JSON.stringify(result.responseBody, null, 2)}
                                    </pre>
                                  </div>

                                  {/* Response Headers */}
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-mono text-zinc-400 block">
                                      Response Headers
                                    </span>
                                    <div className="bg-[#121212] border border-zinc-800 rounded-xl p-2.5 text-xs font-mono text-zinc-400 space-y-1">
                                      {Object.entries(result.responseHeaders).map(([k, v]) => (
                                        <div key={k}>
                                          <strong className="text-zinc-300">{k}:</strong> {v}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Responses Definitions */}
                              <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                  Responses Specification
                                </h4>
                                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40 divide-y divide-zinc-800/80">
                                  {endpoint.responses.map((resp) => (
                                    <div key={resp.statusCode} className="p-3 text-xs">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                              resp.statusCode.startsWith('2')
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : resp.statusCode.startsWith('4')
                                                ? 'bg-rose-500/20 text-rose-400'
                                                : 'bg-zinc-800 text-zinc-300'
                                            }`}
                                          >
                                            {resp.statusCode}
                                          </span>
                                          <span className="text-zinc-200 font-medium">
                                            {resp.description}
                                          </span>
                                        </div>
                                        {resp.schemaRef && (
                                          <span className="text-[11px] font-mono text-zinc-500">
                                            Schema: {resp.schemaRef}
                                          </span>
                                        )}
                                      </div>

                                      {resp.example && (
                                        <div className="mt-2 bg-[#121212] border border-zinc-800/80 rounded-lg p-2.5 text-xs font-mono text-zinc-400 max-h-36 overflow-x-auto">
                                          <pre>{JSON.stringify(resp.example, null, 2)}</pre>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Schemas / Models Section at the bottom of Swagger UI */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
            <button
              onClick={() => setIsSchemasExpanded(!isSchemasExpanded)}
              className="w-full px-5 py-3.5 bg-zinc-900 flex items-center justify-between border-b border-zinc-800 transition text-left"
            >
              <div className="flex items-center gap-3">
                {isSchemasExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                )}
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold text-white tracking-tight">Schemas / Pydantic Models</h3>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-zinc-800 text-zinc-400">
                {Object.keys(OPENAPI_SPEC.schemas).length} models
              </span>
            </button>

            {isSchemasExpanded && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(OPENAPI_SPEC.schemas).map(([schemaName, schema]) => {
                  const isModelExpanded = expandedSchemas[schemaName] ?? false;

                  return (
                    <div
                      key={schemaName}
                      className="border border-zinc-800 rounded-xl bg-zinc-950/60 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSchema(schemaName)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between bg-zinc-900/50 hover:bg-zinc-900/80 transition text-left"
                      >
                        <div className="flex items-center gap-2 font-mono text-xs">
                          {isModelExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span className="font-bold text-emerald-400">{schemaName}</span>
                          <span className="text-zinc-500">({schema.type})</span>
                        </div>
                        {schema.required && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {schema.required.length} required
                          </span>
                        )}
                      </button>

                      {isModelExpanded && schema.properties && (
                        <div className="p-3 border-t border-zinc-800/80 space-y-2 text-xs">
                          <div className="divide-y divide-zinc-800/60">
                            {Object.entries(schema.properties).map(([propName, prop]) => {
                              const isReq = schema.required?.includes(propName);

                              return (
                                <div key={propName} className="py-2 flex items-start justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-mono">
                                      <span className="text-white font-medium">{propName}</span>
                                      {isReq && <span className="text-rose-400 font-bold">*</span>}
                                    </div>
                                    {prop.description && (
                                      <p className="text-[11px] text-zinc-400">{prop.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-zinc-900 text-emerald-400 border border-zinc-800">
                                      {prop.type}
                                      {prop.format ? ` (${prop.format})` : ''}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authorization Modal Dialog */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Swagger API Authorization</h3>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* BearerAuth */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-300 block font-semibold">
                  BearerAuth (HTTP Bearer JWT)
                </label>
                <p className="text-xs text-zinc-400">
                  Value format: <code className="text-emerald-400">eyJhbGci...</code> (prefixed automatically with Bearer).
                </p>
                <textarea
                  rows={3}
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  placeholder="Enter JWT Access Token..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Sample Token Generator Helper */}
              <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl text-xs space-y-1.5">
                <span className="text-zinc-400 block font-mono">Select Roommate Identity</span>
                <div className="flex flex-wrap gap-1.5">
                  {roommates.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setBearerToken(
                          `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIke3IuaWR9IiwiZW1haWwiOiIke3IuZW1haWx9In0.signature...`
                        );
                        setIsAuthorized(true);
                      }}
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px]"
                    >
                      {r.fullName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  setIsAuthorized(false);
                  setBearerToken('');
                  setIsAuthModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                Logout / Clear
              </button>
              <button
                onClick={() => {
                  setIsAuthorized(Boolean(bearerToken.trim()));
                  setIsAuthModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
