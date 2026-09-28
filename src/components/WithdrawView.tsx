import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { PaymentMethod, WithdrawalRequest } from '../types.ts';
import { api } from '../services/api.ts';

interface WithdrawViewProps {
  balance: number;
  onBalanceUpdated: (newBalance: number) => void;
}

export const WithdrawView: React.FC<WithdrawViewProps> = ({ balance, onBalanceUpdated }) => {
  const [method, setMethod] = useState<PaymentMethod>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    loadMyWithdrawals();
  }, []);

  const loadMyWithdrawals = async () => {
    try {
      const data = await api.getMyWithdrawals();
      setRecentWithdrawals(data);
    } catch {
      // ignore
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numAmount = Number(amount);
    if (!accountNumber || accountNumber.trim().length < 11) {
      setError('Enter a valid 11-digit account number (e.g. 01XXXXXXXXX)');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount < 50) {
      setError('Minimum withdrawal is ৳50');
      return;
    }

    if (numAmount > balance) {
      setError('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.requestWithdrawal(method, accountNumber.trim(), numAmount);
      if (res.success) {
        onBalanceUpdated(res.newBalance);
        setSuccess(`Withdrawal request for ৳${numAmount} submitted for admin approval`);
        setAmount('');
        loadMyWithdrawals();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 py-2">
      {/* Available Balance Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Available Balance</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            ৳{balance.toFixed(2)}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 text-blue-400">
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleWithdraw} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        {/* Method Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-300">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('bKash')}
              className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                method === 'bKash'
                  ? 'bg-[#e2136e] text-white shadow-lg shadow-[#e2136e]/20 ring-2 ring-[#e2136e]'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              bKash
            </button>
            <button
              type="button"
              onClick={() => setMethod('Nagad')}
              className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                method === 'Nagad'
                  ? 'bg-[#f7941d] text-white shadow-lg shadow-[#f7941d]/20 ring-2 ring-[#f7941d]'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Nagad
            </button>
          </div>
        </div>

        {/* Account Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Account Number</label>
          <input
            type="tel"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 font-mono"
            required
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-slate-300">Amount (৳)</label>
            <span className="text-[11px] text-slate-500">Min: ৳50</span>
          </div>
          <input
            type="number"
            min="50"
            step="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 font-mono tabular-nums"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
        </button>
      </form>

      {/* History */}
      {recentWithdrawals.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400 px-1">Recent Requests</span>
          <div className="flex flex-col gap-2">
            {recentWithdrawals.map(w => (
              <div
                key={w.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200">
                    {w.method} · {w.accountNumber}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100 tabular-nums">
                    ৳{w.amount.toFixed(2)}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      w.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : w.status === 'rejected'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {w.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
