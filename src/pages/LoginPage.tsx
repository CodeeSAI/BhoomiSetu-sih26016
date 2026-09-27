// ============================================================
// BhoomiSetu — Next-Generation GovTech Authentication Gateway
// Asymmetric Command Layout, Deep Luminous Atmospheric Lighting
// ============================================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck,
  AlertTriangle, Copy, Check, ArrowLeft, KeyRound, Globe2,
  Compass, Cpu, Layers, Sparkles, HelpCircle
} from 'lucide-react';
import { DEMO_ACCOUNTS, type DemoAccount } from '../data/demoAccounts';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [activeAccountTab, setActiveAccountTab] = useState<'admin' | 'field' | 'financial'>('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please provide your username or registered official email.');
      return;
    }
    if (!password) {
      setError('Please provide your authentication password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'Invalid credentials. Please select a valid demo account below.');
      }
    } catch (err: any) {
      setError('An error occurred during authentication. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (account: DemoAccount) => {
    setIdentifier(account.username);
    setPassword(account.password);
    setError(null);
    setCopiedAccount(account.username);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070E1B] text-white flex flex-col justify-between relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* ============================================================
          Atmospheric Lighting & Background System (Section 4 & 23)
          ============================================================ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Soft radial glow points */}
        <div className="absolute -top-[15%] left-[10%] w-[650px] h-[650px] bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-[45%] -left-[10%] w-[500px] h-[500px] bg-gradient-to-tr from-cyan-600/15 via-teal-600/10 to-transparent rounded-full blur-[100px]" />
        <div className="absolute -bottom-[20%] right-[10%] w-[700px] h-[700px] bg-gradient-to-tl from-violet-600/15 via-blue-600/10 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] bg-gradient-to-bl from-emerald-600/10 via-cyan-500/10 to-transparent rounded-full blur-[90px]" />

        {/* Abstract Survey / Parcel Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="survey-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="24" cy="24" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#survey-grid)" />
        </svg>
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-surface-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft size={14} /> Back to Public Portal
        </Link>

        {/* Environment Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-semibold tracking-wide backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span>DEMO ENVIRONMENT • SYNTHETIC DATA</span>
        </div>
      </header>

      {/* Main Two-Panel Content */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center flex-1">
        {/* ============================================================
            LEFT PANEL: Brand / Identity & Geo-Spatial Grid Showcase
            ============================================================ */}
        <div className="lg:col-span-6 space-y-6 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-300 backdrop-blur-md">
            <Sparkles size={13} className="text-cyan-400" />
            <span>GovTech Unified Mission SIH26016</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron via-amber-500 to-primary-600 flex items-center justify-center shadow-lg shadow-saffron/20 border border-white/20">
                <MapPin size={24} className="text-white drop-shadow-xs" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                  BhoomiSetu
                  <span className="text-lg font-medium text-amber-400 font-serif">भूमिसेतु</span>
                </h1>
                <p className="text-xs text-cyan-300 font-mono tracking-widest uppercase">
                  National Portal for Land Acquisition Intelligence
                </p>
              </div>
            </div>
            
            <p className="text-lg sm:text-xl font-medium text-surface-200 leading-relaxed pt-2">
              One connected workflow for land, people, compensation and infrastructure.
            </p>
            <p className="text-xs text-surface-400 leading-relaxed">
              Standardized digital governance under the RFCTLARR Act, 2013, integrating DILRMP cadastral maps, ULPIN / Bhu-Aadhar geo-verification, Section 11/19 Gazette notifications, and Direct Benefit Transfer.
            </p>
          </div>

          {/* Abstract Geo-Coordinate Metrics Pill */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono mb-1">
                <Compass size={13} />
                <span>Geo-Spatial</span>
              </div>
              <p className="text-base font-bold text-white font-mono">100%</p>
              <p className="text-[10px] text-surface-400">Authoritative Lat/Long</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono mb-1">
                <Layers size={13} />
                <span>ULPIN Ready</span>
              </div>
              <p className="text-base font-bold text-white font-mono">14-Digit</p>
              <p className="text-[10px] text-surface-400">Bhu-Aadhar Standard</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[11px] text-violet-400 font-mono mb-1">
                <Cpu size={13} />
                <span>Security</span>
              </div>
              <p className="text-base font-bold text-white font-mono">9 Tiers</p>
              <p className="text-[10px] text-surface-400">Enforced RBAC Matrix</p>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT PANEL: Premium Frosted Glass Authentication Card
            ============================================================ */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none">
          <div className="relative rounded-2xl p-6 sm:p-8 bg-white/[0.07] border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Luminous border top highlight */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-indigo-400 opacity-80" />

            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-between">
                <span>Sign In to Platform</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  SECURE AUTH
                </span>
              </h2>
              <p className="text-xs text-surface-400 mt-1">
                Authenticate with your official jurisdictional credentials
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertTriangle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                  Username or Official Email
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Enter username (e.g. admin, lao, district)"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder:text-surface-500 focus:outline-none focus:border-blue-400 focus:bg-white/[0.1] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-surface-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('Demo credentials are listed below. Click any demo account to auto-fill.');
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. Admin@123)"
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder:text-surface-500 focus:outline-none focus:border-blue-400 focus:bg-white/[0.1] focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-surface-400 hover:text-surface-200">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={e => setRememberSession(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-0"
                  />
                  <span>Remember session (8h TTL)</span>
                </label>
              </div>

              {/* Submit Button (Gradient primary blue -> indigo per Section 23) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/45 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials & Permissions...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* ============================================================
                DEMO ACCOUNTS HELPER ACCORDION (Click to Fill without auto-login)
                ============================================================ */}
            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <KeyRound size={13} className="text-cyan-400" />
                  <span className="text-xs font-bold text-white">Demo Accounts</span>
                </div>
                <span className="text-[10px] text-surface-400 font-mono">Click to load into fields</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {DEMO_ACCOUNTS.map(acc => {
                  const isFilled = copiedAccount === acc.username;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => fillCredentials(acc)}
                      className={`text-left p-2 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isFilled
                          ? 'bg-blue-600/30 border-blue-400 text-white shadow-xs'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/20 text-surface-300'
                      }`}
                    >
                      <div className="min-w-0 pr-1.5">
                        <p className="font-semibold text-white truncate text-[11px] leading-tight">{acc.role}</p>
                        <p className="text-[9px] text-surface-400 font-mono truncate">{acc.username}</p>
                      </div>
                      <div className="shrink-0">
                        {isFilled ? (
                          <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold bg-emerald-500/20 px-1 py-0.5 rounded border border-emerald-500/30">
                            <Check size={10} /> Filled
                          </span>
                        ) : (
                          <span className="text-[9px] text-surface-400 font-mono bg-white/5 px-1 py-0.5 rounded border border-white/10">
                            Fill
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/5 text-center text-[11px] text-surface-500">
        <p>
          BhoomiSetu Demonstration System • Synthetic Data for Hackathon Evaluation • RFCTLARR Act, 2013 Compliance
        </p>
      </footer>
    </div>
  );
}
