import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  Crown, 
  X, 
  UserCheck, 
  UserX, 
  Mail, 
  Clock, 
  Trash2, 
  PlusCircle, 
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  History,
  RefreshCw,
  Laptop,
  Smartphone,
  Globe,
  Filter,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccessManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessManagementModal: React.FC<AccessManagementModalProps> = ({ isOpen, onClose }) => {
  const { 
    pendingRequests, 
    approvedUsers, 
    accessHistory = [],
    refreshHistory,
    clearAccessHistory,
    approveUser, 
    rejectUser, 
    revokeUser, 
    inviteUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'HISTORY' | 'PENDING' | 'APPROVED' | 'INVITE'>('HISTORY');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [historySearch, setHistorySearch] = useState('');

  // Direct invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDept, setInviteDept] = useState('Sales Advisor Upper West');
  const [inviteRole, setInviteRole] = useState<UserRole>('SALES');
  const [searchTerm, setSearchTerm] = useState('');

  // Real-time polling every 4 seconds while modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Trigger initial refresh
    refreshHistory();

    const interval = setInterval(() => {
      refreshHistory();
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, refreshHistory]);

  if (!isOpen) return null;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshHistory();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh log riwayat akses pengunjung?')) {
      setActionLoading('clear-history');
      try {
        await clearAccessHistory();
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleApprove = async (email: string) => {
    setActionLoading(email);
    try {
      const assignedRole = selectedRoles[email] || 'SALES';
      const ok = await approveUser(email, assignedRole);
      if (ok) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (email: string) => {
    setActionLoading(email);
    try {
      await rejectUser(email);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (email: string) => {
    setActionLoading(email);
    try {
      await revokeUser(email);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) return;

    setActionLoading('invite');
    try {
      const ok = await inviteUser({
        email: inviteEmail.trim().toLowerCase(),
        name: inviteName.trim() || inviteEmail.split('@')[0],
        department: inviteDept,
        role: inviteRole
      });
      if (ok) {
        confetti({ particleCount: 50, spread: 50 });
        setInviteEmail('');
        setInviteName('');
        setActiveTab('APPROVED');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApproved = approvedUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter history
  const filteredHistory = accessHistory.filter(item => {
    // Status filter
    if (historyFilter !== 'ALL' && item.status !== historyFilter) return false;
    
    // Search query
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchEmail = item.email.toLowerCase().includes(q);
      const matchDevice = (item.device || '').toLowerCase().includes(q);
      const matchRole = (item.role || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchDevice || matchRole;
    }
    return true;
  });

  // Helper function to format relative or exact time
  const formatAccessTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);

      let relative = '';
      if (diffSec < 15) relative = 'Baru saja';
      else if (diffSec < 60) relative = `${diffSec} detik lalu`;
      else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)} menit lalu`;
      else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)} jam lalu`;
      else relative = `${Math.floor(diffSec / 86400)} hari lalu`;

      const exact = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
      return { relative, exact, fullDate: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) };
    } catch {
      return { relative: 'Waktu tercatat', exact: isoString, fullDate: '' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Owner Control Center
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Super Admin
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-Time Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pemantauan riwayat akses pengunjung dashboard &amp; manajemen izin otentikasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/40 flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {/* TAB 1: HISTORY AKSES (REAL-TIME) */}
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Akses Real-Time</span>
            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950">
              {accessHistory.length}
            </span>
          </button>

          {/* TAB 2: PENDING */}
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'PENDING'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Permintaan ACC</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950 animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          {/* TAB 3: APPROVED USERS */}
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'APPROVED'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pengguna Aktif</span>
            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-slate-800 text-slate-300">
              {approvedUsers.length}
            </span>
          </button>

          {/* TAB 4: INVITE */}
          <button
            onClick={() => setActiveTab('INVITE')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'INVITE'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Akses Langsung</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: HISTORY AKSES (REAL-TIME VISITOR LOG) */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              
              {/* Controls bar: Search, Filter status, Refresh, Clear */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama, email, perangkat..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Status filter buttons */}
                  <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        historyFilter === 'ALL'
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('SUCCESS')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        historyFilter === 'SUCCESS'
                          ? 'bg-emerald-500 text-white font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Berhasil
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('FAILED')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        historyFilter === 'FAILED'
                          ? 'bg-rose-500 text-white font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Gagal
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Perbarui Log</span>
                  </button>

                  {accessHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      disabled={actionLoading === 'clear-history'}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-all cursor-pointer"
                      title="Bersihkan Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table of Access Logs */}
              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Belum Ada Catatan Riwayat</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Setiap kali ada pengunjung atau pengguna yang mencoba masuk dengan kredensial, log akan tercatat secara real-time di sini.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-950/60">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Waktu Akses</th>
                          <th className="py-3 px-4">Nama Visitor</th>
                          <th className="py-3 px-4">Alamat Email</th>
                          <th className="py-3 px-4">Tipe &amp; Peran</th>
                          <th className="py-3 px-4">Perangkat / IP</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredHistory.map((item) => {
                          const time = formatAccessTime(item.timestamp);
                          const isSuccess = item.status === 'SUCCESS';
                          const isOwnerLog = item.role === 'OWNER' || item.accessType === 'OWNER';

                          return (
                            <tr 
                              key={item.id} 
                              className="hover:bg-slate-800/40 transition-colors"
                            >
                              {/* Waktu */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>{time.relative}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {time.exact} · {time.fullDate}
                                </div>
                              </td>

                              {/* Nama Visitor */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                    isOwnerLog 
                                      ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300' 
                                      : 'bg-indigo-600 text-white'
                                  }`}>
                                    {item.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-white whitespace-nowrap">
                                    {item.name}
                                  </span>
                                </div>
                              </td>

                              {/* Email */}
                              <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                                {item.email}
                              </td>

                              {/* Tipe & Peran */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {isOwnerLog ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                    <Crown className="w-3 h-3" />
                                    <span>OWNER</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                    <span>VISITOR</span>
                                  </span>
                                )}
                              </td>

                              {/* Perangkat & IP */}
                              <td className="py-3 px-4">
                                <div className="text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                                  {item.device?.includes('Mobile') ? (
                                    <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                                  ) : (
                                    <Laptop className="w-3 h-3 text-slate-400 shrink-0" />
                                  )}
                                  <span>{item.device || 'Browser Web'}</span>
                                </div>
                                {item.ip && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    IP: {item.ip}
                                  </div>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                {isSuccess ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Berhasil</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    <XCircle className="w-3 h-3 text-rose-400" />
                                    <span>Gagal</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PENDING REQUESTS */}
          {activeTab === 'PENDING' && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Semua Permintaan Telah Ditinjau</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Tidak ada permohonan akses baru saat ini.
                    </p>
                  </div>
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-slate-950/70 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-400/40 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={req.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={req.name}
                        className="w-11 h-11 rounded-full border border-amber-400/40 object-cover shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white">{req.name}</span>
                          <span className="text-xs font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            {req.email}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-300 font-semibold">{req.department}</span> · Diajukan {new Date(req.requestedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {req.requestReason && (
                          <p className="text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 italic">
                            &ldquo;{req.requestReason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions & Role Select */}
                    <div className="flex flex-col sm:items-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[11px] text-slate-400 font-semibold">Beri Peran:</span>
                        <select
                          value={selectedRoles[req.email] || req.role || 'SALES'}
                          onChange={(e) => setSelectedRoles({ ...selectedRoles, [req.email]: e.target.value as UserRole })}
                          className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400"
                        >
                          <option value="SALES">Sales Advisor</option>
                          <option value="MARKETING">Marketing</option>
                          <option value="VIEWER">Viewer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleReject(req.email)}
                          disabled={actionLoading === req.email}
                          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => handleApprove(req.email)}
                          disabled={actionLoading === req.email}
                          className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>ACC &amp; Izinkan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: APPROVED ACTIVE USERS */}
          {activeTab === 'APPROVED' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau departemen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-2.5">
                {filteredApproved.map((u) => (
                  <div
                    key={u.email}
                    className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={u.name}
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{u.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            u.isOwner 
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role || 'SALES'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono block">{u.email}</span>
                        <span className="text-[11px] text-slate-500">{u.department || 'Upper West Staff'}</span>
                      </div>
                    </div>

                    {!u.isOwner && (
                      <button
                        onClick={() => handleRevoke(u.email)}
                        disabled={actionLoading === u.email}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="Cabut Izin Akses"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT INVITE / WHITELIST */}
          {activeTab === 'INVITE' && (
            <form onSubmit={handleInviteSubmit} className="space-y-4 max-w-lg mx-auto bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-sm font-black text-white mb-1">
                  Beri Izin Akses Langsung
                </h4>
                <p className="text-xs text-slate-400">
                  Tambahkan email ke daftar yang langsung diizinkan masuk tanpa menunggu permintaan persetujuan.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@gmail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Departemen / Tim
                  </label>
                  <input
                    type="text"
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Peran Akses
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="SALES">Sales Advisor</option>
                    <option value="MARKETING">Marketing Specialist</option>
                    <option value="ADMIN">Co-Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading === 'invite' || !inviteEmail.trim()}
                className="w-full py-3 px-4 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{actionLoading === 'invite' ? 'Menyimpan...' : 'Beri Akses Langsung Sekarang'}</span>
              </button>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Hak Akses Terverifikasi &bull; Super Admin Control Panel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
