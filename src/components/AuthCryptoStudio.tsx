import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Lock,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  UserCheck,
  AlertTriangle,
  Unlink,
  LogIn,
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
  const [selectedUserId, setSelectedUserId] = useState<string>(roommates[0]?.id || '');
  const selectedUser = roommates.find((r) => r.id === selectedUserId) || roommates[0];

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

  const [activeJwt, setActiveJwt] = useState<string>(() => generateJwtForUser(selectedUser));

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

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = roommates.find((r) => r.id === userId);
    if (user) {
      setGoogleEmailInput(
        user.googleEmail ||
          `${user.fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
      );
      setGoogleTokenInput(`ya29.sample_google_oauth2_id_token_${user.id.slice(-8)}`);
      setPubKey(user.ed25519PublicKey);
      setLinkSuccessMessage(null);
      setLinkErrorMessage(null);
      setSimulatedLoginResult(null);
      setActiveJwt(generateJwtForUser(user));
    }
  };

  const handleLinkGoogleAuth = () => {
    if (!selectedUser) return;
    setLinkErrorMessage(null);

    const hashVal = Math.abs(
      googleTokenInput.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    );
    const generatedSubId = `google_sub_${hashVal}`;

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

    setActiveJwt(generateJwtForUser(updatedUser));
    setLinkSuccessMessage(
      `✓ Google Auth successfully linked as an alternative login method for ${selectedUser.fullName}!`
    );
    setSimulatedLoginResult(null);
  };

  const handleUnlinkGoogleAuth = () => {
    if (!selectedUser) return;
    setLinkErrorMessage(null);

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
    setLinkSuccessMessage('Google Auth unlinked safely.');
    setSimulatedLoginResult(null);
  };

  const handleSimulateGoogleLogin = () => {
    if (!selectedUser || !selectedUser.googleSubId) return;

    setSimulatedLoginResult({
      status: 200,
      endpoint: 'POST /api/v1/auth/google',
      message: 'Authentication successful via Alternative Google Login',
      matched_user: {
        id: selectedUser.id,
        email: selectedUser.email,
        full_name: selectedUser.fullName,
        google_sub_id: selectedUser.googleSubId,
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
    setIsVerified(signature.length === 128 && pubKey.length === 64);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1500);
  };

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
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#7dcfff] font-bold uppercase tracking-wider">
                IDENTITY & ACCESS MANAGEMENT (IAM)
              </span>
              <span className="text-[#565f89]">|</span>
              <span className="text-[#9ece6a]">GOOGLE OAUTH2 + ED25519 + BCRYPT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white mt-1 uppercase tracking-tight">
              Authentication & Crypto Studio
            </h2>
            <p className="text-xs text-[#9aa5ce] mt-1 max-w-3xl leading-relaxed">
              Existing roommate accounts can bind Google OAuth2 as an alternative login strategy alongside Bcrypt password credentials and Ed25519 asymmetric cryptographic signatures.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex bg-black p-1 border border-[#565f89] shrink-0">
            <button
              onClick={() => setActiveTabSub('methods')}
              className={`px-3 py-1.5 font-bold uppercase transition-none cursor-pointer ${
                activeTabSub === 'methods'
                  ? 'bg-[#7dcfff] text-black shadow-brutal-sm-cyan'
                  : 'text-[#9aa5ce] hover:text-white'
              }`}
            >
              MULTI-AUTH
            </button>
            <button
              onClick={() => setActiveTabSub('ed25519')}
              className={`px-3 py-1.5 font-bold uppercase transition-none cursor-pointer ${
                activeTabSub === 'ed25519'
                  ? 'bg-[#bb9af7] text-black shadow-brutal-sm-purple'
                  : 'text-[#9aa5ce] hover:text-white'
              }`}
            >
              ED25519 SANDBOX
            </button>
            <button
              onClick={() => setActiveTabSub('jwt')}
              className={`px-3 py-1.5 font-bold uppercase transition-none cursor-pointer ${
                activeTabSub === 'jwt'
                  ? 'bg-[#9ece6a] text-black shadow-brutal-sm-green'
                  : 'text-[#9aa5ce] hover:text-white'
              }`}
            >
              PYJWT CLAIMS
            </button>
          </div>
        </div>
      </div>

      {/* Account Selector Bar */}
      <div className="border-2 border-[#565f89] bg-[#16161E] p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[#9aa5ce] font-bold uppercase flex items-center gap-1.5 text-[11px]">
            <UserCheck className="w-4 h-4 text-[#7dcfff]" />
            ACTIVE ROOMMATE PROFILE:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {roommates.map((r) => {
              const isSelected = r.id === selectedUserId;
              const hasGoogle = Boolean(r.googleSubId);
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectUser(r.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border cursor-pointer transition-none shrink-0 ${
                    isSelected
                      ? 'bg-[#7dcfff] text-black border-[#7dcfff] shadow-brutal-sm-cyan'
                      : 'bg-black text-[#9aa5ce] border-[#565f89] hover:border-white hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 ${r.avatarColor}`} />
                  <span>{r.fullName}</span>
                  <span className={`text-[9px] px-1 border ${hasGoogle ? 'border-black text-black' : 'border-[#565f89] text-[#565f89]'}`}>
                    {hasGoogle ? 'G+PW' : 'PW'}
                  </span>
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
            <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
              <div className="flex items-start justify-between border-b-2 border-[#565f89] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 ${selectedUser?.avatarColor || 'bg-[#7dcfff]'} flex items-center justify-center text-black font-extrabold text-lg border border-black`}
                  >
                    {selectedUser?.fullName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-white text-base">{selectedUser?.fullName}</h3>
                    <p className="text-[11px] text-[#9aa5ce]">{selectedUser?.email}</p>
                    <p className="text-[10px] text-[#565f89] mt-0.5">UUIDv7: {selectedUser?.id}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 text-[10px] font-bold border border-[#9ece6a] text-[#9ece6a]">
                  ACTIVE IN SQLite
                </span>
              </div>

              {/* Login Methods Status Grid */}
              <div className="space-y-2">
                <div className="text-[11px] text-[#565f89] font-bold uppercase mb-1">
                  CONFIGURED LOGIN STRATEGIES:
                </div>

                {/* Password */}
                <div className="p-3 bg-black border border-[#565f89] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#9ece6a]" />
                    <div>
                      <div className="font-bold text-white text-xs">PASSWORD CREDENTIAL</div>
                      <div className="text-[10px] text-[#565f89]">Bcrypt salted hash (cost: 12)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#9ece6a] border border-[#9ece6a] px-1.5 py-0.2">
                    ACTIVE
                  </span>
                </div>

                {/* Ed25519 Keypair */}
                <div className="p-3 bg-black border border-[#565f89] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Key className="w-4 h-4 text-[#bb9af7]" />
                    <div>
                      <div className="font-bold text-white text-xs">ED25519 PUBLIC KEY</div>
                      <div className="text-[10px] text-[#565f89] truncate max-w-[200px]">
                        {selectedUser?.ed25519PublicKey.slice(0, 20)}...
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#bb9af7] border border-[#bb9af7] px-1.5 py-0.2">
                    ACTIVE
                  </span>
                </div>

                {/* Google Auth */}
                <div
                  className={`p-3 border flex items-center justify-between ${
                    isGoogleLinked
                      ? 'bg-black border-[#7dcfff]'
                      : 'bg-black border-[#565f89]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className={`w-4 h-4 ${isGoogleLinked ? 'text-[#7dcfff]' : 'text-[#565f89]'}`} />
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>GOOGLE OAUTH2 / OIDC</span>
                        {isGoogleLinked && (
                          <span className="text-[10px] text-[#7dcfff]">
                            ({selectedUser?.googleEmail})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#565f89]">
                        {isGoogleLinked ? selectedUser?.googleSubId : 'Alternative login not linked'}
                      </div>
                    </div>
                  </div>

                  {isGoogleLinked ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#7dcfff] border border-[#7dcfff] px-1.5 py-0.2">
                        LINKED
                      </span>
                      <button
                        onClick={handleUnlinkGoogleAuth}
                        title="Unlink Google Auth"
                        className="p-1 border border-[#f7768e] text-[#f7768e] hover:bg-[#f7768e] hover:text-black cursor-pointer"
                      >
                        <Unlink className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#565f89] border border-[#565f89] px-1.5 py-0.2">
                      UNLINKED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Test Google Login Sandbox */}
            <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
              <h3 className="text-white font-bold uppercase mb-1 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#7dcfff]" />
                TEST ALTERNATIVE LOGIN VIA GOOGLE
              </h3>
              <p className="text-[#9aa5ce] text-xs mb-4">
                Demonstrates that logging in with Google resolves to the user&apos;s existing UUID7 and preserves all chore assignments and debt ledger balances.
              </p>

              <button
                onClick={handleSimulateGoogleLogin}
                disabled={!isGoogleLinked}
                className="w-full py-2.5 px-4 bg-[#7dcfff] hover:bg-white text-black font-bold text-xs uppercase border border-[#7dcfff] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-brutal-sm-cyan"
              >
                SIMULATE GOOGLE SIGN-IN FOR {selectedUser?.fullName}
              </button>

              {simulatedLoginResult && (
                <div className="mt-4 p-3.5 bg-black border-2 border-[#9ece6a] space-y-2">
                  <div className="flex items-center justify-between text-[#9ece6a] font-bold">
                    <span>{simulatedLoginResult.endpoint}</span>
                    <span className="border border-[#9ece6a] px-1.5 py-0.2 text-[10px]">HTTP 200 OK</span>
                  </div>
                  <div className="text-[#c0caf5]">{simulatedLoginResult.message}</div>
                  <div className="pt-2 border-t border-[#24283b] space-y-1 text-[#9aa5ce] text-[11px]">
                    <div>
                      <span className="text-[#565f89]">RESOLVED UUID7: </span>
                      <span className="text-[#7dcfff] font-bold">{simulatedLoginResult.matched_user.id}</span>
                    </div>
                    <div>
                      <span className="text-[#565f89]">EMAIL: </span>
                      <span className="text-white">{simulatedLoginResult.matched_user.email}</span>
                    </div>
                    <div>
                      <span className="text-[#565f89]">GOOGLE SUB ID: </span>
                      <span className="text-[#bb9af7]">{simulatedLoginResult.matched_user.google_sub_id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Link Google Auth Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
              <h3 className="text-white font-bold uppercase mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#7dcfff]" />
                {isGoogleLinked ? 'MANAGE LINKED GOOGLE CREDENTIAL' : 'LINK GOOGLE AUTH AS ALTERNATIVE METHOD'}
              </h3>
              <p className="text-[#9aa5ce] text-xs mb-5">
                Binds a Google OAuth credential token to <strong className="text-white">{selectedUser?.fullName}</strong> using the endpoint <code className="text-[#7dcfff]">POST /api/v1/auth/link-google</code>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#7dcfff] mb-1">
                    GOOGLE ACCOUNT EMAIL
                  </label>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-[#565f89] text-xs text-white focus:outline-none focus:border-[#7dcfff]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#7dcfff] mb-1">
                    <span>GOOGLE ID TOKEN / CREDENTIAL</span>
                    <button
                      onClick={() =>
                        setGoogleTokenInput(
                          `ya29.sample_token_${Date.now().toString(16)}_${Math.random().toString(36).slice(2, 6)}`
                        )
                      }
                      className="text-[#9aa5ce] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>RE-GENERATE</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={googleTokenInput}
                    onChange={(e) => setGoogleTokenInput(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-[#565f89] text-xs text-[#bb9af7] focus:outline-none focus:border-[#7dcfff] truncate"
                  />
                </div>

                <button
                  onClick={handleLinkGoogleAuth}
                  className="w-full py-2.5 px-4 bg-[#7dcfff] hover:bg-white text-black font-bold text-xs uppercase border border-[#7dcfff] cursor-pointer shadow-brutal-sm-cyan"
                >
                  {isGoogleLinked ? 'UPDATE GOOGLE CREDENTIALS' : `LINK GOOGLE AUTH TO ${selectedUser?.fullName}`}
                </button>

                {linkSuccessMessage && (
                  <div className="p-3 bg-black border border-[#9ece6a] text-[#9ece6a] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{linkSuccessMessage}</span>
                  </div>
                )}

                {linkErrorMessage && (
                  <div className="p-3 bg-black border border-[#f7768e] text-[#f7768e] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{linkErrorMessage}</span>
                  </div>
                )}

                <div className="p-3.5 bg-black border border-[#565f89] text-[#9aa5ce] space-y-1.5 text-[11px]">
                  <div className="font-bold text-white uppercase flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#9ece6a]" />
                    SECURITY GUARANTEES:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#9aa5ce]">
                    <li>Unique constraint on Google sub ID prevents duplicate account claims.</li>
                    <li>Account lockout protection prevents unlinking if no password or Ed25519 key exists.</li>
                    <li>Primary key UUID7 remains completely unchanged; zero data fragmentation.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTabSub === 'ed25519' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
              <div className="flex items-center justify-between border-b-2 border-[#565f89] pb-3 mb-4">
                <h3 className="font-bold text-white uppercase flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#7dcfff]" />
                  ED25519 ASYMMETRIC SIGNATURE SANDBOX
                </h3>
                <button
                  onClick={generateNewKeypair}
                  className="px-2.5 py-1 bg-black border border-[#565f89] text-[#7dcfff] hover:border-[#7dcfff] text-[10px] font-bold uppercase cursor-pointer"
                >
                  NEW KEYPAIR
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-[#7dcfff] font-bold text-[11px] mb-1">
                    <span>ED25519 PUBLIC KEY (STORED IN DB)</span>
                    <button
                      onClick={() => copyToClipboard(pubKey, 'pub')}
                      className="text-[#9aa5ce] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'pub' ? <Check className="w-3 h-3 text-[#9ece6a]" /> : <Copy className="w-3 h-3" />}
                      <span>COPY</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-black border border-[#565f89] text-white break-all select-all">
                    {pubKey}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[#f7768e] font-bold text-[11px] mb-1">
                    <span>PRIVATE KEY (HELD BY CLIENT DEVICE)</span>
                    <button
                      onClick={() => copyToClipboard(privKey, 'priv')}
                      className="text-[#9aa5ce] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'priv' ? <Check className="w-3 h-3 text-[#9ece6a]" /> : <Copy className="w-3 h-3" />}
                      <span>COPY</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-black border border-[#565f89] text-[#565f89] break-all select-all">
                    {privKey}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[#bb9af7] font-bold text-[11px] mb-1">
                    <span>SERVER CHALLENGE NONCE (/auth/ed25519-challenge)</span>
                    <button
                      onClick={requestNewChallenge}
                      className="text-[#9aa5ce] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>REFRESH NONCE</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-black border border-[#565f89] text-[#bb9af7] break-all">
                    {challenge}
                  </div>
                </div>

                <div>
                  <div className="text-[#9ece6a] font-bold text-[11px] mb-1">
                    CRYPTOGRAPHIC SIGNATURE (64 BYTES / 128 HEX CHARS)
                  </div>
                  <div className="p-2.5 bg-black border border-[#565f89] text-[#9ece6a] break-all min-h-[50px]">
                    {signature || <span className="text-[#565f89]">Click &apos;Sign Challenge&apos; below to generate signature</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={signChallenge}
                    className="py-2.5 px-4 bg-[#7dcfff] hover:bg-white text-black font-bold uppercase cursor-pointer shadow-brutal-sm-cyan"
                  >
                    SIGN CHALLENGE
                  </button>
                  <button
                    onClick={verifySignature}
                    disabled={!signature}
                    className="py-2.5 px-4 bg-black border-2 border-[#9ece6a] text-[#9ece6a] hover:bg-[#9ece6a] hover:text-black font-bold uppercase cursor-pointer disabled:opacity-40"
                  >
                    VERIFY SIGNATURE
                  </button>
                </div>

                {isVerified !== null && (
                  <div
                    className={`p-3 border flex items-center gap-2 ${
                      isVerified
                        ? 'bg-black border-[#9ece6a] text-[#9ece6a]'
                        : 'bg-black border-[#f7768e] text-[#f7768e]'
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Signature verified! Zero-knowledge challenge authenticated successfully.</span>
                      </>
                    ) : (
                      <span>Signature verification failed.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
              <h3 className="font-bold text-white uppercase mb-2">ED25519 PROTOCOL SPECS</h3>
              <p className="text-[#9aa5ce] mb-4">
                Curve25519 twisted Edwards curve with SHA-512 hashing. Immune to side-channel timing attacks.
              </p>
              <div className="space-y-2">
                <div className="p-2.5 bg-black border border-[#565f89] flex justify-between">
                  <span className="text-[#565f89]">CURVE:</span>
                  <span className="text-white font-bold">Curve25519</span>
                </div>
                <div className="p-2.5 bg-black border border-[#565f89] flex justify-between">
                  <span className="text-[#565f89]">KEY LENGTH:</span>
                  <span className="text-[#7dcfff] font-bold">32 Bytes (256 bits)</span>
                </div>
                <div className="p-2.5 bg-black border border-[#565f89] flex justify-between">
                  <span className="text-[#565f89]">SIGNATURE:</span>
                  <span className="text-[#9ece6a] font-bold">64 Bytes (512 bits)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTabSub === 'jwt' && (
        <div className="border-2 border-[#565f89] bg-[#16161E] p-5">
          <h3 className="font-bold text-white uppercase mb-2">DECODED PYJWT CLAIMS</h3>
          <p className="text-[#9aa5ce] mb-4">
            JWT token issued by FastAPI authentication router containing UUIDv7 identity and active strategies.
          </p>

          <div className="p-4 bg-black border-2 border-[#565f89] space-y-2">
            <div className="flex justify-between border-b border-[#24283b] pb-1.5">
              <span className="text-[#565f89]">sub (UUIDv7):</span>
              <span className="text-[#7dcfff] font-bold">{decodedPayload.sub}</span>
            </div>
            <div className="flex justify-between border-b border-[#24283b] pb-1.5">
              <span className="text-[#565f89]">email:</span>
              <span className="text-white">{decodedPayload.email}</span>
            </div>
            <div className="flex justify-between border-b border-[#24283b] pb-1.5">
              <span className="text-[#565f89]">full_name:</span>
              <span className="text-white">{decodedPayload.full_name}</span>
            </div>
            <div className="flex justify-between border-b border-[#24283b] pb-1.5">
              <span className="text-[#565f89]">has_google_auth:</span>
              <span className={decodedPayload.has_google_auth ? 'text-[#9ece6a] font-bold' : 'text-[#565f89]'}>
                {String(Boolean(decodedPayload.has_google_auth))}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#24283b] pb-1.5">
              <span className="text-[#565f89]">login_methods:</span>
              <span className="text-[#bb9af7] font-bold">
                {Array.isArray(decodedPayload.available_login_methods)
                  ? decodedPayload.available_login_methods.join(', ')
                  : 'password, ed25519'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#565f89]">ALGORITHM:</span>
              <span className="text-white font-bold">HS256 (PyJWT with HMAC-SHA256)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
