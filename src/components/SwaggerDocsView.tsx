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
  Database,
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
  const [viewMode, setViewMode] = useState<'swagger' | 'raw_json'>('swagger');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedServer, setSelectedServer] = useState(OPENAPI_SPEC.servers[0].url);

  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({
    'Chores & Circular Queue': true,
    'Expenses & Debt Simplification': true,
    Authentication: true,
    'Households & Memberships': true,
    Health: true,
  });

  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    chores_rotate: true,
    expenses_simplify: true,
  });

  const [tryItOutState, setTryItOutState] = useState<Record<string, boolean>>({
    chores_rotate: true,
    expenses_simplify: true,
  });

  const [endpointParamValues, setEndpointParamValues] = useState<Record<string, Record<string, string>>>({
    chores_rotate: { chore_id: chores[0]?.id || '018e6e5a-8001-7b3c-9a11-111111111111' },
    expenses_simplify: { household_id: '018e6e5a-73c0-7f2a-8c11-001122334455' },
    expenses_balances: { household_id: '018e6e5a-73c0-7f2a-8c11-001122334455' },
    expenses_undo: { household_id: '018e6e5a-73c0-7f2a-8c11-001122334455' },
  });

  const [endpointBodyValues, setEndpointBodyValues] = useState<Record<string, string>>({
    chores_rotate: JSON.stringify(
      {
        completed: true,
        skip_turn: false,
        notes: 'Sanitized kitchen surfaces thoroughly.',
      },
      null,
      2
    ),
    expenses_create: JSON.stringify(
      {
        household_id: '018e6e5a-73c0-7f2a-8c11-001122334455',
        payer_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
        amount: 80.0,
        description: 'Costco Household Essentials',
        splits: roommates.map((r) => ({ user_id: r.id, split_amount: 20.0 })),
      },
      null,
      2
    ),
    auth_register: JSON.stringify(
      {
        email: 'elena@apartment4b.com',
        password: 'securepassword123',
        full_name: 'Elena Rostova',
        ed25519_public_key: 'e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
      },
      null,
      2
    ),
    auth_login: JSON.stringify(
      {
        email: 'alice@apartment4b.com',
        password: 'password123',
      },
      null,
      2
    ),
    auth_link_google: JSON.stringify(
      {
        user_id: roommates[0]?.id || '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
        credential_token: 'ya29.sample_google_id_token_xyz',
        email: 'alice.chen@gmail.com',
        full_name: 'Alice Chen',
      },
      null,
      2
    ),
  });

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
      }
    >
  >({});

  const [isSchemasExpanded, setIsSchemasExpanded] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bearerToken, setBearerToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.roommate_sample_jwt...');
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleTag = (tagName: string) => {
    setExpandedTags((prev) => ({ ...prev, [tagName]: !prev[tagName] }));
  };

  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [endpointId]: !prev[endpointId] }));
  };

  const toggleTryItOut = (endpointId: string, endpoint: OpenApiEndpoint) => {
    setTryItOutState((prev) => {
      const nextState = !prev[endpointId];
      if (nextState && endpoint.requestBody && !endpointBodyValues[endpointId]) {
        setEndpointBodyValues((b) => ({
          ...b,
          [endpointId]: JSON.stringify(endpoint.requestBody?.example || {}, null, 2),
        }));
      }
      return { ...prev, [endpointId]: nextState };
    });
  };

  const filteredEndpoints = useMemo(() => {
    if (!filterQuery.trim()) return OPENAPI_SPEC.endpoints;
    const q = filterQuery.toLowerCase();
    return OPENAPI_SPEC.endpoints.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.tag.toLowerCase().includes(q) ||
        e.method.toLowerCase().includes(q)
    );
  }, [filterQuery]);

  const handleExecute = (endpoint: OpenApiEndpoint) => {
    let url = `${selectedServer}${endpoint.path}`;
    const params = endpointParamValues[endpoint.id] || {};

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
        setExecutionResults((prev) => ({
          ...prev,
          [endpoint.id]: {
            status: 422,
            statusText: 'Unprocessable Entity',
            timeMs: 4,
            curlCommand: `curl -X '${endpoint.method.toUpperCase()}' '${url}'`,
            requestUrl: url,
            responseBody: { detail: 'Malformed JSON payload' },
          },
        }));
        return;
      }
    }

    const headers: string[] = ['-H "accept: application/json"'];
    if (endpoint.requestBody) headers.push('-H "Content-Type: application/json"');
    if (isAuthorized && bearerToken) headers.push(`-H "Authorization: Bearer ${bearerToken}"`);

    const curlCmd = `curl -X '${endpoint.method.toUpperCase()}' \\\n  '${url}' \\\n  ${headers.join(' \\\n  ')}${
      parsedBody ? ` \\\n  -d '${JSON.stringify(parsedBody)}'` : ''
    }`;

    const mockSuccessResponse = endpoint.responses.find((r) => r.statusCode.startsWith('2'));
    const responsePayload = mockSuccessResponse?.example || { status: 'success' };

    setExecutionResults((prev) => ({
      ...prev,
      [endpoint.id]: {
        status: parseInt(mockSuccessResponse?.statusCode || '200', 10),
        statusText: mockSuccessResponse?.description || 'OK',
        timeMs: Math.floor(Math.random() * 15) + 8,
        curlCommand: curlCmd,
        requestUrl: url,
        responseBody: responsePayload,
      },
    }));
  };

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
    <div className="space-y-6 font-mono text-xs text-left">
      {/* Swagger UI Header Bar */}
      <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#565f89] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-[#9ece6a] text-black font-extrabold text-xs">
              SWAGGER UI
            </span>
            <span className="text-white font-bold text-sm">OPENAPI 3.1.0 SPECIFICATION</span>
            <span className="text-[#565f89]">|</span>
            <span className="text-[#7dcfff]">FASTAPI ASYNC ENGINE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border font-bold text-xs cursor-pointer ${
                isAuthorized
                  ? 'bg-black border-[#9ece6a] text-[#9ece6a]'
                  : 'bg-black border-[#565f89] text-[#9aa5ce]'
              }`}
            >
              {isAuthorized ? <Lock className="w-3.5 h-3.5 text-[#9ece6a]" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isAuthorized ? 'AUTHORIZE (JWT SET)' : 'AUTHORIZE'}</span>
            </button>

            <button
              onClick={handleDownloadSpec}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7dcfff] hover:bg-white text-black font-bold text-xs border border-[#7dcfff] shadow-brutal-sm-cyan cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT OPENAPI.JSON</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
              {OPENAPI_SPEC.info.title}
            </h1>
            <p className="text-xs text-[#9aa5ce] leading-relaxed">
              {OPENAPI_SPEC.info.description}
            </p>
            <div className="flex items-center gap-4 text-[#565f89] pt-1">
              <span>LICENSE: <strong className="text-white">{OPENAPI_SPEC.info.license.name}</strong></span>
              <span>•</span>
              <span>GATEWAY: <strong className="text-[#7dcfff]">{selectedServer}</strong></span>
            </div>
          </div>

          <div className="bg-black border border-[#565f89] p-3 space-y-1.5 min-w-[260px]">
            <label className="text-[10px] text-[#565f89] font-bold uppercase block">
              TARGET SERVER
            </label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="w-full bg-[#16161E] border border-[#565f89] text-[#7dcfff] px-2 py-1 text-xs focus:outline-none focus:border-[#7dcfff] cursor-pointer"
            >
              {OPENAPI_SPEC.servers.map((s) => (
                <option key={s.url} value={s.url}>
                  {s.url}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-2 border-[#565f89] bg-black p-2.5">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#565f89] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="FILTER ENDPOINTS BY VERB OR ROUTE..."
            className="w-full bg-[#16161E] border border-[#565f89] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#565f89] focus:outline-none focus:border-[#7dcfff]"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#565f89] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('swagger')}
            className={`px-3 py-1 text-xs font-bold border transition-none cursor-pointer ${
              viewMode === 'swagger'
                ? 'bg-[#7dcfff] text-black border-[#7dcfff]'
                : 'text-[#9aa5ce] border-[#565f89] hover:text-white'
            }`}
          >
            INTERACTIVE UI
          </button>
          <button
            onClick={() => setViewMode('raw_json')}
            className={`px-3 py-1 text-xs font-bold border transition-none cursor-pointer ${
              viewMode === 'raw_json'
                ? 'bg-[#7dcfff] text-black border-[#7dcfff]'
                : 'text-[#9aa5ce] border-[#565f89] hover:text-white'
            }`}
          >
            RAW JSON
          </button>
        </div>
      </div>

      {/* Raw JSON View */}
      {viewMode === 'raw_json' && (
        <div className="border-2 border-[#565f89] bg-[#16161E] p-4">
          <div className="flex items-center justify-between border-b border-[#24283b] pb-2 mb-3">
            <span className="text-[#7dcfff] font-bold">/openapi.json</span>
            <button
              onClick={() => handleCopy('spec_json', JSON.stringify(OPENAPI_SPEC, null, 2))}
              className="px-2 py-0.5 border border-[#565f89] text-[#9aa5ce] hover:text-white cursor-pointer"
            >
              {copiedKey === 'spec_json' ? 'COPIED' : 'COPY ALL'}
            </button>
          </div>
          <pre className="p-3 bg-black text-[#9ece6a] overflow-x-auto max-h-[600px] leading-relaxed">
            {JSON.stringify(OPENAPI_SPEC, null, 2)}
          </pre>
        </div>
      )}

      {/* Interactive Swagger View */}
      {viewMode === 'swagger' && (
        <div className="space-y-4">
          {OPENAPI_SPEC.tags.map((tag) => {
            const endpointsInTag = filteredEndpoints.filter((e) => e.tag === tag.name);
            if (endpointsInTag.length === 0) return null;

            const isTagExpanded = expandedTags[tag.name] ?? true;

            return (
              <div key={tag.name} className="border-2 border-[#565f89] bg-[#16161E]">
                {/* Tag Header */}
                <button
                  onClick={() => toggleTag(tag.name)}
                  className="w-full p-3.5 bg-black border-b-2 border-[#565f89] flex items-center justify-between cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    {isTagExpanded ? <ChevronDown className="w-4 h-4 text-[#7dcfff]" /> : <ChevronRight className="w-4 h-4 text-[#7dcfff]" />}
                    <h3 className="font-bold text-white text-sm uppercase">{tag.name}</h3>
                    <span className="text-[#565f89] text-[11px] hidden sm:inline">— {tag.description}</span>
                  </div>
                  <span className="text-[10px] text-[#bb9af7] border border-[#565f89] px-1.5 py-0.2">
                    {endpointsInTag.length} ROUTES
                  </span>
                </button>

                {/* Endpoints List */}
                {isTagExpanded && (
                  <div className="p-3 space-y-2.5">
                    {endpointsInTag.map((endpoint) => {
                      const isExpanded = expandedEndpoints[endpoint.id] ?? false;
                      const isTrying = tryItOutState[endpoint.id] ?? false;
                      const result = executionResults[endpoint.id];

                      const isPost = endpoint.method === 'post';
                      const badgeBg = isPost ? 'bg-[#9ece6a] text-black' : 'bg-[#7dcfff] text-black';

                      return (
                        <div
                          key={endpoint.id}
                          className={`border-2 transition-none ${
                            isExpanded ? 'border-[#c0caf5] bg-black' : 'border-[#565f89] bg-[#16161E]'
                          }`}
                        >
                          {/* Endpoint Summary Bar */}
                          <div
                            onClick={() => toggleEndpoint(endpoint.id)}
                            className="p-3 flex items-center justify-between cursor-pointer select-none gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-16 text-center py-0.5 text-xs font-bold uppercase ${badgeBg}`}>
                                {endpoint.method}
                              </span>
                              <span className="font-bold text-white text-xs">{endpoint.path}</span>
                              <span className="text-[#9aa5ce] hidden md:inline text-[11px]">{endpoint.summary}</span>
                            </div>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-[#565f89]" />}
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="p-4 border-t-2 border-[#565f89] bg-[#16161E] space-y-4">
                              <p className="text-xs text-[#c0caf5] leading-relaxed">{endpoint.description}</p>

                              <div className="flex items-center justify-between border-y border-[#565f89] py-2">
                                <span className="font-bold text-white uppercase text-[11px]">PARAMETERS & PAYLOAD</span>
                                <button
                                  onClick={() => toggleTryItOut(endpoint.id, endpoint)}
                                  className={`px-3 py-1 font-bold text-xs uppercase border cursor-pointer ${
                                    isTrying ? 'bg-[#f7768e] text-black border-[#f7768e]' : 'bg-black text-[#7dcfff] border-[#7dcfff]'
                                  }`}
                                >
                                  {isTrying ? 'CANCEL' : 'TRY IT OUT'}
                                </button>
                              </div>

                              {/* Parameters */}
                              {endpoint.parameters && endpoint.parameters.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold text-[#7dcfff] uppercase">PATH PARAMETERS:</div>
                                  {endpoint.parameters.map((param) => (
                                    <div key={param.name} className="flex items-center gap-3 bg-black p-2 border border-[#565f89]">
                                      <span className="font-bold text-white w-32">{param.name}</span>
                                      <span className="text-[#565f89] text-[10px]">{param.schema.type}</span>
                                      {isTrying ? (
                                        <input
                                          type="text"
                                          value={endpointParamValues[endpoint.id]?.[param.name] ?? param.schema.example ?? ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setEndpointParamValues((p) => ({
                                              ...p,
                                              [endpoint.id]: { ...(p[endpoint.id] || {}), [param.name]: val },
                                            }));
                                          }}
                                          className="flex-1 bg-[#16161E] border border-[#565f89] px-2 py-1 text-white text-xs focus:outline-none focus:border-[#7dcfff]"
                                        />
                                      ) : (
                                        <span className="text-[#9aa5ce]">{param.description}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Request Body */}
                              {endpoint.requestBody && (
                                <div className="space-y-1.5">
                                  <div className="text-[11px] font-bold text-[#7dcfff] uppercase">REQUEST BODY (JSON):</div>
                                  {isTrying ? (
                                    <textarea
                                      rows={7}
                                      value={endpointBodyValues[endpoint.id] ?? JSON.stringify(endpoint.requestBody.example, null, 2)}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEndpointBodyValues((b) => ({ ...b, [endpoint.id]: val }));
                                      }}
                                      className="w-full bg-black border border-[#565f89] p-3 text-xs text-[#9ece6a] focus:outline-none focus:border-[#7dcfff] leading-relaxed font-mono"
                                    />
                                  ) : (
                                    <pre className="p-3 bg-black border border-[#565f89] text-[#9ece6a] overflow-x-auto text-[11px]">
                                      {JSON.stringify(endpoint.requestBody.example, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              )}

                              {/* Execute Button */}
                              {isTrying && (
                                <button
                                  onClick={() => handleExecute(endpoint)}
                                  className="w-full py-2.5 bg-[#9ece6a] hover:bg-white text-black font-extrabold uppercase text-xs cursor-pointer shadow-brutal-sm-green"
                                >
                                  ▶ EXECUTE HTTP REQUEST
                                </button>
                              )}

                              {/* Execution Result */}
                              {result && (
                                <div className="p-3.5 bg-black border-2 border-[#7dcfff] space-y-3">
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="text-[#7dcfff]">LIVE SERVER RESPONSE</span>
                                    <span className="border border-[#9ece6a] text-[#9ece6a] px-2 py-0.5 text-[10px]">
                                      HTTP {result.status} {result.statusText} ({result.timeMs}ms)
                                    </span>
                                  </div>

                                  <div>
                                    <div className="text-[10px] text-[#565f89] uppercase font-bold mb-1">GENERATED cURL:</div>
                                    <pre className="p-2 bg-[#16161E] border border-[#565f89] text-[#e0af68] text-[11px] overflow-x-auto">
                                      {result.curlCommand}
                                    </pre>
                                  </div>

                                  <div>
                                    <div className="text-[10px] text-[#565f89] uppercase font-bold mb-1">RESPONSE BODY:</div>
                                    <pre className="p-3 bg-[#16161E] border border-[#565f89] text-[#9ece6a] text-[11px] overflow-x-auto max-h-56">
                                      {JSON.stringify(result.responseBody, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
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
        </div>
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#16161E] border-4 border-[#9ece6a] p-6 max-w-md w-full shadow-brutal-lg-green">
            <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-2 mb-4">
              <h3 className="font-bold text-white uppercase">BEARER AUTHENTICATION (JWT)</h3>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-white hover:text-[#f7768e] font-bold">✕</button>
            </div>
            <p className="text-xs text-[#9aa5ce] mb-4">
              Enter PyJWT token returned from <code className="text-[#7dcfff]">/api/v1/auth/login</code> to authenticate subsequent Swagger requests.
            </p>
            <input
              type="text"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              className="w-full bg-black border border-[#565f89] p-2 text-xs text-[#9ece6a] focus:outline-none focus:border-[#9ece6a] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="px-4 py-2 bg-[#9ece6a] text-black font-bold uppercase text-xs cursor-pointer shadow-brutal-sm-green"
              >
                APPLY TOKEN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
