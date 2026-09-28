export type PaymentMethod = 'bKash' | 'Nagad';

export type UserStatus = 'active' | 'disabled';

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export type AdProvider = 'adsterra' | 'direct' | 'interactive';

export interface User {
  id: string;
  phone: string;
  passwordHash: string;
  referralCode: string;
  referredBy?: string;
  totalAdsWatched: number;
  balance: number;
  totalWithdraw: number;
  totalReferrals: number;
  status: UserStatus;
  createdAt: string;
  lastAdWatchedAt?: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  referralCode: string;
  totalAdsWatched: number;
  balance: number;
  totalWithdraw: number;
  totalReferrals: number;
  status: UserStatus;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  phone: string;
  method: PaymentMethod;
  accountNumber: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
}

export interface AdItem {
  id: string;
  title: string;
  slot: 1 | 2;
  provider: AdProvider;
  code: string;
  directUrl?: string;
  reward: number;
  duration: number; // in seconds
  enabled: boolean;
  createdAt: string;
}

export interface AdSession {
  sessionToken: string;
  userId: string;
  adId: string;
  duration: number;
  reward: number;
  startedAt: number;
  expiresAt: number;
  completed: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalAdsWatched: number;
  totalPendingWithdrawalsCount: number;
  totalPendingWithdrawalsAmount: number;
  totalApprovedWithdrawalsCount: number;
  totalApprovedWithdrawalsAmount: number;
  totalRejectedWithdrawalsCount: number;
  totalUserBalances: number;
}
