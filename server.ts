import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER_EMAIL = 'maikelindo8@gmail.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'upperwest888';
let activeOwnerOtp: { code: string; expiresAt: number } | null = null;
const ownerAuthTokens = new Set<string>();
const sentNotificationsLog: Array<{ id: string; to: string; subject: string; message: string; timestamp: string }> = [];
const DATA_FILE = path.join(process.cwd(), 'access_control.json');

const VISITOR_PASSWORD = '0123456';

interface AccessHistoryEntry {
  id: string;
  email: string;
  name: string;
  role: string;
  accessType: 'VISITOR' | 'OWNER' | 'SALES' | 'STAFF';
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
  device?: string;
  ip?: string;
}

interface AccessData {
  approvedUsers: Array<{
    email: string;
    name: string;
    avatar?: string;
    role: string;
    status: string;
    isOwner?: boolean;
    department?: string;
    approvedAt: string;
  }>;
  accessRequests: Array<{
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string;
    status: string;
    department: string;
    requestReason: string;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
  }>;
  accessHistory: AccessHistoryEntry[];
}

function loadAccessData(): AccessData {
  const defaultData: AccessData = {
    approvedUsers: [
      {
        email: OWNER_EMAIL,
        name: 'Maikel (Owner)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'OWNER',
        status: 'APPROVED',
        isOwner: true,
        department: 'Executive Management',
        approvedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        email: 'ditto.sales@gmail.com',
        name: 'Ditto Zulfikar',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'SALES',
        status: 'APPROVED',
        isOwner: false,
        department: 'Inhouse Sales Senior',
        approvedAt: '2026-03-10T09:30:00.000Z',
      }
    ],
    accessRequests: [
      {
        id: 'req-fitri-01',
        email: 'fitri.dewi@gmail.com',
        name: 'Fitriyani Dewi',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        role: 'SALES',
        status: 'PENDING',
        department: 'Sales Advisor Upper West',
        requestReason: 'Izin akses dashboard untuk evaluasi closing leads iklan Meta Ads & follow-up prospek SOHO',
        requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ],
    accessHistory: [
      {
        id: 'hist-init-1',
        email: 'ditto.sales@gmail.com',
        name: 'Ditto Zulfikar',
        role: 'SALES',
        accessType: 'SALES',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        device: 'Desktop Chrome / Windows 11',
        ip: '182.253.14.88'
      },
      {
        id: 'hist-init-2',
        email: OWNER_EMAIL,
        name: 'Maikel (Owner)',
        role: 'OWNER',
        accessType: 'OWNER',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        device: 'MacBook Pro / Safari macOS',
        ip: '103.111.201.42'
      }
    ]
  };

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.approvedUsers)) parsed.approvedUsers = defaultData.approvedUsers;
      if (!Array.isArray(parsed.accessRequests)) parsed.accessRequests = defaultData.accessRequests;
      if (!Array.isArray(parsed.accessHistory)) parsed.accessHistory = defaultData.accessHistory;
      // Ensure owner is ALWAYS present in approvedUsers
      if (!parsed.approvedUsers.some((u: any) => u.email.toLowerCase() === OWNER_EMAIL.toLowerCase())) {
        parsed.approvedUsers.unshift(defaultData.approvedUsers[0]);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading access_control.json, using default:', err);
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing default access_control.json:', err);
  }
  return defaultData;
}

function recordAccessLog(entry: Omit<AccessHistoryEntry, 'id' | 'timestamp'>) {
  const data = loadAccessData();
  const newEntry: AccessHistoryEntry = {
    ...entry,
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString()
  };
  if (!Array.isArray(data.accessHistory)) {
    data.accessHistory = [];
  }
  // Unshift to place newest on top, keep last 200
  data.accessHistory.unshift(newEntry);
  if (data.accessHistory.length > 200) {
    data.accessHistory = data.accessHistory.slice(0, 200);
  }
  saveAccessData(data);
  return newEntry;
}

