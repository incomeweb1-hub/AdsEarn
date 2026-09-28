import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { BottomNav, type UserTab } from './components/BottomNav.tsx';
import { SeeAdsView } from './components/SeeAdsView.tsx';
import { WithdrawView } from './components/WithdrawView.tsx';
import { ReferView } from './components/ReferView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { api } from './services/api.ts';
import type { UserProfile, AdItem } from './types.ts';
import { CheckCircle2, Shield } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<UserTab>('ads');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [slot1Ad, setSlot1Ad] = useState<AdItem | null>(null);
  const [slot2Ad, setSlot2Ad] = useState<AdItem | null>(null);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [referralParam, setReferralParam] = useState<string>('');

  // Check URL params for referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralParam(ref);
    }
  }, []);

  // Fetch logged in profile if token exists
  useEffect(() => {
    if (api.getUserToken()) {
      api.getProfile()
        .then(u => setUser(u))
        .catch(() => {
          api.logoutUser();
          setUser(null);
        });
    }
  }, []);

  // Load configured ads
  const loadAds = () => {
    api.getAds()
      .then(res => {
        setSlot1Ad(res.slot1);
        setSlot2Ad(res.slot2);
      })
      .catch(() => {
        // Fallback handled inside SeeAdsView
      });
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleRewardClaimed = (rewardAdded: number, newBalance: number) => {
    if (user) {
      setUser({
        ...user,
        balance: newBalance,
        totalAdsWatched: user.totalAdsWatched + 1,
      });
    }
    setRewardToast(`+৳${rewardAdded.toFixed(2)} added to balance!`);
    setTimeout(() => setRewardToast(null), 3500);
  };

  const handleBalanceUpdated = (newBalance: number) => {
    if (user) {
      setUser({
        ...user,
        balance: newBalance,
      });
    }
  };

  const handleLogout = () => {
    api.logoutUser();
    setUser(null);
  };

  // If Admin View is active, show the Admin Panel
  if (isAdminView) {
    return (
      <AdminPanel
        onBackToUser={() => setIsAdminView(false)}
        onAdUpdated={loadAds}
      />
    );
  }

  // If user is not authenticated, show minimal auth screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4">
        <AuthModal
          initialReferral={referralParam}
          onSuccess={u => setUser(u)}
        />
        {/* Discrete Admin Link at bottom */}
        <div className="text-center pt-4 pb-2">
          <button
            onClick={() => setIsAdminView(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        balance={user.balance}
        onOpenAdmin={() => setIsAdminView(true)}
      />

      {/* Floating Success Reward Toast */}
      {rewardToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-semibold shadow-xl shadow-emerald-950/60 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{rewardToast}</span>
        </div>
      )}

      {/* Main Single Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-20 flex flex-col">
        {currentTab === 'ads' && (
          <SeeAdsView
            slot1Ad={slot1Ad}
            slot2Ad={slot2Ad}
            onRewardClaimed={handleRewardClaimed}
          />
        )}

        {currentTab === 'withdraw' && (
          <WithdrawView
            balance={user.balance}
            onBalanceUpdated={handleBalanceUpdated}
          />
        )}

        {currentTab === 'refer' && (
          <ReferView user={user} />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={user}
            onLogout={handleLogout}
            onOpenAdmin={() => setIsAdminView(true)}
          />
        )}
      </main>

      {/* Strict 4-Option Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
      />
    </div>
  );
}
