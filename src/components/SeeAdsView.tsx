import React, { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import type { AdItem } from '../types.ts';
import { AdModal } from './AdModal.tsx';

interface SeeAdsViewProps {
  slot1Ad: AdItem | null;
  slot2Ad: AdItem | null;
  onRewardClaimed: (rewardAdded: number, newBalance: number) => void;
}

export const SeeAdsView: React.FC<SeeAdsViewProps> = ({ slot1Ad, slot2Ad, onRewardClaimed }) => {
  const [activeAd, setActiveAd] = useState<AdItem | null>(null);

  // Fallbacks if ads haven't loaded or admin hasn't configured them
  const ad1: AdItem = slot1Ad || {
    id: 'ad_slot_1',
    title: 'Ad 1',
    slot: 1,
    provider: 'adsterra',
    code: '',
    reward: 1.00,
    duration: 15,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  const ad2: AdItem = slot2Ad || {
    id: 'ad_slot_2',
    title: 'Ad 2',
    slot: 2,
    provider: 'adsterra',
    code: '',
    reward: 1.00,
    duration: 15,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="w-full flex flex-col gap-4 py-2">
      {/* Ad Option 1 */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-900/60 transition-all shadow-md flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-slate-100">{ad1.title}</span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono tabular-nums">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+৳{ad1.reward.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => setActiveAd(ad1)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-medium text-xs tracking-wide flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-900/30"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Watch Ad 1</span>
        </button>
      </div>

      {/* Ad Option 2 */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-900/60 transition-all shadow-md flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-slate-100">{ad2.title}</span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono tabular-nums">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+৳{ad2.reward.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => setActiveAd(ad2)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-medium text-xs tracking-wide flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-900/30"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Watch Ad 2</span>
        </button>
      </div>

      {/* Ad Modal */}
      {activeAd && (
        <AdModal
          ad={activeAd}
          onClose={() => setActiveAd(null)}
          onRewardClaimed={(reward, newBal) => {
            onRewardClaimed(reward, newBal);
            setActiveAd(null);
          }}
        />
      )}
    </div>
  );
};
