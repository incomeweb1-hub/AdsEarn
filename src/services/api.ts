import type { 
  UserProfile, 
  WithdrawalRequest, 
  AdItem, 
  AdminStats, 
  PaymentMethod 
} from '../types.ts';

const USER_TOKEN_KEY = 'watch_earn_user_token';
const ADMIN_TOKEN_KEY = 'watch_earn_admin_token';

class ApiService {
  private userToken: string | null = null;
  private adminToken: string | null = null;

  constructor() {
    this.userToken = localStorage.getItem(USER_TOKEN_KEY);
    this.adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  // Auth getters & setters
  getUserToken(): string | null {
    return this.userToken;
  }

  setUserToken(token: string | null) {
    this.userToken = token;
    if (token) {
      localStorage.setItem(USER_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(USER_TOKEN_KEY);
    }
  }

  getAdminToken(): string | null {
    return this.adminToken;
  }

  setAdminToken(token: string | null) {
    this.adminToken = token;
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  }

  logoutUser() {
    this.setUserToken(null);
  }

  logoutAdmin() {
    this.setAdminToken(null);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.userToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.userToken}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = `Server error (${response.status})`;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  private async adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.adminToken) {
      headers.set('Authorization', `Bearer ${this.adminToken}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'Admin error';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = `Server error (${response.status})`;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- USER API ---

  async register(phone: string, password: string, referralCode?: string): Promise<{ token: string; user: UserProfile }> {
    const data = await this.request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, referralCode }),
    });
    this.setUserToken(data.token);
    return data;
  }

  async login(phone: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const data = await this.request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    this.setUserToken(data.token);
    return data;
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/user/profile');
  }

  async getAds(): Promise<{ slot1: AdItem | null; slot2: AdItem | null }> {
    return this.request<{ slot1: AdItem | null; slot2: AdItem | null }>('/api/ads');
  }

  async startAdSession(adId: string): Promise<{ sessionToken: string; duration: number; reward: number }> {
    return this.request<{ sessionToken: string; duration: number; reward: number }>('/api/ads/start-session', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    });
  }

  async verifyAdReward(sessionToken: string): Promise<{ success: boolean; rewardAdded: number; newBalance: number; totalAdsWatched: number }> {
    return this.request<{ success: boolean; rewardAdded: number; newBalance: number; totalAdsWatched: number }>('/api/ads/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    });
  }

  async requestWithdrawal(method: PaymentMethod, accountNumber: string, amount: number): Promise<{ success: boolean; newBalance: number; withdrawal: WithdrawalRequest }> {
    return this.request<{ success: boolean; newBalance: number; withdrawal: WithdrawalRequest }>('/api/withdrawals/request', {
      method: 'POST',
      body: JSON.stringify({ method, accountNumber, amount }),
    });
  }

  async getMyWithdrawals(): Promise<WithdrawalRequest[]> {
    return this.request<WithdrawalRequest[]>('/api/withdrawals/my');
  }

  // --- ADMIN API ---

  async adminLogin(username: string, password: string): Promise<{ token: string; username: string }> {
    const data = await this.request<{ token: string; username: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setAdminToken(data.token);
    return data;
  }

  async getAdminStats(): Promise<AdminStats> {
    return this.adminRequest<AdminStats>('/api/admin/stats');
  }

  async getAdminWithdrawals(): Promise<WithdrawalRequest[]> {
    return this.adminRequest<WithdrawalRequest[]>('/api/admin/withdrawals');
  }

  async approveWithdrawal(id: string): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> {
    return this.adminRequest<{ success: boolean; withdrawal: WithdrawalRequest }>(`/api/admin/withdrawals/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectWithdrawal(id: string, reason?: string): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> {
    return this.adminRequest<{ success: boolean; withdrawal: WithdrawalRequest }>(`/api/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getAdminAds(): Promise<AdItem[]> {
    return this.adminRequest<AdItem[]>('/api/admin/ads');
  }

  async createAdminAd(ad: Partial<AdItem>): Promise<AdItem> {
    return this.adminRequest<AdItem>('/api/admin/ads', {
      method: 'POST',
      body: JSON.stringify(ad),
    });
  }

  async updateAdminAd(id: string, ad: Partial<AdItem>): Promise<AdItem> {
    return this.adminRequest<AdItem>(`/api/admin/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ad),
    });
  }

  async deleteAdminAd(id: string): Promise<{ success: boolean }> {
    return this.adminRequest<{ success: boolean }>(`/api/admin/ads/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminUsers(): Promise<(UserProfile & { withdrawals: WithdrawalRequest[] })[]> {
    return this.adminRequest<(UserProfile & { withdrawals: WithdrawalRequest[] })[]>('/api/admin/users');
  }

  async toggleUserStatus(id: string): Promise<{ success: boolean; user: UserProfile }> {
    return this.adminRequest<{ success: boolean; user: UserProfile }>(`/api/admin/users/${id}/toggle-status`, {
      method: 'POST',
    });
  }

  async changeAdminPassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.adminRequest<{ success: boolean; message: string }>(
        '/api/admin/change-password',
        {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
        }
      );
      this.logoutAdmin(); // session invalidated
      return result;
    } catch (err: any) {
      // In case server endpoint is unavailable (e.g. static GitHub Pages demo mode)
      if (
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('404')
      ) {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
          throw new Error('All fields are required.');
        }
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error('New password and confirm password do not match.');
        }
        if (newPassword === currentPassword) {
          throw new Error('New password must be different from current password.');
        }

        // Compute sha256 in browser
        const enc = new TextEncoder();
        const curBuf = await crypto.subtle.digest('SHA-256', enc.encode(currentPassword));
        const curHash = Array.from(new Uint8Array(curBuf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        const storedHash = localStorage.getItem('gh_pages_admin_pwd_hash') ||
          // Default sha256 for admin1234
          'f342790938ff5d56b0d91d9d9f58ea9aa5d7b5b5c98d0ceac869f88d75cf70ee';

        if (curHash !== storedHash) {
          throw new Error('Incorrect current password.');
        }

        const newBuf = await crypto.subtle.digest('SHA-256', enc.encode(newPassword));
        const newHash = Array.from(new Uint8Array(newBuf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        localStorage.setItem('gh_pages_admin_pwd_hash', newHash);
        this.logoutAdmin();
        return {
          success: true,
          message: 'Password changed successfully. Please log in with your new password.',
        };
      }
      throw err;
    }
  }
}

export const api = new ApiService();
