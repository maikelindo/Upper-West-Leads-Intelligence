import React, { useState } from 'react';
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
  CheckCircle2
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
    approveUser, 
    rejectUser, 
    revokeUser, 
    inviteUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'INVITE'>('PENDING');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Direct invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDept, setInviteDept] = useState('Sales Advisor Upper West');
  const [inviteRole, setInviteRole] = useState<UserRole>('SALES');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

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
    if (window.confirm(`Cabut izin akses untuk ${email}?`)) {
      setActionLoading(email);
      try {
        await revokeUser(email);
      } finally {
        setActionLoading(null);
      }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Manajemen Izin Akses Pengguna
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Owner Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persetujuan akses via Gmail untuk dashboard Upper West BSD City
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
        <div className="px-6 pt-4 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'PENDING'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Permintaan Menunggu ACC</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950 animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'APPROVED'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pengguna Aktif Disetujui</span>
            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-slate-800 text-slate-300">
              {approvedUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INVITE')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'INVITE'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Beri Akses Langsung (Whitelist)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: PENDING REQUESTS */}
          {activeTab === 'PENDING' && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Semua Permintaan Telah Ditinjau</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Tidak ada permohonan akses baru saat ini. Setiap ada yang mengajukan izin lewat Gmail, akan langsung muncul di sini.
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
                        <p className="text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 italic">
                          &ldquo;{req.requestReason}&rdquo;
                        </p>
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
                          className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>{actionLoading === req.email ? 'Memproses...' : 'Setujui (ACC)'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: APPROVED USERS */}
          {activeTab === 'APPROVED' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari email atau nama pengguna aktif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-2">
                {filteredApproved.map((user) => (
                  <div
                    key={user.email}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{user.name}</span>
                          {user.isOwner ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950">
                              Owner Permanen
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300">
                              {user.role}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.isOwner ? (
                        <span className="text-[11px] text-amber-400 font-bold px-3 py-1">
                          Akses Utama
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRevoke(user.email)}
                          disabled={actionLoading === user.email}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Cabut Izin Akses"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT INVITE / WHITELIST */}
          {activeTab === 'INVITE' && (
            <form onSubmit={handleInviteSubmit} className="space-y-4 max-w-lg mx-auto py-2">
              <div className="text-center space-y-1 mb-4">
                <h4 className="text-sm font-black text-white">
                  Beri Akses Langsung Tanpa Antri
                </h4>
                <p className="text-xs text-slate-400">
                  Akun Gmail yang didaftarkan di sini dapat langsung masuk ke dashboard tanpa perlu menunggu approval.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alamat Gmail</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: rekan.baru@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  placeholder="Nama lengkap rekan"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Divisi
                  </label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Sales Advisor Upper West">Sales Advisor</option>
                    <option value="Inhouse Sales Senior">Inhouse Sales</option>
                    <option value="Digital Marketing Team">Digital Marketing</option>
                    <option value="Management & SPV">Management</option>
                  </select>
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
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Owner: <strong className="text-amber-300 font-mono">maikelindo8@gmail.com</strong></span>
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
