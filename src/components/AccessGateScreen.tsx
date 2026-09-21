import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Users,
  TableProperties
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccessGateScreenProps {
  onSuccessApproved?: () => void;
}

export const AccessGateScreen: React.FC<AccessGateScreenProps> = ({ onSuccessApproved }) => {
  const { 
    currentUser, 
    visitorLogin,
    ownerLogin,
    logout, 
    checkStatus, 
    isLoading 
  } = useAuth();

  // Active Tab: 'VISITOR' (default for everyone) vs 'OWNER' (confidential login for owner)
  const [activeTab, setActiveTab] = useState<'VISITOR' | 'OWNER'>('VISITOR');

  // Visitor Form State
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPassword, setVisitorPassword] = useState('');
  const [showVisitorPassword, setShowVisitorPassword] = useState(false);

  // Owner Form State (Kept completely confidential, empty by default)
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Status & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-transition into dashboard if user status becomes APPROVED
  useEffect(() => {
    if (currentUser && currentUser.status === 'APPROVED') {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      onSuccessApproved?.();
    }
  }, [currentUser, onSuccessApproved]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Visitor Login (Email, Nama Visitor, Password must be 0123456, then requires Owner ACC)
  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = visitorEmail.trim().toLowerCase();
    const name = visitorName.trim();
    const pass = visitorPassword.trim();

    if (!email || !email.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    if (!name) {
      setErrorMessage('Masukkan nama visitor lengkap Anda.');
      return;
    }

    if (!pass) {
      setErrorMessage('Masukkan password akses visitor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await visitorLogin({
        email,
        name,
        password: pass
      });

      if (res.success) {
        if (res.status === 'APPROVED') {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
          showToast(`Akses disetujui! Selamat datang, ${name}. Membuka dashboard...`);
          onSuccessApproved?.();
        } else {
          // Status is PENDING - Waiting for Owner ACC
          showToast(`Password terverifikasi. Permintaan akses sedang menunggu persetujuan (ACC) Owner.`);
        }
      } else {
        setErrorMessage(res.error || 'Password akses salah. Silakan periksa kembali password yang Anda masukkan.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat memproses login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Owner Login (Confidential credentials, no hints exposed)
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = ownerEmail.trim().toLowerCase();
    const pass = ownerPassword.trim();

    if (!email || !email.includes('@')) {
      setErrorMessage('Masukkan alamat email Owner terdaftar.');
      return;
    }

    if (!pass) {
      setErrorMessage('Masukkan kata sandi akun Owner.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ownerLogin(pass, email);
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        showToast('Login berhasil sebagai Owner / Super Admin.');
        onSuccessApproved?.();
      } else {
        setErrorMessage(res.error || 'Email atau password Owner salah. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Check if Pending Request has been Approved (if applicable)
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
        showToast('Izin akses telah disetujui Owner! Membuka dashboard...');
        onSuccessApproved?.();
      } else if (fresh?.status === 'PENDING') {
        showToast('Status masih menunggu persetujuan (ACC) dari Owner.');
      } else if (fresh?.status === 'REJECTED') {
        showToast('Permintaan akses ditolak oleh Owner.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div id="access-gate-screen" className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden text-slate-100 select-none">
      
      {/* Background Lighting & Subtle Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-b from-amber-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-[30%] right-[-10%] w-[450px] h-[450px] bg-amber-600/10 rounded-full blur-3xl" />
        
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-400/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Upper West Official Logo"
            className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-amber-400/40 bg-amber-400"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-sm font-black text-white tracking-wider uppercase block">
              UPPER WEST
            </span>
            <span className="text-[10px] text-amber-400 tracking-widest uppercase font-semibold">
              BSD City · Property CRM &amp; Lead Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 border border-white/10 text-slate-300">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Sistem Terproteksi</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden">
          
          {/* Top Decorative Gold Line */}
          <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* STATE 1: PENDING APPROVAL VIEW (AFTER VISITOR SUBMITS PASSWORD 0123456) */}
          {currentUser && currentUser.status === 'PENDING' && (
            <div className="space-y-6 text-center">
              
              <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-400/30">
                  <Clock className="w-8 h-8 animate-spin-slow" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Menunggu Persetujuan (ACC) Owner</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Permintaan Akses Terkirim
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Password akses berhasil diverifikasi. Akun Anda sedang menunggu persetujuan resmi (ACC) dari Owner sebelum dapat masuk ke dashboard.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-white/15 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Pemohon</span>
                    <span className="text-sm font-black text-white">{currentUser.name}</span>
                    <span className="text-xs text-amber-300 font-mono block">{currentUser.email}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Menunggu ACC
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
                  <span className="text-slate-400">Status Password:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
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
                  <span>{isChecking ? 'Memeriksa Persetujuan...' : 'Cek Status Persetujuan (ACC)'}</span>
                </button>

                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sistem memantau persetujuan Owner secara real-time</span>
                </p>

                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Ganti Email / Masuk Ulang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: REJECTED VIEW */}
          {currentUser && currentUser.status === 'REJECTED' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">
                  Akses Ditolak
                </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Akses untuk akun <strong className="text-rose-300 font-mono">{currentUser.email}</strong> belum diberikan izin oleh Owner.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={logout}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ganti Akun Email</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: FORM ENTRY (VISITOR FORM OR CONFIDENTIAL OWNER LOGIN) */}
          {(!currentUser || currentUser.status === 'NONE' || currentUser.status === 'REQUIRES_PASSWORD') && (
            <div className="space-y-5">
              
              {/* Logo & Headline */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <img
                      src="/logo.png"
                      alt="Upper West Official Logo"
                      className="w-16 h-16 rounded-full object-cover shadow-2xl ring-4 ring-amber-400/40 bg-amber-400"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-slate-950 text-amber-400 border border-amber-400/50 rounded-full text-[9px] font-black tracking-wider uppercase">
                      OFFICIAL
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl font-black text-white tracking-tight">
                  Dashboard Upper West
                </h1>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Sistem pemantauan prospek dan lead intelligence Upper West BSD City.
                </p>
              </div>

              {/* Mode Switch Tabs */}
              <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  id="tab-visitor"
                  onClick={() => {
                    setActiveTab('VISITOR');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'VISITOR'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Akses Pengunjung / Tim</span>
                </button>

                <button
                  type="button"
                  id="tab-owner"
                  onClick={() => {
                    setActiveTab('OWNER');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'OWNER'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Login Khusus Owner</span>
                </button>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl animate-in fade-in flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* TAB 1: VISITOR ACCESS FORM (TABLE FORMAT: 1. Email, 2. Nama, 3. Password tanpa menampilkan angka) */}
              {activeTab === 'VISITOR' && (
                <form onSubmit={handleVisitorSubmit} className="space-y-4">
                  
                  {/* Styled Summary Table / Specification Card (Password hidden from display) */}
                  <div className="bg-slate-950/80 border border-amber-400/30 rounded-2xl p-3.5 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                        <TableProperties className="w-4 h-4" />
                        <span>Kredensial Akses Pengunjung:</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold">
                        Perlu ACC Owner
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-white/5">
                        <span className="text-slate-400 block font-medium">1. Alamat Email</span>
                        <span className="text-white font-semibold truncate block">Email Anda</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-white/5">
                        <span className="text-slate-400 block font-medium">2. Nama Visitor</span>
                        <span className="text-white font-semibold truncate block">Nama Lengkap</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-white/5">
                        <span className="text-slate-400 block font-medium">3. Pasword</span>
                        <span className="text-white font-semibold truncate block">Wajib Diisi</span>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3 pt-1">
                    {/* 1. Alamat Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>1. Alamat Email Visitor</span>
                        <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          id="visitor-email"
                          placeholder="contoh: nama.anda@gmail.com"
                          value={visitorEmail}
                          onChange={(e) => setVisitorEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* 2. Nama Visitor */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>2. Nama Visitor</span>
                        <span className="text-[10px] text-slate-400 font-normal">Nama lengkap pemohon</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          id="visitor-name"
                          placeholder="Masukkan nama lengkap Anda"
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* 3. Password Akses (Hidden placeholder and label, internal requirement is 0123456) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>3. Pasword Akses</span>
                        <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showVisitorPassword ? 'text' : 'password'}
                          required
                          id="visitor-password"
                          placeholder="Masukkan password akses"
                          value={visitorPassword}
                          onChange={(e) => setVisitorPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowVisitorPassword(!showVisitorPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showVisitorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-white/5 rounded-xl p-2.5 text-[11px] text-slate-400 leading-relaxed flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Setelah verifikasi password, akses ke dashboard memerlukan persetujuan (ACC) Owner.</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    id="btn-submit-visitor-access"
                    disabled={isSubmitting || !visitorEmail.trim() || !visitorName.trim() || !visitorPassword.trim()}
                    className="w-full py-3 px-4 rounded-xl text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Memproses Verifikasi...' : 'Masuk / Ajukan Akses'}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: CONFIDENTIAL OWNER LOGIN (NO OWNER EMAIL PRE-FILLED, NO PASSWORDS SHOWN) */}
              {activeTab === 'OWNER' && (
                <form onSubmit={handleOwnerLogin} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Alamat Email Owner
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          id="owner-email"
                          placeholder="Masukkan email terdaftar Owner"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Kata Sandi Rahasia Owner
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showOwnerPassword ? 'text' : 'password'}
                          required
                          id="owner-password"
                          placeholder="••••••••••••"
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Area otentikasi khusus Super Admin. Kredensial terlindungi secara enkripsi dan tidak dibagikan ke publik.
                    </span>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-owner-login"
                    disabled={isSubmitting || !ownerEmail.trim() || !ownerPassword.trim()}
                    className="w-full py-3 px-4 rounded-xl text-sm font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk sebagai Owner'}</span>
                  </button>
                </form>
              )}

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