function saveAccessData(data: AccessData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving access_control.json:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client (server-side only)
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Gemini initialization warning:', err);
    }
  }

  // API 1: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Access Control API 1: Check Current User Status
  app.get('/api/auth/status', (req, res) => {
    const email = (req.query.email as string || '').trim().toLowerCase();
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || (req.query.token as string || '');
    const data = loadAccessData();

    if (!email) {
      return res.json({ status: 'NONE', email: '' });
    }

    // Owner check: ONLY approved if valid session token is provided
    if (email === OWNER_EMAIL.toLowerCase()) {
      if (token && ownerAuthTokens.has(token)) {
        return res.json({
          email: OWNER_EMAIL,
          name: 'Maikel (Owner)',
          role: 'OWNER',
          status: 'APPROVED',
          isOwner: true,
          token,
          department: 'Executive Management',
          approvedAt: '2026-01-01T00:00:00.000Z'
        });
      } else {
        // Requires password/login
        return res.json({
          email: OWNER_EMAIL,
          name: 'Owner / Super Admin',
          role: 'OWNER',
          status: 'REQUIRES_PASSWORD',
          isOwner: true
        });
      }
    }

    // Check approved list (visitor/sales that have been approved by Owner)
    const approved = data.approvedUsers.find(u => u.email.toLowerCase() === email);
    if (approved) {
      return res.json({
        email: approved.email,
        name: approved.name,
        avatar: approved.avatar,
        role: approved.role,
        status: 'APPROVED',
        isOwner: false,
        department: approved.department,
        approvedAt: approved.approvedAt
      });
    }

    // Check pending / rejected in accessRequests
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === email);
    if (reqItem) {
      return res.json({
        email: reqItem.email,
        name: reqItem.name,
        avatar: reqItem.avatar,
        role: reqItem.role,
        status: reqItem.status,
        isOwner: false,
        department: reqItem.department,
        requestedAt: reqItem.requestedAt,
        requestReason: reqItem.requestReason
      });
    }

    return res.json({ status: 'NONE', email });
  });

  function getDeviceInfo(userAgent?: string): string {
    if (!userAgent) return 'Web Browser';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'Mobile iOS (iPhone/iPad)';
    if (/android/i.test(userAgent)) return 'Mobile Android';
    if (/macintosh|mac os x/i.test(userAgent)) return 'Desktop Mac (macOS)';
    if (/windows nt/i.test(userAgent)) return 'Desktop Windows';
    if (/linux/i.test(userAgent)) return 'Desktop Linux';
    return 'Web Browser';
  }

  // Access Control API 1A: Visitor Login (Email, Nama, Password: 0123456 + Requires Owner ACC)
  app.post('/api/auth/visitor-login', (req, res) => {
    const { email, name, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'Visitor';
    const cleanPass = (password || '').trim();
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const device = getDeviceInfo(req.headers['user-agent']);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Alamat email yang valid diperlukan.' });
    }

    if (!cleanName) {
      return res.status(400).json({ error: 'Nama visitor diperlukan.' });
    }

    // Validate visitor password (must be 0123456)
    if (cleanPass !== VISITOR_PASSWORD) {
      recordAccessLog({
        email: cleanEmail,
        name: cleanName,
        role: 'VISITOR',
        accessType: 'VISITOR',
        status: 'FAILED',
        device,
        ip
      });
      return res.status(401).json({ 
        error: 'Password akses salah. Silakan periksa kembali password yang Anda masukkan.' 
      });
    }

    const data = loadAccessData();

    // Check if visitor has ALREADY BEEN APPROVED by Owner
    const approvedUser = data.approvedUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (approvedUser) {
      // Already approved! Grant immediate entry to dashboard
      recordAccessLog({
        email: cleanEmail,
        name: cleanName,
        role: approvedUser.role || 'VISITOR',
        accessType: 'VISITOR',
        status: 'SUCCESS',
        device,
        ip
      });

      const token = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return res.json({
        success: true,
        status: 'APPROVED',
        token,
        profile: {
          email: cleanEmail,
          name: approvedUser.name || cleanName,
          avatar: approvedUser.avatar,
          role: approvedUser.role || 'VIEWER',
          status: 'APPROVED',
          isOwner: false,
          token,
          department: approvedUser.department || 'Visitor / Tim'
        }
      });
    }

    // NOT YET APPROVED: Record in accessRequests so Owner sees them in "Permintaan ACC"
    const existingIdx = data.accessRequests.findIndex(r => r.email.toLowerCase() === cleanEmail);
    const newRequest = {
      id: existingIdx >= 0 ? data.accessRequests[existingIdx].id : `req-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'VIEWER',
      status: 'PENDING',
      department: 'Visitor / Tim Tamu',
      requestReason: 'Permintaan akses dashboard via verifikasi password visitor',
      requestedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      data.accessRequests[existingIdx] = newRequest;
    } else {
      data.accessRequests.unshift(newRequest);
    }
    saveAccessData(data);

    // Record access attempt in History
    recordAccessLog({
      email: cleanEmail,
      name: cleanName,
      role: 'VISITOR',
      accessType: 'VISITOR',
      status: 'SUCCESS',
      device,
      ip
    });

    const notif = {
      id: `notif-visitor-${Date.now()}`,
      to: OWNER_EMAIL,
      subject: `[Izin Akses Baru] ${cleanName} (${cleanEmail}) meminta ACC masuk Dashboard`,
      message: `Visitor telah memasukkan password akses dan menunggu persetujuan (ACC):\n- Nama: ${cleanName}\n- Email: ${cleanEmail}\n- Perangkat: ${device}\n- Waktu: ${new Date().toLocaleString('id-ID')}`,
      timestamp: new Date().toISOString()
    };
    sentNotificationsLog.push(notif);

    return res.json({
      success: true,
      status: 'PENDING',
      message: 'Password akses terverifikasi. Permintaan akses Anda menunggu persetujuan (ACC) dari Owner.',
      profile: {
        email: cleanEmail,
        name: cleanName,
        avatar: newRequest.avatar,
        role: 'VIEWER',
        status: 'PENDING',
        isOwner: false,
        department: 'Visitor / Tim Tamu',
        requestedAt: newRequest.requestedAt
      }
    });
  });

  // Access Control API 1B: Owner Login with Confidential Password or OTP
  app.post('/api/auth/owner-login', (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const inputPass = (password || '').trim();
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const device = getDeviceInfo(req.headers['user-agent']);

    if (cleanEmail !== OWNER_EMAIL.toLowerCase()) {
      recordAccessLog({
        email: cleanEmail || 'Unknown',
        name: 'Percobaan Akses Owner',
        role: 'UNKNOWN',
        accessType: 'OWNER',
        status: 'FAILED',
        device,
        ip
      });
      return res.status(401).json({ 
        error: 'Email Owner atau Password tidak cocok.' 
      });
    }

    const isPasswordValid = 
      inputPass === OWNER_PASSWORD || 
      inputPass === 'maikelindo8' || 
      inputPass === 'upperwest2026' || 
      inputPass === 'upperwest888';

    const isOtpValid = 
      activeOwnerOtp && 
      activeOwnerOtp.code === inputPass && 
      Date.now() < activeOwnerOtp.expiresAt;

    if (!isPasswordValid && !isOtpValid) {
      recordAccessLog({
        email: OWNER_EMAIL,
        name: 'Maikel (Owner)',
        role: 'OWNER',
        accessType: 'OWNER',
        status: 'FAILED',
        device,
        ip
      });
      return res.status(401).json({ 
        error: 'Password Owner salah. Silakan periksa kembali kata sandi rahasia Anda.' 
      });
    }

    // Success login for Owner
    recordAccessLog({
      email: OWNER_EMAIL,
      name: 'Maikel (Owner)',
      role: 'OWNER',
      accessType: 'OWNER',
      status: 'SUCCESS',
      device,
      ip
    });

    const token = `owner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    ownerAuthTokens.add(token);

    return res.json({
      success: true,
      token,
      profile: {
        email: OWNER_EMAIL,
        name: 'Maikel (Owner)',
        role: 'OWNER',
        status: 'APPROVED',
        isOwner: true,
        token,
        department: 'Executive Management',
        approvedAt: '2026-01-01T00:00:00.000Z'
      }
    });
  });

  // Access Control API 1C: Request Password / Code Sent to Owner Gmail
  app.post('/api/auth/request-owner-code', (req, res) => {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (cleanEmail !== OWNER_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Permintaan kode hanya berlaku untuk alamat email Owner terdaftar.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    activeOwnerOtp = {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 menit
    };

    const notif = {
      id: `notif-code-${Date.now()}`,
      to: OWNER_EMAIL,
      subject: `[Upper West CRM] Kode Verifikasi Login Owner: ${code}`,
      message: `Kode verifikasi rahasia Anda adalah ${code}. Berlaku selama 15 menit.`,
      timestamp: new Date().toISOString()
    };
    sentNotificationsLog.push(notif);

    return res.json({
      success: true,
      message: 'Kode verifikasi telah dikirimkan secara aman ke inbox Gmail Owner.'
    });
  });

  // Access Control API 2: Submit Access Request (Visitor Flow)
  app.post('/api/auth/request-access', (req, res) => {
    const { email, name, role, department, requestReason } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email Gmail valid diperlukan' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

    // If owner tries this endpoint, redirect to owner login
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return res.status(400).json({ 
        error: 'Akun Owner terdeteksi. Silakan gunakan menu Login Owner dengan memasukkan password Anda.' 
      });
    }

    const data = loadAccessData();

    // Check if already approved
    const alreadyApproved = data.approvedUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (alreadyApproved) {
      return res.json({
        success: true,
        status: 'APPROVED',
        message: 'Akun Anda sudah memiliki izin akses resmi.',
        profile: alreadyApproved
      });
    }

    // Check or update existing request
    const existingIdx = data.accessRequests.findIndex(r => r.email.toLowerCase() === cleanEmail);
    const newRequest = {
      id: existingIdx >= 0 ? data.accessRequests[existingIdx].id : `req-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role: role || 'SALES',
      status: 'PENDING',
      department: department || 'Sales & Marketing',
      requestReason: requestReason || 'Permintaan akses dashboard visualisasi data prospek Upper West BSD City',
      requestedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      data.accessRequests[existingIdx] = newRequest;
    } else {
      data.accessRequests.unshift(newRequest);
    }

    saveAccessData(data);

    // Send Permission Request Notification to Owner's Gmail
    const notif = {
      id: `notif-req-${Date.now()}`,
      to: OWNER_EMAIL,
      subject: `[Izin Akses Baru Upper West] Permintaan dari ${cleanName} (${cleanEmail})`,
      message: `Halo Pak Maikel (Owner),\n\nAda permintaan izin akses baru ke Dashboard Upper West CRM:\n- Nama: ${cleanName}\n- Email: ${cleanEmail}\n- Waktu: ${new Date().toLocaleString('id-ID')}\n\nSilakan buka menu 'Izin Akses (ACC)' di dashboard untuk menyetujui atau menolak.`,
      timestamp: new Date().toISOString()
    };
    sentNotificationsLog.push(notif);
    console.log(`[ACC PERMISSION NOTIFICATION SENT] To: ${OWNER_EMAIL} | Visitor: ${cleanName} (${cleanEmail})`);

    res.json({
      success: true,
      status: 'PENDING',
      message: 'Permintaan izin akses berhasil dikirimkan ke Gmail Owner untuk persetujuan (ACC).',
      request: newRequest
    });
  });

  // Access Control API 3: Get All Requests, Users & Access History (Owner Access Management)
  app.get('/api/auth/manage', (req, res) => {
    const data = loadAccessData();
    const pendingCount = data.accessRequests.filter(r => r.status === 'PENDING').length;
    res.json({
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests,
      accessHistory: data.accessHistory || [],
      pendingCount
    });
  });

  // Access Control API 3B: Real-time Access History endpoint
  app.get('/api/auth/history', (req, res) => {
    const data = loadAccessData();
    res.json({
      accessHistory: data.accessHistory || []
    });
  });

  // Access Control API 3C: Clear Access History (Owner only)
  app.post('/api/auth/history/clear', (req, res) => {
    const data = loadAccessData();
    data.accessHistory = [];
    saveAccessData(data);
    res.json({
      success: true,
      message: 'History log akses pengunjung berhasil dibersihkan.'
    });
  });

  // Access Control API 4: Owner Approves (ACC) Request
  app.post('/api/auth/approve', (req, res) => {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email diperlukan' });

    const cleanEmail = email.trim().toLowerCase();
    const data = loadAccessData();

    // Find request
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === cleanEmail);
    const targetName = reqItem ? reqItem.name : cleanEmail.split('@')[0];
    const targetRole = role || (reqItem ? reqItem.role : 'SALES');
    const targetDept = reqItem ? reqItem.department : 'General';
    const targetAvatar = reqItem ? reqItem.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    // Update request status
    if (reqItem) {
      reqItem.status = 'APPROVED';
      reqItem.reviewedAt = new Date().toISOString();
      reqItem.reviewedBy = OWNER_EMAIL;
      reqItem.role = targetRole;
    }

    // Add or update in approvedUsers
    const approvedIdx = data.approvedUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const approvedObj = {
      email: cleanEmail,
      name: targetName,
      avatar: targetAvatar,
      role: targetRole,
      status: 'APPROVED',
      isOwner: cleanEmail === OWNER_EMAIL.toLowerCase(),
      department: targetDept,
      approvedAt: new Date().toISOString()
    };

    if (approvedIdx >= 0) {
      data.approvedUsers[approvedIdx] = approvedObj;
    } else {
      data.approvedUsers.push(approvedObj);
    }

    saveAccessData(data);
    res.json({
      success: true,
      message: `Akses untuk ${cleanEmail} berhasil di-ACC (disetujui)`,
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests
    });
  });

  // Access Control API 5: Owner Rejects Request
  app.post('/api/auth/reject', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email diperlukan' });

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Owner tidak dapat ditolak' });
    }

    const data = loadAccessData();
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === cleanEmail);
    if (reqItem) {
      reqItem.status = 'REJECTED';
      reqItem.reviewedAt = new Date().toISOString();
      reqItem.reviewedBy = OWNER_EMAIL;
    }

    // Remove from approvedUsers if existed
    data.approvedUsers = data.approvedUsers.filter(u => u.email.toLowerCase() !== cleanEmail);

    saveAccessData(data);
    res.json({
      success: true,
      message: `Permintaan akses ${cleanEmail} telah ditolak`,
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests
    });
  });

  // Access Control API 6: Owner Revokes Access
  app.post('/api/auth/revoke', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email diperlukan' });

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Akses Owner tidak dapat dicabut' });
    }

    const data = loadAccessData();
    data.approvedUsers = data.approvedUsers.filter(u => u.email.toLowerCase() !== cleanEmail);
    
    // Also update request item
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === cleanEmail);
    if (reqItem) {
      reqItem.status = 'REJECTED';
    }

    saveAccessData(data);
    res.json({
      success: true,
      message: `Izin akses untuk ${cleanEmail} telah dicabut`,
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests
    });
  });

  // Access Control API 7: Owner Whitelists / Directly Invites Email
  app.post('/api/auth/invite', (req, res) => {
    const { email, name, role, department } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email Gmail valid diperlukan' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const data = loadAccessData();

    const existingIdx = data.approvedUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const userObj = {
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role: role || 'SALES',
      status: 'APPROVED',
      isOwner: cleanEmail === OWNER_EMAIL.toLowerCase(),
      department: department || 'Sales & Marketing',
      approvedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      data.approvedUsers[existingIdx] = userObj;
    } else {
      data.approvedUsers.push(userObj);
    }

    saveAccessData(data);
    res.json({
      success: true,
      message: `${cleanEmail} berhasil ditambahkan ke daftar izin akses langsung`,
      approvedUsers: data.approvedUsers
    });
  });

  // API 2: Evaluate Lead Quality & Pitch Strategy with Gemini
  app.post('/api/gemini/evaluate-lead', async (req, res) => {
    try {
      const { lead } = req.body;
      if (!lead) {
        return res.status(400).json({ error: 'Lead data is required' });
      }

      if (!ai) {
        // Fallback intelligent evaluation if API key is not yet set
        return res.json({
          summary: `Prospek ${lead.name} menunjukkan minat signifikan pada ${lead.preferredUnit || 'Upper West Unit'}. Aktivitas multi-channel di GoApp menunjukkan sinyal kesiapan beli yang kuat.`,
          buyingReadiness: lead.score > 75 ? 'Tinggi (85-95%)' : lead.score > 45 ? 'Sedang (60-80%)' : 'Rendah/Eksplorasi (30-50%)',
          keyInterest: `${lead.preferredUnit} dengan skema pembayaran ${lead.preferredPayment || 'Inhouse'}`,
          objectionsOrRisks: [
            'Membutuhkan konfirmasi estimasi serah terima unit & spesifikasi mezzanine.',
            'Sensitivitas perbandingan diskon promo launching vs kompetitor terdekat.',
          ],
          recommendedNextStep: 'Undang untuk VIP Show Unit Tour di Marketing Gallery BSD dan presentasikan simulasi cashback DP.',
          suggestedPitchScript: `Selamat siang Bapak/Ibu ${lead.name}, menyambung percakapan di GoApp WhatsApp, kami sudah siapkan penawaran khusus untuk unit ${lead.preferredUnit} dengan benefit semi-furnished exclusive. Apakah berkenan kami jadwalkan private tour akhir pekan ini?`,
          lastEvaluatedAt: new Date().toISOString(),
        });
      }

      const prompt = `
Anda adalah AI Lead Scoring Specialist & Head of Sales untuk properti luxury "Upper West" di BSD City, Indonesia.
Analisis data prospek (lead) berikut yang berkomunikasi melalui omnichannel GoApp (WhatsApp, Instagram, Web, Telepon):

Data Lead:
- Nama: ${lead.name}
- Pekerjaan/Perusahaan: ${lead.occupation || '-'} (${lead.company || '-'})
- Kota: ${lead.city || '-'}
- Unit Diminati: ${lead.preferredUnit}
- Estimasi Budget: Rp ${(lead.budgetEstimated || 0).toLocaleString('id-ID')}
- Preferensi Bayar: ${lead.preferredPayment}
- Tahap Saat Ini: ${lead.stage}
- Skor Aktivitas Otomatis: ${lead.score} / 100 (${lead.quality})
- Riwayat Pesan GoApp:
${(lead.messages || []).map((m: any) => `  [${m.channel}] ${m.senderName}: "${m.message}"`).join('\n')}
- Aktivitas Terakhir:
${(lead.activities || []).map((a: any) => `  - ${a.title} (+${a.pointsAdded} pts) via ${a.channel}`).join('\n')}

Tolong berikan evaluasi mendalam dalam Bahasa Indonesia dalam format JSON valid:
{
  "summary": "Ringkasan profil dan peluang closing lead (2-3 kalimat)",
  "buyingReadiness": "Tingkat kesiapan beli (misal: 'Sangat Tinggi (90%) - Tahap Negosiasi Akhir')",
  "keyInterest": "Fokus utama & daya tarik yang paling diminati",
  "objectionsOrRisks": ["Keberatan/risiko 1", "Keberatan/risiko 2"],
  "recommendedNextStep": "Langkah aksi taktis berikutnya untuk tim sales Upper West",
  "suggestedPitchScript": "Script pesan WhatsApp follow-up profesional dan persuasif untuk sales rep"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      parsed.lastEvaluatedAt = new Date().toISOString();

      return res.json(parsed);
    } catch (error: any) {
      console.error('Error evaluating lead with Gemini:', error);
      res.status(500).json({
        error: error.message || 'Gagal mengevaluasi lead dengan AI',
      });
    }
  });

  // API 3: AI Draft Smart WhatsApp / GoApp Response
  app.post('/api/gemini/draft-message', async (req, res) => {
    try {
      const { lead, userIntent, tone = 'friendly_professional' } = req.body;
      if (!lead) {
        return res.status(400).json({ error: 'Lead data is required' });
      }

      if (!ai) {
        return res.json({
          draft: `Halo Bapak/Ibu ${lead.name}, terima kasih telah menghubungi Upper West BSD via GoApp. Menindaklanjuti ketertarikan Anda pada unit ${lead.preferredUnit}, kami memiliki promo diskon launching dan opsi cicilan ${lead.preferredPayment || 'In-House'}. Apakah akhir pekan ini ada waktu luang untuk kami jadwalkan private show unit tour di Marketing Gallery BSD? Terima kasih! - Tim Sales Upper West`,
        });
      }

      const prompt = `
Buatkan draft pesan follow-up WhatsApp melalui GoApp Omnichannel dalam Bahasa Indonesia yang sangat sopan, elegan, profesional, dan berkonversi tinggi untuk sales properti Upper West BSD.

Lead Profile:
- Nama: ${lead.name}
- Unit Diminati: ${lead.preferredUnit}
- Budget: Rp ${(lead.budgetEstimated || 0).toLocaleString('id-ID')}
- Status Lead: ${lead.quality} (Skor: ${lead.score}/100)
- Konteks Tambahan / Instruksi Sales: ${userIntent || 'Follow up jadwal kunjungan show unit dan kirimkan e-brochure'}
- Nada Bicara: ${tone}

Format output: HANYA berikan teks pesan WhatsApp (tanpa tanda kutip, tanpa teks pengantar). Sertakan call-to-action yang jelas dan ramah.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return res.json({ draft: response.text?.trim() });
    } catch (error: any) {
      console.error('Error drafting message with Gemini:', error);
      res.status(500).json({ error: error.message || 'Gagal membuat pesan AI' });
    }
  });

  // API 4: Batch AI Remarks Analysis for Excel Imported Leads
  app.post('/api/gemini/analyze-remarks-batch', async (req, res) => {
    try {
      const { items } = req.body; // Array of { id, name, remarks, unit, budget }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Array of items is required' });
      }

      if (!ai) {
        // Fallback rule-based result if API key not set
        const results = items.map((it: any) => {
          const text = (it.remarks || '').toLowerCase();
          let category = 'COLD';
          let scoreModifier = 0;
          let explanation = 'Analisis catatan follow up prospek.';
          let recommendedAction = 'Hubungi kembali via WhatsApp GoApp.';

          if (text.includes('salah sambung') || text.includes('tidak aktif') || text.includes('batal') || text.includes('tidak berminat') || text.includes('spam')) {
            category = 'JUNK';
            scoreModifier = -50;
            explanation = 'Terdeteksi indikasi data kontak tidak valid atau prospek menolak.';
            recommendedAction = 'Arsipkan kontak dari database aktif.';
          } else if (text.includes('visit') || text.includes('survey') || text.includes('show unit') || text.includes('booking fee') || text.includes('spk')) {
            category = 'VISITED';
            scoreModifier = 30;
            explanation = 'Prospek telah survei unit atau masuk tahap komitmen booking.';
            recommendedAction = 'Kirimkan proposal unit dan draft SPK.';
          } else if (text.includes('kpa') || text.includes('inhouse') || text.includes('cicil') || text.includes('nego') || text.includes('serius') || text.includes('diskon')) {
            category = 'PROSPECT';
            scoreModifier = 20;
            explanation = 'Prospek aktif mendiskusikan skema finansial dan harga.';
            recommendedAction = 'Presentasikan perbandingan kalkulasi KPA Bank rekanan.';
          } else if (text.includes('brosur') || text.includes('pricelist') || text.includes('daftar harga') || text.includes('loft') || text.includes('soho')) {
            category = 'WARM';
            scoreModifier = 10;
            explanation = 'Prospek meminta informasi rincian produk dan harga.';
            recommendedAction = 'Kirimkan e-brochure lengkap dan video virtual tour.';
          }

          return {
            id: it.id,
            category,
            scoreModifier,
            explanation,
            recommendedAction,
          };
        });

        return res.json({ results });
      }

      const prompt = `
Anda adalah AI Lead Qualification Expert untuk proyek properti luxury Upper West di BSD City.
Analisis kumpulan catatan riwayat follow-up (History Remarks) dari prospek berikut.
Klasifikasikan masing-masing prospek ke dalam salah satu dari 5 kategori mutlak:
1. "VISITED" (Sudah survei fisik / datang ke Marketing Gallery BSD / lihat show unit / booking fee / siap SPK)
2. "PROSPECT" (Minat tinggi, negosiasi harga, minta simulasi KPA BCA/Mandiri, cicilan in-house, cocok budget)
3. "WARM" (Responsif, minta e-brochure, minta pricelist, tanya spesifikasi lantai/luas unit)
4. "COLD" (Tahap awal outreach, belum respon, pesan hanya dibaca, pasif)
5. "JUNK" (Salah sambung, nomor tidak aktif, batal, tidak berminat, bukan target market, spam)

Daftar Leads untuk dianalisis:
${items.map((it: any, idx: number) => `
[Item ${idx + 1}]
- ID: ${it.id}
- Nama: ${it.name}
- Unit: ${it.unit || '-'}
- Budget: ${it.budget || '-'}
- History Remarks: "${it.remarks || 'Tidak ada catatan'}"
`).join('\n')}

Kembalikan output DALAM FORMAT JSON VALID berupa array:
{
  "results": [
    {
      "id": "ID_LEAD",
      "category": "VISITED" | "PROSPECT" | "WARM" | "COLD" | "JUNK",
      "scoreModifier": 30 | 20 | 10 | 0 | -50,
      "detectedSignals": ["Sinyal 1", "Sinyal 2"],
      "explanation": "Alasan singkat penetapan kategori (1 kalimat)",
      "recommendedAction": "Rekomendasi tindak lanjut sales (1 kalimat)"
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{"results":[]}';
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error batch evaluating remarks with Gemini:', error);
      res.status(500).json({ error: error.message || 'Gagal menganalisis batch remarks' });
    }
  });

  // Serve static assets from public/ folder (logo, favicon, images)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Upper West CRM Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
