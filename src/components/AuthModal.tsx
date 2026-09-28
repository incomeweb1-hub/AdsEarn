import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, Zap } from 'lucide-react';
import { api } from '../services/api.ts';
import type { UserProfile } from '../types.ts';

interface AuthModalProps {
  initialReferral?: string;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialReferral, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferral || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(phone, password, referralCode);
        onSuccess(res.user);
      } else {
        const res = await api.login(phone, password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login('01712345678', 'password123');
      onSuccess(res.user);
    } catch {
      // If demo user was altered or not in fresh storage, register a random test user
      try {
        const randPhone = '017' + Math.floor(10000000 + Math.random() * 90000000);
        const res = await api.register(randPhone, 'password123');
        onSuccess(res.user);
      } catch (err: any) {
        setError(err.message || 'Quick login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col gap-5">
        {/* Title */}
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/40 mb-2">
            W
          </div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Watch & Earn</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRegister ? 'Create an account to start earning' : 'Login to your account'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              !isRegister ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              isRegister ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Referral Code <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="REF..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 disabled:opacity-50"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-medium text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant Demo Login</span>
          </button>
        </form>
      </div>
    </div>
  );
};
