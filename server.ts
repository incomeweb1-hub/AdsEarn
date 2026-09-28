import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { 
  User, 
  UserProfile, 
  WithdrawalRequest, 
  AdItem, 
  AdSession, 
  AdminStats 
} from './src/types.ts';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBStructure {
  users: User[];
  withdrawals: WithdrawalRequest[];
  ads: AdItem[];
  sessions: AdSession[];
  admin: {
    username: string;
    passwordHash: string;
    token?: string;
  };
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initial seed data
const initialDB: DBStructure = {
  users: [
    {
      id: 'usr_demo_1',
      phone: '01712345678',
      passwordHash: hashPassword('password123'),
      referralCode: 'REF789',
      totalAdsWatched: 12,
      balance: 12.00,
      totalWithdraw: 0,
      totalReferrals: 3,
      status: 'active',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    }
  ],
  withdrawals: [
    {
      id: 'wth_demo_1',
      userId: 'usr_demo_1',
      phone: '01712345678',
      method: 'bKash',
      accountNumber: '01712345678',
      amount: 50.00,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  ],
  ads: [
    {
      id: 'ad_slot_1',
      title: 'Watch Ad Slot 1',
      slot: 1,
      provider: 'adsterra',
      code: `<!-- Adsterra 300x250 Ad Slot Script -->
<script type="text/javascript">
  atOptions = {
    'key' : 'adsterra_slot_1_demo_key',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/adsterra_slot_1_demo_key/invoke.js"></script>`,
      directUrl: 'https://example.com/ad1',
      reward: 1.00,
      duration: 15,
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ad_slot_2',
      title: 'Watch Ad Slot 2',
      slot: 2,
      provider: 'adsterra',
      code: `<!-- Adsterra 320x50 / Social Bar Ad Slot Script -->
<script type="text/javascript">
  atOptions = {
    'key' : 'adsterra_slot_2_demo_key',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/adsterra_slot_2_demo_key/invoke.js"></script>`,
      directUrl: 'https://example.com/ad2',
      reward: 1.00,
      duration: 15,
      enabled: true,
      createdAt: new Date().toISOString(),
    }
  ],
  sessions: [],
  admin: {
    username: 'admin',
    passwordHash: hashPassword('admin1234'),
  }
};

function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
      return initialDB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading DB, falling back to initial:', err);
    return initialDB;
  }
}

function writeDB(data: DBStructure) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// User token store in-memory (backed by userId)
const userSessions = new Map<string, string>(); // token -> userId
const adminSessions = new Set<string>(); // adminToken
let adminFailedPasswordAttempts = 0;
let adminPasswordLockoutUntil = 0;

