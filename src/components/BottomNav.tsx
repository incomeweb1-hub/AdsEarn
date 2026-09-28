import React from 'react';
import { PlaySquare, Wallet, Share2, User } from 'lucide-react';

export type UserTab = 'ads' | 'withdraw' | 'refer' | 'profile';

interface BottomNavProps {
  currentTab: UserTab;
  onSelectTab: (tab: UserTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'ads' as UserTab, label: 'See Ads', icon: PlaySquare },
    { id: 'withdraw' as UserTab, label: 'Withdraw', icon: Wallet },
    { id: 'refer' as UserTab, label: 'Refer', icon: Share2 },
    { id: 'profile' as UserTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors relative"
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-blue-500 scale-110' : 'text-slate-400 hover:text-slate-300'
                }`}
              />
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-blue-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
