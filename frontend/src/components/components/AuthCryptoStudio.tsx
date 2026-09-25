import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Lock,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Globe,
  UserCheck,
  AlertTriangle,
  Unlink,
  LogIn,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserData } from '../data/mockInitialData';
import { generateUUIDv7 } from '../dsa/uuid7';

interface AuthCryptoStudioProps {
  roommates: UserData[];
  onUpdateRoommate?: (updated: UserData) => void;
}

export const AuthCryptoStudio: React.FC<AuthCryptoStudioProps> = ({
  roommates,
  onUpdateRoommate,
}) => {
  // Selected Roommate Account for Multi-Auth Management
  const [selectedUserId, setSelectedUserId] = useState<string>(
    roommates[0]?.id || ''
  );

  const selectedUser =
    roommates.find((r) => r.id === selectedUserId) || roommates[0];

  // Google Auth Linking Form State
  const defaultGoogleEmail = selectedUser
    ? `${selectedUser.fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
    : 'user@gmail.com';
  const [googleEmailInput, setGoogleEmailInput] = useState<string>(defaultGoogleEmail);
  const [googleTokenInput, setGoogleTokenInput] = useState<string>(
    `ya29.sample_google_oauth2_id_token_${selectedUser?.id?.slice(-8) || 'abc123'}`
  );
  const [linkSuccessMessage, setLinkSuccessMessage] = useState<string | null>(null);
  const [linkErrorMessage, setLinkErrorMessage] = useState<string | null>(null);
  const [simulatedLoginResult, setSimulatedLoginResult] = useState<any | null>(null);
  const [activeTabSub, setActiveTabSub] = useState<'methods' | 'ed25519' | 'jwt'>('methods');

  // Ed25519 Keypair state
  const [privKey, setPrivKey] = useState(
    '4f1e8a9d3c2b1e0f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f'
  );
  const [pubKey, setPubKey] = useState(
    selectedUser?.ed25519PublicKey ||
      'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90'
  );
  const [challenge, setChallenge] = useState(
    'RoommateRouletteAuth:challenge_nonce_8f3a9e1d:1711230400'
  );
  const [signature, setSignature] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // JWT Token State
  const [activeJwt, setActiveJwt] = useState<string>(() =>
    generateJwtForUser(selectedUser)
  );

  function generateJwtForUser(user: UserData | undefined): string {
    if (!user) return '';
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        full_name: user.fullName,
        has_password: true,
        has_ed25519: true,
        has_google_auth: Boolean(user.googleSubId),
        google_sub_id: user.googleSubId || null,
        available_login_methods: [
          'password',
          'ed25519',
          ...(user.googleSubId ? ['google'] : []),
        ],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
        iss: 'roommate-roulette-auth',
      })
    );
    const mockSig = 'c2lnbmF0dXJlX2hhc2hfdmVyaWZ5X2JjcnlwdA';
    return `${header}.${payload}.${mockSig}`;
  }

  // Update selection
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = roommates.find((r) => r.id === userId);
    if (user) {
      setGoogleEmailInput(
        user.googleEmail ||
          `${user.fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
      );
      setGoogleTokenInput(
        `ya29.sample_google_oauth2_id_token_${user.id.slice(-8)}`
      );
      setPubKey(user.ed25519PublicKey);
      setLinkSuccessMessage(null);
      setLinkErrorMessage(null);
      setSimulatedLoginResult(null);
      setActiveJwt(generateJwtForUser(user));
    }
  };

  // Link Google Auth to Existing Account
  const handleLinkGoogleAuth = () => {
    if (!selectedUser) return;
    setLinkErrorMessage(null);

    // Compute deterministic sub_id
    const hashVal = Math.abs(
      googleTokenInput.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    );
    const generatedSubId = `google_sub_${hashVal}`;

    // Conflict check across other roommates
    const conflictUser = roommates.find(
      (r) => r.id !== selectedUser.id && r.googleSubId === generatedSubId
    );
    if (conflictUser) {
      setLinkErrorMessage(
        `Conflict: This Google identity is already claimed by ${conflictUser.fullName} (${conflictUser.email}).`
      );
      return;
    }

    const updatedUser: UserData = {
      ...selectedUser,
      googleSubId: generatedSubId,
      googleEmail: googleEmailInput || `${selectedUser.fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
    };

    if (onUpdateRoommate) {
      onUpdateRoommate(updatedUser);
    }

    // Refresh JWT
    setActiveJwt(generateJwtForUser(updatedUser));
    setLinkSuccessMessage(
      `✓ Google Auth successfully linked as an alternative login method! ${selectedUser.fullName} can now authenticate via password, Ed25519 key, or Google OAuth.`
    );
    setSimulatedLoginResult(null);
  };

  // Unlink Google Auth with Lockout Prevention
  const handleUnlinkGoogleAuth = () => {
    if (!selectedUser) return;
    setLinkErrorMessage(null);

    // Lockout check: must have at least password or ed25519
    const hasAlternative = selectedUser.hasPassword !== false || Boolean(selectedUser.ed25519PublicKey);
    if (!hasAlternative) {
      setLinkErrorMessage(
        'Cannot unlink Google Auth: user has no password or Ed25519 key configured. Configure an alternative method first to prevent account lockout.'
      );
      return;
    }

    const updatedUser: UserData = {
      ...selectedUser,
      googleSubId: undefined,
      googleEmail: undefined,
    };

    if (onUpdateRoommate) {
      onUpdateRoommate(updatedUser);
    }

    setActiveJwt(generateJwtForUser(updatedUser));
    setLinkSuccessMessage('Google Auth removed. Account now requires password or Ed25519 key.');
    setSimulatedLoginResult(null);
  };

  // Simulate Alternative Login with Google
  const handleSimulateGoogleLogin = () => {
    if (!selectedUser) return;
    if (!selectedUser.googleSubId) {
      setLinkErrorMessage('Cannot test Google login: this account has not linked Google Auth yet.');
      return;
    }

    // Simulated response from POST /api/v1/auth/google
    setSimulatedLoginResult({
      status: 200,
      endpoint: 'POST /api/v1/auth/google',
      message: 'Authentication successful via Alternative Google Login',
      matched_user: {
        id: selectedUser.id,
        email: selectedUser.email,
        full_name: selectedUser.fullName,
        google_sub_id: selectedUser.googleSubId,
        linked_google_email: selectedUser.googleEmail,
      },
      available_login_methods: ['password', 'ed25519', 'google'],
      token_issued: generateJwtForUser(selectedUser),
    });
  };

  const generateNewKeypair = () => {
    let priv = '';
    let pub = '';
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < 64; i++) {
      priv += hexChars[Math.floor(Math.random() * 16)];
      pub += hexChars[Math.floor(Math.random() * 16)];
    }
    setPrivKey(priv);
    setPubKey(pub);
    setSignature('');
    setIsVerified(null);
  };

  const requestNewChallenge = () => {
    const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setChallenge(`RoommateRouletteAuth:${nonce}:${Date.now()}`);
    setSignature('');
    setIsVerified(null);
  };

  const signChallenge = () => {
    let sig = '';
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < 128; i++) {
      sig += hexChars[Math.floor(Math.random() * 16)];
    }
    setSignature(sig);
    setIsVerified(true);
  };

  const verifySignature = () => {
    if (signature.length === 128 && pubKey.length === 64) {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Decode JWT payload
  let decodedPayload: any = {};
  try {
    const parts = activeJwt.split('.');
    if (parts.length >= 2) {
      decodedPayload = JSON.parse(atob(parts[1]));
    }
  } catch (err) {
    decodedPayload = { error: 'Failed to decode payload' };
  }

  const isGoogleLinked = Boolean(selectedUser?.googleSubId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Identity & Access Management (IAM)
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Multi-Provider: Google OAuth2 + Ed25519 + Bcrypt
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Roommate Authentication & Alternative Login Studio
            </h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
              Existing roommate accounts can link Google authentication as an alternative login method alongside Bcrypt passwords and Ed25519 zero-trust cryptographic keys.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 shrink-0">
            <button
              onClick={() => setActiveTabSub('methods')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTabSub === 'methods'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Account Multi-Auth
            </button>
            <button
              onClick={() => setActiveTabSub('ed25519')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTabSub === 'ed25519'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ed25519 Sandbox
            </button>
            <button
              onClick={() => setActiveTabSub('jwt')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTabSub === 'jwt'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PyJWT Inspector
            </button>
          </div>
        </div>
      </div>

      {/* Account Selector Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Select Existing Roommate Account:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {roommates.map((r) => {
              const isSelected = r.id === selectedUserId;
              const hasGoogle = Boolean(r.googleSubId);
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectUser(r.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 border ${
                    isSelected
                      ? 'bg-zinc-800 text-white border-emerald-500/50 shadow-sm'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/40 hover:text-zinc-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${r.avatarColor}`} />
                  <span>{r.fullName}</span>
                  {hasGoogle ? (
                    <span
                      title="Google Auth Linked"
                      className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    >
                      G
                    </span>
                  ) : (
                    <span
                      title="Password Only"
                      className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400"
                    >
                      Pw
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTabSub === 'methods' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Account Details & Available Login Methods */}
          <div className="lg:col-span-6 space-y-6">
            {/* Account Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl ${selectedUser?.avatarColor || 'bg-emerald-500'} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                  >
                    {selectedUser?.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedUser?.fullName}</h3>
                    <p className="text-xs text-zinc-400 font-mono">{selectedUser?.email}</p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      UUIDv7: {selectedUser?.id}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Active Account
                </span>
              </div>

              {/* Login Methods Status Grid */}
              <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Configured Authentication Methods
                </h4>

                {/* Method 1: Password */}
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-emerald-400 border border-zinc-800">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Password Authentication</div>
                      <div className="text-[11px] text-zinc-400 font-mono">Bcrypt salted hash</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                {/* Method 2: Ed25519 Public Key */}
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-violet-400 border border-zinc-800">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Ed25519 Keypair</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[200px]">
                        {selectedUser?.ed25519PublicKey
                          ? `${selectedUser.ed25519PublicKey.slice(0, 16)}...`
                          : 'Not set'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Active
                  </span>
                </div>

                {/* Method 3: Google Auth */}
                <div
                  className={`p-3 rounded-2xl border transition ${
                    isGoogleLinked
                      ? 'bg-blue-500/5 border-blue-500/30'
                      : 'bg-zinc-950 border-zinc-800/80'
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${
                        isGoogleLinked
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Google OAuth2 / OIDC</span>
                        {isGoogleLinked && (
                          <span className="text-[10px] text-blue-400 font-mono">
                            ({selectedUser?.googleEmail || 'Linked'})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {isGoogleLinked
                          ? `Sub: ${selectedUser?.googleSubId}`
                          : 'Alternative login not yet configured'}
                      </div>
                    </div>
                  </div>

                  {isGoogleLinked ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Linked
                      </span>
                      <button
                        onClick={handleUnlinkGoogleAuth}
                        title="Unlink Google Auth from this account"
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Not Linked
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated Google Sign-In Sandbox */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-blue-400" />
                Test Alternative Login via Google
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Demonstrates that authenticating with Google returns the exact existing account's UUID7 and preserves all chore queues & balances.
              </p>

              <button
                onClick={handleSimulateGoogleLogin}
                disabled={!isGoogleLinked}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl text-xs border border-zinc-700 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Simulate Google Sign-In for {selectedUser?.fullName}</span>
              </button>

              {simulatedLoginResult && (
                <div className="mt-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>{simulatedLoginResult.endpoint}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      HTTP 200 OK
                    </span>
                  </div>
                  <div className="text-zinc-300">{simulatedLoginResult.message}</div>
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-zinc-400">
                    <div>
                      <span className="text-zinc-500">Resolved User ID: </span>
                      <span className="text-emerald-400 font-bold">
                        {simulatedLoginResult.matched_user.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Email: </span>
                      <span className="text-white">{simulatedLoginResult.matched_user.email}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Google Sub ID: </span>
                      <span className="text-blue-400">
                        {simulatedLoginResult.matched_user.google_sub_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Available Methods: </span>
                      <span className="text-zinc-300">
                        {simulatedLoginResult.available_login_methods.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Link Google Auth Form & Interactive Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  {isGoogleLinked
                    ? 'Manage Linked Google Auth'
                    : 'Add Google Auth as Alternative Login Method'}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                Attaches a Google OAuth credential to <strong className="text-white">{selectedUser?.fullName}</strong> ({selectedUser?.email}) using the backend endpoint <code className="text-blue-400 font-mono text-xs">POST /api/v1/auth/link-google</code>.
              </p>

              <div className="space-y-4">
                {/* Google Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Google Account Email to Link
                  </label>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="e.g. alice.chen@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Note: Can differ from apartment email. Both will resolve to this roommate's UUIDv7.
                  </p>
                </div>

                {/* Google ID Token / Credential */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Google OAuth2 / OIDC Credential Token</span>
                    <button
                      onClick={() =>
                        setGoogleTokenInput(
                          `ya29.sample_token_${Date.now().toString(16)}_${Math.random()
                            .toString(36)
                            .slice(2, 8)}`
                        )
                      }
                      className="text-blue-400 hover:text-blue-300 text-[11px] font-mono flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate Mock Token
                    </button>
                  </div>
                  <input
                    type="text"
                    value={googleTokenInput}
                    onChange={(e) => setGoogleTokenInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-blue-300 font-mono focus:outline-none focus:border-blue-500 truncate"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    In production, retrieved from <code className="text-zinc-400 font-mono">google.accounts.id.renderButton()</code> or OAuth authorization code exchange.
                  </p>
                </div>

                {/* Link Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleLinkGoogleAuth}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <Globe className="w-4 h-4" />
                    <span>
                      {isGoogleLinked
                        ? 'Update / Re-link Google Credentials'
                        : `Link Google Auth to ${selectedUser?.fullName}`}
                    </span>
                  </button>
                </div>

                {/* Success Message */}
                {linkSuccessMessage && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{linkSuccessMessage}</span>
                  </div>
                )}

                {/* Error Message */}
                {linkErrorMessage && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{linkErrorMessage}</span>
                  </div>
                )}

                {/* Algorithmic Security Notice */}
                <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-xs space-y-2 text-zinc-400">
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Multi-Auth Security Guarantees:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400">
                    <li>
                      <strong>Zero-Collision ID:</strong> Google sub ID is validated with a unique index constraint. No duplicate claim across roommates is permitted.
                    </li>
                    <li>
                      <strong>Lockout Prevention:</strong> Unlinking Google Auth requires at least one existing fallback method (Password or Ed25519 key).
                    </li>
                    <li>
                      <strong>Preserved UUIDv7 State:</strong> Linking does not create a new user; all chores, rotation order, and debt ledger balances stay bound to the original primary key.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTabSub === 'ed25519' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Ed25519 Signing & Verification */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" />
                  Ed25519 Public Key Cryptography Sandbox
                </h3>
                <button
                  onClick={generateNewKeypair}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-3 py-1.5 rounded-xl text-xs border border-zinc-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  Fresh Keypair
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                32-byte keys with Edwards-curve Digital Signature Algorithm. Used in{' '}
                <code className="text-emerald-400 font-mono text-xs">/api/v1/auth/ed25519-login</code>.
              </p>

              <div className="space-y-4">
                {/* Public Key */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Ed25519 Public Key (Stored in DB User model)</span>
                    <button
                      onClick={() => copyToClipboard(pubKey, 'pub')}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      {copiedKey === 'pub' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy Hex
                    </button>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 break-all select-all">
                    {pubKey}
                  </div>
                </div>

                {/* Private Key */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <Lock className="w-3.5 h-3.5" />
                      Private Signing Key (Client Device Only)
                    </span>
                    <button
                      onClick={() => copyToClipboard(privKey, 'priv')}
                      className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono text-[11px]"
                    >
                      {copiedKey === 'priv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-500 break-all select-all">
                    {privKey}
                  </div>
                </div>

                {/* Challenge Nonce */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Server Challenge Nonce (/api/v1/auth/ed25519-challenge)</span>
                    <button
                      onClick={requestNewChallenge}
                      className="text-blue-400 hover:text-blue-300 text-[11px] font-mono flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      New Nonce
                    </button>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-blue-300 break-all">
                    {challenge}
                  </div>
                </div>

                {/* Cryptographic Signature */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Signature Vector (64 Bytes / 128 Hex Characters)</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-400 break-all min-h-[52px]">
                    {signature || (
                      <span className="text-zinc-600">Click 'Sign Challenge' below to generate signature</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={signChallenge}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Sign Challenge
                  </button>
                  <button
                    onClick={verifySignature}
                    disabled={!signature}
                    className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold rounded-xl text-xs transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Verify Signature
                  </button>
                </div>

                {/* Verification Result */}
                {isVerified !== null && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                      isVerified
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Signature cryptographically verified! Token issued.</span>
                      </>
                    ) : (
                      <span>Signature verification failed. Private/Public key mismatch.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-white mb-2">Edwards-Curve DSA Protocol</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Ed25519 provides 128-bit security level with Curve25519 and SHA-512 hashing. No vulnerable random nonces in signing.
              </p>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Curve:</span>
                  <span className="text-white">Curve25519 (Twisted Edwards)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Key Length:</span>
                  <span className="text-emerald-400 font-bold">32 Bytes (256 bits)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Signature Length:</span>
                  <span className="text-emerald-400 font-bold">64 Bytes (512 bits)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Hashing:</span>
                  <span className="text-violet-400">SHA-512</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTabSub === 'jwt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* JWT Token Inspector & UUIDv7 Showcase */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-white mb-2">PyJWT Bearer Token Claims</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Decoded JSON Web Token payload issued by FastAPI <code className="text-blue-400 font-mono text-xs">/auth/login</code> or <code className="text-blue-400 font-mono text-xs">/auth/link-google</code>.
              </p>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">sub (UUIDv7 User ID):</span>
                  <span className="text-emerald-400 font-bold break-all text-right">{decodedPayload.sub}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">email:</span>
                  <span className="text-white">{decodedPayload.email}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">full_name:</span>
                  <span className="text-white">{decodedPayload.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">has_google_auth:</span>
                  <span className={decodedPayload.has_google_auth ? 'text-blue-400 font-bold' : 'text-zinc-500'}>
                    {String(Boolean(decodedPayload.has_google_auth))}
                  </span>
                </div>
                {decodedPayload.google_sub_id && (
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500">google_sub_id:</span>
                    <span className="text-blue-300 font-bold">{decodedPayload.google_sub_id}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">login_methods:</span>
                  <span className="text-emerald-300 font-bold">
                    {Array.isArray(decodedPayload.available_login_methods)
                      ? decodedPayload.available_login_methods.join(', ')
                      : 'password, ed25519'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">iss:</span>
                  <span className="text-violet-400">{decodedPayload.iss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">algorithm:</span>
                  <span className="text-zinc-300">HS256 (Bcrypt salted)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                RFC 9562 Monotonic UUIDv7 Generator
              </h4>
              <p className="text-xs text-zinc-400 mb-3">
                All primary keys in SQLite are time-ordered UUIDv7 strings. Test generating a live UUIDv7:
              </p>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>{generateUUIDv7()}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Version 7
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
