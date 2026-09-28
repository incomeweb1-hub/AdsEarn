import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Wallet, 
  Tv, 
  Users, 
  ArrowLeft, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Lock, 
  AlertCircle,
  Eye,
  CheckCircle,
  RefreshCw,
  Settings,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { AdminStats, WithdrawalRequest, AdItem, UserProfile } from '../types.ts';

interface AdminPanelProps {
  onBackToUser: () => void;
  onAdUpdated: () => void;
}

type AdminTab = 'dashboard' | 'withdrawals' | 'ads' | 'users' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToUser, onAdUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(api.getAdminToken()));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [users, setUsers] = useState<(UserProfile & { withdrawals: WithdrawalRequest[] })[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Ad form modal state
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adForm, setAdForm] = useState({
    title: '',
    slot: 1,
    provider: 'adsterra',
    code: '',
    directUrl: '',
    reward: 1.0,
    duration: 15,
    enabled: true,
  });

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      await api.adminLogin(username, password);
      setIsAuthenticated(true);
      loadAllAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    api.logoutAdmin();
    setIsAuthenticated(false);
  };

  const loadAllAdminData = async () => {
    setLoadingData(true);
    try {
      const [s, w, a, u] = await Promise.all([
        api.getAdminStats(),
        api.getAdminWithdrawals(),
        api.getAdminAds(),
        api.getAdminUsers(),
      ]);
      setStats(s);
      setWithdrawals(w);
      setAds(a);
      setUsers(u);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllAdminData();
    }
  }, [isAuthenticated]);

  const handleApproveWithdrawal = async (id: string) => {
    try {
      await api.approveWithdrawal(id);
      showToast('Withdrawal approved successfully');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!rejectingId) return;
    try {
      await api.rejectWithdrawal(rejectingId, rejectReason);
      showToast('Withdrawal rejected and amount refunded');
      setRejectingId(null);
      setRejectReason('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await api.toggleUserStatus(userId);
      showToast('User status updated');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.changeAdminPassword(currentPassword, newPassword, confirmNewPassword);
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password updated. Session expired, logging out...');
      setTimeout(() => {
        setIsAuthenticated(false);
        setPassword('');
        setLoginError(null);
        setLoginMessage('Password changed successfully. Please log in with your new password.');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenNewAd = (slot?: 1 | 2) => {
    setEditingAd(null);
    setAdForm({
      title: slot ? `Ad Slot ${slot}` : 'New Sponsored Ad',
      slot: slot || 1,
      provider: 'adsterra',
      code: `<!-- Adsterra Ad Script Code -->\n<script type="text/javascript">\n  atOptions = {\n    'key' : 'adsterra_key_${Date.now()}',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script type="text/javascript" src="//www.highperformanceformat.com/invoke.js"></script>`,
      directUrl: '',
      reward: 1.0,
      duration: 15,
      enabled: true,
    });
    setIsAdModalOpen(true);
  };

  const handleOpenEditAd = (ad: AdItem) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      slot: ad.slot,
      provider: ad.provider,
      code: ad.code,
      directUrl: ad.directUrl || '',
      reward: ad.reward,
      duration: ad.duration,
      enabled: ad.enabled,
    });
    setIsAdModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await api.updateAdminAd(editingAd.id, adForm as any);
        showToast('Ad updated successfully');
      } else {
        await api.createAdminAd(adForm as any);
        showToast('New ad created successfully');
      }
      setIsAdModalOpen(false);
      loadAllAdminData();
      onAdUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to save ad');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      await api.deleteAdminAd(id);
      showToast('Ad deleted');
      loadAllAdminData();
      onAdUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ad');
    }
  };

  // 1. ADMIN LOGIN VIEW
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToUser}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800 text-[11px] font-medium text-blue-300">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Portal</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-100">Administrator Login</h2>
            <p className="text-xs text-slate-400 mt-0.5">Secure control panel authentication</p>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {loginMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{loginMessage}</span>
              </div>
            )}

            {loginError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-11 mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? 'Verifying...' : 'Login to Admin'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN CONSOLE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToUser}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Return to User App"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-slate-100">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Admin Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllAdminData}
              disabled={loadingData}
              title="Refresh Data"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleAdminLogout}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'withdrawals'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Withdraw Requests</span>
            {stats && stats.totalPendingWithdrawalsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {stats.totalPendingWithdrawalsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'ads'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Ads Management</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Content Area */}
      <main className="max-w-4xl mx-auto w-full p-4">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && stats && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300">Platform Overview</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs text-slate-400">Total Users</span>
                <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                  {stats.totalUsers}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs text-slate-400">Total Ads Watched</span>
                <span className="text-2xl font-bold font-mono text-blue-400 tabular-nums">
                  {stats.totalAdsWatched}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs text-slate-400">Pending Withdrawals</span>
                <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                  ৳{stats.totalPendingWithdrawalsAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500">{stats.totalPendingWithdrawalsCount} pending</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs text-slate-400">Approved Withdrawals</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  ৳{stats.totalApprovedWithdrawalsAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500">{stats.totalApprovedWithdrawalsCount} approved</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Current User Balances</span>
                <div className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-0.5">
                  ৳{stats.totalUserBalances.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
              >
                Review Requests
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: WITHDRAWAL REQUESTS */}
        {activeTab === 'withdrawals' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">Withdrawal Requests</h3>
              <span className="text-xs text-slate-500">{withdrawals.length} total</span>
            </div>

            {withdrawals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                No withdrawal requests found
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {withdrawals.map(w => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            w.method === 'bKash' ? 'bg-[#e2136e] text-white' : 'bg-[#f7941d] text-white'
                          }`}
                        >
                          {w.method}
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-100">
                          {w.accountNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
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
                      <span className="text-xs text-slate-400">
                        Requested by: {w.phone} · {new Date(w.createdAt).toLocaleString()}
                      </span>
                      {w.adminNote && (
                        <span className="text-xs text-red-400 italic">Note: {w.adminNote}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                          ৳{w.amount.toFixed(2)}
                        </div>
                      </div>

                      {w.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(w.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-emerald-950"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(w.id);
                              setRejectReason('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-red-950"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADS MANAGEMENT */}
        {activeTab === 'ads' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-300">User Ad Slots & Scripts</h3>
                <p className="text-xs text-slate-500">Configure Adsterra codes for Slot 1 and Slot 2</p>
              </div>
              <button
                onClick={() => handleOpenNewAd()}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Ad</span>
              </button>
            </div>

            {/* Two Main Active Slots Callout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2].map(slotNum => {
                const activeAdForSlot = ads.find(a => a.slot === slotNum && a.enabled);
                return (
                  <div
                    key={slotNum}
                    className="p-4 rounded-2xl bg-slate-900 border border-blue-900/40 flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Active Slot {slotNum}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeAdForSlot
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {activeAdForSlot ? 'ONLINE' : 'UNASSIGNED'}
                      </span>
                    </div>

                    {activeAdForSlot ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-100">{activeAdForSlot.title}</span>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>Reward: ৳{activeAdForSlot.reward.toFixed(2)}</span>
                          <span>·</span>
                          <span>{activeAdForSlot.duration}s Timer</span>
                          <span>·</span>
                          <span className="uppercase">{activeAdForSlot.provider}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditAd(activeAdForSlot)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Script</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-xs text-slate-400 mb-2">No active ad assigned to Slot {slotNum}.</p>
                        <button
                          onClick={() => handleOpenNewAd(slotNum as 1 | 2)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium"
                        >
                          Assign Slot {slotNum}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* All Ads List */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-semibold text-slate-400">All Configured Ads</span>
              <div className="flex flex-col gap-2">
                {ads.map(ad => (
                  <div
                    key={ad.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200">{ad.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          Slot {ad.slot}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            ad.enabled ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {ad.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        ৳{ad.reward.toFixed(2)} reward · {ad.duration}s duration · Provider: {ad.provider}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditAd(ad)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Ad"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 transition-colors"
                        title="Delete Ad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">Registered Users</h3>
              <span className="text-xs text-slate-500">{users.length} users</span>
            </div>

            <div className="flex flex-col gap-3">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-100">{u.phone}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.status === 'active'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span>Ref Code: <strong className="text-slate-300">{u.referralCode}</strong></span>
                      <span>·</span>
                      <span>Ads Watched: <strong className="text-blue-400">{u.totalAdsWatched}</strong></span>
                      <span>·</span>
                      <span>Referrals: <strong className="text-purple-400">{u.totalReferrals}</strong></span>
                      <span>·</span>
                      <span>Total Withdrawn: <strong className="text-amber-400">৳{u.totalWithdraw.toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Balance</span>
                      <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                        ৳{u.balance.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleUserStatus(u.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        u.status === 'active'
                          ? 'bg-slate-800 hover:bg-red-950/40 text-red-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {u.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4 max-w-md">
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Admin Settings</h3>
              <p className="text-xs text-slate-500">Security configurations and administrative credentials</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">Change Password</h4>
                  <p className="text-xs text-slate-400">Update administrator access password</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full h-11 mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT AD */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                {editingAd ? 'Edit Adsterra / Banner Ad' : 'Add New Advertisement'}
              </h3>
              <button
                onClick={() => setIsAdModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-300">Ad Slot</label>
                  <select
                    value={adForm.slot}
                    onChange={e => setAdForm({ ...adForm, slot: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value={1}>Slot 1 (Top Option)</option>
                    <option value={2}>Slot 2 (Bottom Option)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-300">Provider</label>
                  <select
                    value={adForm.provider}
                    onChange={e => setAdForm({ ...adForm, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="adsterra">Adsterra Script</option>
                    <option value="direct">Direct Banner / URL</option>
                    <option value="interactive">Interactive Video</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">Ad Title</label>
                <input
                  type="text"
                  value={adForm.title}
                  onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                  required
                  placeholder="e.g. Watch Ad Slot 1"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-300">Reward (৳)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={adForm.reward}
                    onChange={e => setAdForm({ ...adForm, reward: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-300">Watch Duration (Seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={adForm.duration}
                    onChange={e => setAdForm({ ...adForm, duration: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Adsterra Script / HTML Code</label>
                  <span className="text-[10px] text-slate-500">Paste your &lt;script&gt; code here</span>
                </div>
                <textarea
                  rows={6}
                  value={adForm.code}
                  onChange={e => setAdForm({ ...adForm, code: e.target.value })}
                  placeholder={`<script type="text/javascript">\n  atOptions = { 'key' : '...' };\n</script>\n<script src="//www.highperformanceformat.com/..."></script>`}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="adEnabled"
                  checked={adForm.enabled}
                  onChange={e => setAdForm({ ...adForm, enabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="adEnabled" className="text-xs text-slate-300 select-none">
                  Set this ad active for Slot {adForm.slot}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Save Ad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-slate-100">Reject Withdrawal</h4>
            <p className="text-xs text-slate-400">
              The requested amount will be automatically refunded back to the user's available balance.
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason (e.g. Invalid account number)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectWithdrawal}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