function sanitizeUser(u: User): UserProfile {
  return {
    id: u.id,
    phone: u.phone,
    referralCode: u.referralCode,
    totalAdsWatched: u.totalAdsWatched,
    balance: Number(u.balance.toFixed(2)),
    totalWithdraw: Number(u.totalWithdraw.toFixed(2)),
    totalReferrals: u.totalReferrals,
    status: u.status,
    createdAt: u.createdAt,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS headers for testing flexibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Authentication Middleware for Users
  const requireUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: missing token' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const userId = userSessions.get(token);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: session expired or invalid' });
      return;
    }
    const db = readDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    if (user.status === 'disabled') {
      res.status(403).json({ error: 'Account disabled. Contact administrator.' });
      return;
    }
    (req as any).user = user;
    next();
  };

  // Admin Auth Middleware
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: missing admin token' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!adminSessions.has(token)) {
      res.status(401).json({ error: 'Unauthorized: invalid admin session' });
      return;
    }
    next();
  };

  // ---------------- USER AUTH ROUTES ----------------

  // Register
  app.post('/api/auth/register', (req, res) => {
    const { phone, password, referralCode } = req.body;
    if (!phone || !password) {
      res.status(400).json({ error: 'Phone number and password required' });
      return;
    }
    const cleanPhone = String(phone).trim();
    if (cleanPhone.length < 9) {
      res.status(400).json({ error: 'Please enter a valid phone number' });
      return;
    }

    const db = readDB();
    const existing = db.users.find(u => u.phone === cleanPhone);
    if (existing) {
      res.status(400).json({ error: 'Phone number already registered' });
      return;
    }

    let referredBy: string | undefined = undefined;
    if (referralCode && String(referralCode).trim()) {
      const code = String(referralCode).trim().toUpperCase();
      const referrer = db.users.find(u => u.referralCode === code);
      if (referrer) {
        referredBy = referrer.id;
        referrer.totalReferrals += 1;
        // Referral bonus of 5 BDT
        referrer.balance += 5.00;
      }
    }

    const newCode = 'REF' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newUser: User = {
      id: 'usr_' + crypto.randomUUID(),
      phone: cleanPhone,
      passwordHash: hashPassword(password),
      referralCode: newCode,
      referredBy,
      totalAdsWatched: 0,
      balance: 0.00,
      totalWithdraw: 0,
      totalReferrals: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDB(db);

    const token = crypto.randomUUID();
    userSessions.set(token, newUser.id);

    res.json({
      token,
      user: sanitizeUser(newUser),
    });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      res.status(400).json({ error: 'Phone and password required' });
      return;
    }
    const cleanPhone = String(phone).trim();
    const db = readDB();
    const user = db.users.find(u => u.phone === cleanPhone);

    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(400).json({ error: 'Invalid phone number or password' });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({ error: 'Account disabled. Contact administrator.' });
      return;
    }

    const token = crypto.randomUUID();
    userSessions.set(token, user.id);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  });

  // Get current user profile
  app.get('/api/user/profile', requireUser, (req, res) => {
    const user = (req as any).user as User;
    res.json(sanitizeUser(user));
  });

  // ---------------- USER ADS ROUTES ----------------

  // Get active ads for Slot 1 and Slot 2
  app.get('/api/ads', (req, res) => {
    const db = readDB();
    const slot1 = db.ads.find(a => a.slot === 1 && a.enabled);
    const slot2 = db.ads.find(a => a.slot === 2 && a.enabled);

    res.json({
      slot1: slot1 || null,
      slot2: slot2 || null,
    });
  });

  // Start watching ad (generates signed session token to prevent ad-skipping / bot replay)
  app.post('/api/ads/start-session', requireUser, (req, res) => {
    const user = (req as any).user as User;
    const { adId } = req.body;

    const db = readDB();
    const ad = db.ads.find(a => a.id === adId && a.enabled);
    if (!ad) {
      res.status(400).json({ error: 'Ad unavailable or disabled' });
      return;
    }

    // Rate limiting: check last watched timestamp (min 5 seconds between ads)
    if (user.lastAdWatchedAt) {
      const diff = Date.now() - new Date(user.lastAdWatchedAt).getTime();
      if (diff < 5000) {
        res.status(429).json({ error: 'Please wait before starting another ad' });
        return;
      }
    }

    const sessionToken = crypto.randomUUID();
    const now = Date.now();
    const session: AdSession = {
      sessionToken,
      userId: user.id,
      adId: ad.id,
      duration: ad.duration || 15,
      reward: ad.reward || 1.0,
      startedAt: now,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      completed: false,
    };

    db.sessions.push(session);
    // Cleanup old sessions
    if (db.sessions.length > 500) {
      db.sessions = db.sessions.slice(-200);
    }
    writeDB(db);

    res.json({
      sessionToken,
      duration: ad.duration,
      reward: ad.reward,
    });
  });

  // Verify and claim ad reward
  app.post('/api/ads/verify', requireUser, (req, res) => {
    const user = (req as any).user as User;
    const { sessionToken } = req.body;

    if (!sessionToken) {
      res.status(400).json({ error: 'Session token required' });
      return;
    }

    const db = readDB();
    const session = db.sessions.find(s => s.sessionToken === sessionToken);

    if (!session) {
      res.status(400).json({ error: 'Invalid ad session' });
      return;
    }

    if (session.completed) {
      res.status(400).json({ error: 'Reward already claimed for this session' });
      return;
    }

    if (session.userId !== user.id) {
      res.status(403).json({ error: 'Session does not belong to current user' });
      return;
    }

    const now = Date.now();
    if (now > session.expiresAt) {
      res.status(400).json({ error: 'Session expired' });
      return;
    }

    // Check minimum required duration (grace of 1 second for network jitter)
    const elapsedSeconds = (now - session.startedAt) / 1000;
    if (elapsedSeconds < session.duration - 1) {
      res.status(400).json({ 
        error: `Please watch the entire ad. Required: ${session.duration}s, Elapsed: ${Math.floor(elapsedSeconds)}s` 
      });
      return;
    }

    // Mark session completed
    session.completed = true;

    // Update user balance and ads watched atomically
    const u = db.users.find(usr => usr.id === user.id);
    if (!u) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    u.totalAdsWatched += 1;
    u.balance = Number((u.balance + session.reward).toFixed(2));
    u.lastAdWatchedAt = new Date().toISOString();

    writeDB(db);

    res.json({
      success: true,
      rewardAdded: session.reward,
      newBalance: u.balance,
      totalAdsWatched: u.totalAdsWatched,
    });
  });

  // ---------------- USER WITHDRAWALS ROUTES ----------------

  // Submit withdrawal request
  app.post('/api/withdrawals/request', requireUser, (req, res) => {
    const user = (req as any).user as User;
    const { method, accountNumber, amount } = req.body;

    if (!method || !['bKash', 'Nagad'].includes(method)) {
      res.status(400).json({ error: 'Invalid payment method. Choose bKash or Nagad' });
      return;
    }

    const cleanAccount = String(accountNumber || '').trim();
    if (!cleanAccount || cleanAccount.length < 11) {
      res.status(400).json({ error: 'Valid 11-digit account number required' });
      return;
    }

    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      res.status(400).json({ error: 'Please enter a valid amount' });
      return;
    }

    // Minimum withdrawal amount rule: 50 BDT
    if (withdrawAmount < 50) {
      res.status(400).json({ error: 'Minimum withdrawal amount is ৳50' });
      return;
    }

    const db = readDB();
    const u = db.users.find(usr => usr.id === user.id);
    if (!u) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (u.balance < withdrawAmount) {
      res.status(400).json({ error: `Insufficient balance. Available: ৳${u.balance.toFixed(2)}` });
      return;
    }

    // Deduct from user balance immediately and record request
    u.balance = Number((u.balance - withdrawAmount).toFixed(2));

    const newRequest: WithdrawalRequest = {
      id: 'wth_' + crypto.randomUUID(),
      userId: u.id,
      phone: u.phone,
      method: method as 'bKash' | 'Nagad',
      accountNumber: cleanAccount,
      amount: withdrawAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.withdrawals.unshift(newRequest);
    writeDB(db);

    res.json({
      success: true,
      newBalance: u.balance,
      withdrawal: newRequest,
    });
  });

  // Get user's own withdrawal history
  app.get('/api/withdrawals/my', requireUser, (req, res) => {
    const user = (req as any).user as User;
    const db = readDB();
    const userRequests = db.withdrawals.filter(w => w.userId === user.id);
    res.json(userRequests);
  });

  // ---------------- ADMIN PANEL ROUTES ----------------

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();

    if (username === db.admin.username && hashPassword(password) === db.admin.passwordHash) {
      const adminToken = 'adm_' + crypto.randomUUID();
      adminSessions.add(adminToken);
      res.json({
        token: adminToken,
        username: db.admin.username,
      });
      return;
    }

    res.status(401).json({ error: 'Invalid admin credentials' });
  });

  // Admin Change Password
  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    // Check lockout
    if (Date.now() < adminPasswordLockoutUntil) {
      const waitSeconds = Math.ceil((adminPasswordLockoutUntil - Date.now()) / 1000);
      res.status(429).json({ 
        error: `Too many failed attempts. Security cooldown active for ${waitSeconds}s.` 
      });
      return;
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ error: 'New password and confirm password do not match.' });
      return;
    }

    if (newPassword === currentPassword) {
      res.status(400).json({ error: 'New password must be different from current password.' });
      return;
    }

    const db = readDB();
    const currentHash = hashPassword(currentPassword);

    if (currentHash !== db.admin.passwordHash) {
      adminFailedPasswordAttempts += 1;
      if (adminFailedPasswordAttempts >= 5) {
        adminPasswordLockoutUntil = Date.now() + 5 * 60 * 1000; // 5-minute lockout
        adminFailedPasswordAttempts = 0;
        res.status(429).json({ error: 'Too many incorrect attempts. Locked out for 5 minutes.' });
        return;
      }
      const attemptsLeft = 5 - adminFailedPasswordAttempts;
      res.status(400).json({ error: `Incorrect current password. (${attemptsLeft} attempts remaining)` });
      return;
    }

    // Success: reset rate limit tracking
    adminFailedPasswordAttempts = 0;
    adminPasswordLockoutUntil = 0;

    // Securely update password hash
    db.admin.passwordHash = hashPassword(newPassword);
    writeDB(db);

    // Invalidate all active admin sessions to force re-login with the new password
    adminSessions.clear();

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });
  });

  // Admin Stats Dashboard
  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const db = readDB();

    const totalUsers = db.users.length;
    const totalAdsWatched = db.users.reduce((acc, u) => acc + (u.totalAdsWatched || 0), 0);
    const totalUserBalances = db.users.reduce((acc, u) => acc + (u.balance || 0), 0);

    const pending = db.withdrawals.filter(w => w.status === 'pending');
    const approved = db.withdrawals.filter(w => w.status === 'approved');
    const rejected = db.withdrawals.filter(w => w.status === 'rejected');

    const stats: AdminStats = {
      totalUsers,
      totalAdsWatched,
      totalPendingWithdrawalsCount: pending.length,
      totalPendingWithdrawalsAmount: pending.reduce((acc, w) => acc + w.amount, 0),
      totalApprovedWithdrawalsCount: approved.length,
      totalApprovedWithdrawalsAmount: approved.reduce((acc, w) => acc + w.amount, 0),
      totalRejectedWithdrawalsCount: rejected.length,
      totalUserBalances: Number(totalUserBalances.toFixed(2)),
    };

    res.json(stats);
  });

  // Get all withdrawals for admin
  app.get('/api/admin/withdrawals', requireAdmin, (req, res) => {
    const db = readDB();
    res.json(db.withdrawals);
  });

  // Approve withdrawal
  app.post('/api/admin/withdrawals/:id/approve', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const request = db.withdrawals.find(w => w.id === id);

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Request is already processed' });
      return;
    }

    request.status = 'approved';
    request.processedAt = new Date().toISOString();

    const u = db.users.find(usr => usr.id === request.userId);
    if (u) {
      u.totalWithdraw = Number((u.totalWithdraw + request.amount).toFixed(2));
    }

    writeDB(db);
    res.json({ success: true, withdrawal: request });
  });

  // Reject withdrawal (refunds balance)
  app.post('/api/admin/withdrawals/:id/reject', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const db = readDB();
    const request = db.withdrawals.find(w => w.id === id);

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Request is already processed' });
      return;
    }

    request.status = 'rejected';
    request.processedAt = new Date().toISOString();
    request.adminNote = reason || 'Rejected by administrator';

    // Refund money to user's balance
    const u = db.users.find(usr => usr.id === request.userId);
    if (u) {
      u.balance = Number((u.balance + request.amount).toFixed(2));
    }

    writeDB(db);
    res.json({ success: true, withdrawal: request });
  });

  // Ads Management: Get all ads
  app.get('/api/admin/ads', requireAdmin, (req, res) => {
    const db = readDB();
    res.json(db.ads);
  });

  // Create new ad
  app.post('/api/admin/ads', requireAdmin, (req, res) => {
    const { title, slot, provider, code, directUrl, reward, duration, enabled } = req.body;
    const db = readDB();

    const newAd: AdItem = {
      id: 'ad_' + crypto.randomUUID(),
      title: title || 'New Ad',
      slot: Number(slot) === 2 ? 2 : 1,
      provider: provider || 'adsterra',
      code: code || '',
      directUrl: directUrl || '',
      reward: Number(reward) || 1.0,
      duration: Number(duration) || 15,
      enabled: enabled !== false,
      createdAt: new Date().toISOString(),
    };

    // If new ad is set to a slot, disable other ads on the same slot if enabled
    if (newAd.enabled) {
      db.ads.forEach(a => {
        if (a.slot === newAd.slot) {
          a.enabled = false;
        }
      });
    }

    db.ads.push(newAd);
    writeDB(db);
    res.json(newAd);
  });

  // Update ad
  app.put('/api/admin/ads/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, slot, provider, code, directUrl, reward, duration, enabled } = req.body;
    const db = readDB();

    const ad = db.ads.find(a => a.id === id);
    if (!ad) {
      res.status(404).json({ error: 'Ad not found' });
      return;
    }

    if (title !== undefined) ad.title = title;
    if (slot !== undefined) ad.slot = Number(slot) === 2 ? 2 : 1;
    if (provider !== undefined) ad.provider = provider;
    if (code !== undefined) ad.code = code;
    if (directUrl !== undefined) ad.directUrl = directUrl;
    if (reward !== undefined) ad.reward = Number(reward);
    if (duration !== undefined) ad.duration = Number(duration);
    if (enabled !== undefined) {
      ad.enabled = Boolean(enabled);
      if (ad.enabled) {
        // disable others for this slot
        db.ads.forEach(other => {
          if (other.id !== ad.id && other.slot === ad.slot) {
            other.enabled = false;
          }
        });
      }
    }

    writeDB(db);
    res.json(ad);
  });

  // Delete ad
  app.delete('/api/admin/ads/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const index = db.ads.findIndex(a => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Ad not found' });
      return;
    }
    db.ads.splice(index, 1);
    writeDB(db);
    res.json({ success: true });
  });

  // User Management: List all registered users
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const db = readDB();
    const list = db.users.map(u => ({
      ...sanitizeUser(u),
      withdrawals: db.withdrawals.filter(w => w.userId === u.id),
    }));
    res.json(list);
  });

  // Toggle user status (active / disabled)
  app.post('/api/admin/users/:id/toggle-status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const u = db.users.find(usr => usr.id === id);
    if (!u) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    u.status = u.status === 'active' ? 'disabled' : 'active';
    writeDB(db);
    res.json({ success: true, user: sanitizeUser(u) });
  });

  // Mount Vite in dev mode or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Watch & Earn server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
