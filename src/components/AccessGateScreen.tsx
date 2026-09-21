import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Briefcase, 
  FileText, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  Building2, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccessGateScreenProps {
  onSuccessApproved?: () => void;
}

export const AccessGateScreen: React.FC<AccessGateScreenProps> = ({ onSuccessApproved }) => {
  const { 
    currentUser, 
    login, 
    logout, 
    submitAccessRequest, 
    checkStatus, 
    isLoading 
  } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [department, setDepartment] = useState('Sales Advisor Upper West');
  const [role, setRole] = useState<UserRole>('SALES');
  const [requestReason, setRequestReason] = useState('Review performa data leads iklan digital & follow-up prospek Upper West BSD City');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGoogleLogin = async (presetEmail?: string, presetName?: string) => {
    const emailToUse = presetEmail || inputEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      showToast('Masukkan alamat Gmail yang valid');
      return;
    }

    const profile = await login(emailToUse, presetName || inputName.trim());
    if (profile.status === 'APPROVED') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onSuccessApproved?.();
    } else {
      showToast(`Masuk sebagai ${profile.email}. Silakan ajukan izin akses.`);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const success = await submitAccessRequest({
        name: inputName.trim() || currentUser.name,
        department,
        requestReason,
        role
      });

      if (success) {
        showToast('Permintaan izin akses berhasil dikirim ke Owner (maikelindo8@gmail.com)!');
      } else {
        showToast('Gagal mengirim permintaan. Silakan coba kembali.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const fresh = await checkStatus();
      if (fresh?.status === 'APPROVED') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('Selamat! Izin akses Anda telah di-ACC oleh Owner.');
        onSuccessApproved?.();
      } else if (fresh?.status === 'PENDING') {
        showToast('Status masih menunggu persetujuan (ACC) dari Owner.');
      } else if (fresh?.status === 'REJECTED') {
        showToast('Permintaan akses Anda belum disetujui.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div id="access-gate-screen" className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden text-slate-100 select-none">
      
      {/* Dynamic Luxury Ambient Lighting Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-amber-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-400/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation / Brand Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Upper West Logo"
            className="w-11 h-11 rounded-full object-cover shadow-lg ring-2 ring-amber-400/50 shrink-0 bg-amber-400"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest uppercase text-white font-mono">
                Upper West
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                BSD CITY
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Executive Lead Intelligence &amp; Revenue CRM
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Sistem Akses Internal Terbatas</span>
        </div>
      </header>

      {/* Center Portal Box */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 py-6 my-auto">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 relative">
          
          {/* Subtle Top Accent Glow Line */}
          <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* STATE 1: NOT LOGGED IN YET */}
          {!currentUser && (
            <div className="space-y-6">
              <div className="text-center space-y-2.5">
                <div className="flex justify-center mb-1">
                  <div className="relative">
                    <img
                      src="/logo.png"
                      alt="Upper West Official Logo"
                      className="w-20 h-20 rounded-full object-cover shadow-2xl ring-4 ring-amber-400/40 bg-amber-400"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-slate-950 text-amber-400 border border-amber-400/50 rounded-full text-[9px] font-black tracking-wider uppercase">
                      OFFICIAL
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verifikasi Izin Akses Gmail</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Masuk ke Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Dashboard ini dilindungi izin otorisasi. Setiap akun Gmail harus disetujui (ACC) oleh Owner sebelum dapat melihat data penjualan &amp; leads.
                </p>
              </div>

              {/* Instant Owner Quick-Access Card */}
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-transparent border border-amber-400/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">Owner / Super Admin</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">Akses Penuh</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 font-mono">maikelindo8@gmail.com</p>
                  </div>
                </div>
                <button
                  id="btn-login-owner"
                  onClick={() => handleGoogleLogin('maikelindo8@gmail.com', 'Maikel (Owner)')}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                >
                  <span>Masuk Langsung</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <div className="flex-1 h-px bg-white/10" />
                <span>Atau Masuk dengan Akun Lain</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google Sign In / Manual Gmail Form */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Alamat Akun Gmail Anda
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="contoh: nama.sales@gmail.com"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>

                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Nama Lengkap Anda (opsional)"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>

                <button
                  id="btn-google-sign-in"
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoading || !inputEmail.trim()}
                  className="w-full py-3 px-4 rounded-xl text-sm font-black bg-white hover:bg-slate-100 text-slate-950 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {/* Google Colorful SVG Icon */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Lanjutkan Masuk dengan Gmail</span>
                </button>
              </div>

              {/* Sample Quick Testing Pills */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-[11px] text-slate-400 font-medium mb-2 text-center">
                  Atau uji coba alur permintaan izin dengan akun demo:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => handleGoogleLogin('fitri.sales@gmail.com', 'Fitriyani Dewi')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all"
                  >
                    fitri.sales@gmail.com
                  </button>
                  <button
                    onClick={() => handleGoogleLogin('rekan.baru@gmail.com', 'Rekan Sales Baru')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all"
                  >
                    rekan.baru@gmail.com
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: LOGGED IN, BUT NEEDS TO REQUEST ACCESS (status === 'NONE') */}
          {currentUser && currentUser.status === 'NONE' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Izin Akses Belum Terdaftar</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Ajukan Permintaan Izin Akses
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Akun Anda terverifikasi, namun memerlukan persetujuan (ACC) dari Owner untuk membuka seluruh modul &amp; data dashboard.
                </p>
              </div>

              {/* Logged in User Badge */}
              <div className="bg-slate-950/70 border border-white/15 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full border border-amber-400/40 object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{currentUser.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{currentUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ganti Akun</span>
                </button>
              </div>

              {/* Form Request */}
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nama Lengkap Anda</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputName || currentUser.name}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      <span>Divisi / Unit Kerja</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Sales Advisor Upper West">Sales Advisor Upper West</option>
                      <option value="Inhouse Sales Team">Inhouse Sales Team</option>
                      <option value="Digital & Performance Marketing">Digital Marketing</option>
                      <option value="Management & SPV">Management &amp; SPV</option>
                      <option value="External Broker / Partner">External Broker / Partner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Peran yang Diajukan</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="SALES">Sales Advisor</option>
                      <option value="MARKETING">Marketing Specialist</option>
                      <option value="VIEWER">Viewer (Hanya Lihat)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Keperluan Akses Data</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Contoh: Mengelola leads masuk kampanye digital dan melihat performa closing mingguan"
                    className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mengirim Permintaan...' : 'Kirim Permintaan Izin ke Owner (maikelindo8@gmail.com)'}</span>
                </button>
              </form>
            </div>
          )}

          {/* STATE 3: PENDING APPROVAL (status === 'PENDING') */}
          {currentUser && currentUser.status === 'PENDING' && (
            <div className="space-y-6 text-center">
              
              {/* Pulse Animated Status Icon */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-400/30">
                  <Clock className="w-8 h-8 animate-spin-slow" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <span>Status: Menunggu ACC Owner</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Permintaan Sedang Ditinjau
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Permintaan izin akses Anda telah berhasil terkirim kepada Owner (<strong className="text-amber-300 font-mono">maikelindo8@gmail.com</strong>).
                </p>
              </div>

              {/* Request Details Box */}
              <div className="bg-slate-950/80 border border-white/15 rounded-2xl p-5 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Akun Pemohon</span>
                    <span className="text-sm font-black text-white">{currentUser.name}</span>
                    <span className="text-xs text-amber-300 font-mono block">{currentUser.email}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {currentUser.role || 'SALES'}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400 font-semibold">Divisi:</span> {currentUser.department || department}
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Keperluan:</span> {currentUser.requestReason || requestReason}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  id="btn-check-acc-status"
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Memeriksa Persetujuan...' : 'Cek Status Persetujuan Sekarang'}</span>
                </button>

                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sistem memantau persetujuan secara otomatis di latar belakang</span>
                </p>

                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Ganti Akun Gmail</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 4: REJECTED (status === 'REJECTED') */}
          {currentUser && currentUser.status === 'REJECTED' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">
                  Permintaan Akses Belum Disetujui
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Akun <strong className="text-rose-300 font-mono">{currentUser.email}</strong> belum diberikan izin untuk mengakses dashboard ini oleh Owner.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    submitAccessRequest({
                      name: currentUser.name,
                      department,
                      requestReason: 'Pengajuan ulang izin akses dashboard Upper West',
                      role: 'SALES'
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ajukan Permintaan Ulang</span>
                </button>

                <button
                  onClick={logout}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ganti Akun Gmail</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Minimalist */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-[11px] text-slate-500 font-medium">
        Upper West BSD City · Integrated Property Management System &copy; 2026. Hak Akses Dikelola oleh Super Admin.
      </footer>
    </div>
  );
};
