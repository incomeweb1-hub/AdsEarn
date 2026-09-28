import React from 'react';
import { Eye, Wallet, ArrowDownToLine, Users, LogOut, Shield } from 'lucide-react';
import type { UserProfile } from '../types.ts';

interface ProfileViewProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onOpenAdmin }) => {
  return (
    <div className="w-full flex flex-col gap-4 py-2">
      {/* User Info Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Account</span>
          <span className="font-mono font-semibold text-slate-100">{user.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] font-medium text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active</span>
        </div>
      </div>

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Ads Watched */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Ads Watched</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
            {user.totalAdsWatched}
          </div>
        </div>

        {/* Current Balance */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            ৳{user.balance.toFixed(2)}
          </div>
        </div>

        {/* Total Withdraw */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Withdraw</span>
            <ArrowDownToLine className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
            ৳{user.totalWithdraw.toFixed(2)}
          </div>
        </div>

        {/* Total Referrals */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Referrals</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
            {user.totalReferrals}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={onOpenAdmin}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Admin Panel</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-red-950/20 border border-slate-800/80 text-red-400 transition-colors text-xs font-medium flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
