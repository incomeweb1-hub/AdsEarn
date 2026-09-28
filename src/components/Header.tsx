import React from 'react';
import { Shield, Wallet } from 'lucide-react';

interface HeaderProps {
  balance: number;
  onOpenAdmin: () => void;
  isAdminActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ balance, onOpenAdmin, isAdminActive }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-900/30">
            W
          </div>
          <span className="text-base font-bold text-slate-100 tracking-tight">
            Watch & Earn
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Balance Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-emerald-400 tabular-nums shadow-inner">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>৳{balance.toFixed(2)}</span>
          </div>

          {/* Admin Switch */}
          <button
            onClick={onOpenAdmin}
            aria-label="Admin Panel"
            title="Admin Panel"
            className={`p-2 rounded-xl border transition-colors ${
              isAdminActive
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
