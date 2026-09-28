import React, { useState } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import type { UserProfile } from '../types.ts';

interface ReferViewProps {
  user: UserProfile;
}

export const ReferView: React.FC<ReferViewProps> = ({ user }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = `${window.location.origin}${window.location.pathname}?ref=${user.referralCode}`;

  const copyToClipboard = (text: string, isCode: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 py-2">
      {/* Referral Stats Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Successful Referrals</span>
          <div className="text-2xl font-bold font-mono text-blue-400 tabular-nums mt-0.5">
            {user.totalReferrals}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 text-blue-400">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Referral Code Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
        <span className="text-xs font-medium text-slate-400">Your Referral Code</span>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="font-mono text-lg font-bold tracking-wider text-slate-100">
            {user.referralCode}
          </span>
          <button
            onClick={() => copyToClipboard(user.referralCode, true)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Referral Link Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
        <span className="text-xs font-medium text-slate-400">Your Referral Link</span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono truncate focus:outline-none"
          />
          <button
            onClick={() => copyToClipboard(referralLink, false)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
