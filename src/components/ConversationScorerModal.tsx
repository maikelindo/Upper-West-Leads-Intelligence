import React, { useState } from 'react';
import { Lead, LeadBehaviors, LeadCategory, FollowUpResolveStatus } from '../types';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MessageSquare, 
  UserCheck, 
  Send, 
  CheckSquare, 
  Square, 
  FileText, 
  Flame, 
  TrendingUp, 
  Tag, 
  Bot, 
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy
} from 'lucide-react';
import { 
  calculateBehaviorScore, 
  BEHAVIOR_POINT_CONFIG, 
  getCategoryMeta, 
  calculateLeadScore,
  extractBehaviorsFromLead
} from '../services/leadScoring';
import confetti from 'canvas-confetti';

interface ConversationScorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  selectedLeadForScoring?: Lead | null;
  onApplyScoreToLead: (leadId: string, updatedData: Partial<Lead>) => void;
}

export const ConversationScorerModal: React.FC<ConversationScorerModalProps> = ({
  isOpen,
  onClose,
  leads,
  selectedLeadForScoring,
  onApplyScoreToLead,
}) => {
  if (!isOpen) return null;

  const [activeLeadId, setActiveLeadId] = useState<string>(
    selectedLeadForScoring?.id || leads[0]?.id || ''
  );
  
  const currentLead = leads.find((l) => l.id === activeLeadId) || leads[0];

  const [chatTranscript, setChatTranscript] = useState<string>(
    currentLead?.remarksFu1 || currentLead?.historyRemarks || ''
  );
  const [leadCategory, setLeadCategory] = useState<LeadCategory>(
    currentLead?.category || 'COLD'
  );
  const [resolveStatus, setResolveStatus] = useState<FollowUpResolveStatus>(
    currentLead?.resolveStatus || 'FIRST_CONTACT'
  );
  
  const [behaviors, setBehaviors] = useState<LeadBehaviors>(
    currentLead?.behaviors || (currentLead ? extractBehaviorsFromLead(currentLead) : {
      tanyaHarga: false,
      tanyaPromo: false,
      tanyaLokasi: false,
      scheduleVisit: false,
      datangMGorSite: false,
      repeatVisit: false,
      closing: false,
    })
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    quality: 'BAGUS' | 'POTENSIAL' | 'TIDAK_BAGUS';
    qualityTitle: string;
    summary: string;
    detectedKeywords: string[];
    sentiment: 'POSITIF' | 'NETRAL' | 'NEGATIF';
    salesRecommendation: string;
    readinessScore: number;
  } | null>(null);

  // When changing selected lead from dropdown
  const handleSelectLeadChange = (leadId: string) => {
    setActiveLeadId(leadId);
    const targetLead = leads.find((l) => l.id === leadId);
    if (targetLead) {
      setChatTranscript(targetLead.remarksFu1 || targetLead.historyRemarks || '');
      setLeadCategory(targetLead.category || 'COLD');
      setResolveStatus(targetLead.resolveStatus || 'FIRST_CONTACT');
      const targetBehaviors = targetLead.behaviors || extractBehaviorsFromLead(targetLead);
      setBehaviors(targetBehaviors);
      setAnalysisResult(null);
    }
  };

  // Toggle behavior
  const handleToggleBehavior = (key: keyof LeadBehaviors) => {
    const updated = { ...behaviors, [key]: !behaviors[key] };
    setBehaviors(updated);
  };

  // Run AI evaluation on the conversation transcript
  const handleAnalyzeConversation = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const lower = (chatTranscript || '').toLowerCase();
      
      const newBehaviors: LeadBehaviors = { ...behaviors };
      const detectedKeywords: string[] = [];

      // Keyword rules matching property sales
      if (lower.includes('harga') || lower.includes('budget') || lower.includes('miliar') || lower.includes('jt') || lower.includes('biaya') || lower.includes('dp')) {
        newBehaviors.tanyaHarga = true;
        detectedKeywords.push('Tanya Harga / Budget');
      }
      if (lower.includes('promo') || lower.includes('diskon') || lower.includes('subsidi') || lower.includes('cashback') || lower.includes('dp 0')) {
        newBehaviors.tanyaPromo = true;
        detectedKeywords.push('Tanya Promo / Penawaran');
      }
      if (lower.includes('lokasi') || lower.includes('bsd') || lower.includes('tower') || lower.includes('akses') || lower.includes('posisi')) {
        newBehaviors.tanyaLokasi = true;
        detectedKeywords.push('Tanya Lokasi & Akses');
      }
      if (lower.includes('visit') || lower.includes('lihat unit') || lower.includes('show unit') || lower.includes('survey') || lower.includes('sabtu') || lower.includes('minggu') || lower.includes('jadwal') || lower.includes('janji')) {
        newBehaviors.scheduleVisit = true;
        detectedKeywords.push('Schedule Survey / Visit');
      }
      if (lower.includes('datang') || lower.includes('hadir') || lower.includes('sudah ke site') || lower.includes('marketing gallery')) {
        newBehaviors.datangMGorSite = true;
        detectedKeywords.push('Site Visit / MG');
      }
      if (lower.includes('booking') || lower.includes('closing') || lower.includes('akad') || lower.includes('utj') || lower.includes('tanda jadi')) {
        newBehaviors.closing = true;
        detectedKeywords.push('Booking / Closing');
      }

      setBehaviors(newBehaviors);

      // Determine Quality: Bagus vs Tidak Bagus
      const isJunkText = lower.includes('junk') || lower.includes('pinjol') || lower.includes('sewa') || lower.includes('strangers') || lower.includes('jualan') || lower.includes('kerja') || lower.includes('salah sambung') || lower.includes('over buget') || lower.includes('cancel') || lower.includes('tidak berminat');
      const isHotText = lower.includes('visit') || lower.includes('booking') || lower.includes('survey') || lower.includes('closing') || newBehaviors.closing || newBehaviors.datangMGorSite || newBehaviors.scheduleVisit;
      
      const behaviorScore = calculateBehaviorScore(newBehaviors).totalScore;

      let quality: 'BAGUS' | 'POTENSIAL' | 'TIDAK_BAGUS' = 'POTENSIAL';
      let qualityTitle = 'Prospek Potensial (Warm)';
      let summary = 'Prospek merespon positif dan menanyakan informasi spesifikasi unit atau harga.';
      let sentiment: 'POSITIF' | 'NETRAL' | 'NEGATIF' = 'NETRAL';
      let recommendation = 'Kirimkan e-brochure lengkap dan tawarkan janji temu visit show unit pada akhir pekan.';
      let updatedCat: LeadCategory = 'WARM';

      if (isJunkText || resolveStatus === 'Cari Sewa' || resolveStatus === 'Strangers' || resolveStatus === 'Jualan Product' || resolveStatus === 'Cari Kerja') {
        quality = 'TIDAK_BAGUS';
        qualityTitle = 'Leads Tidak Bagus (Junk / Cold / Not Interested)';
        summary = 'Percakapan menunjukkan leads tidak memiliki intensi beli properti (mencari sewa, tawaran jualan, salah sambung, atau over budget).';
        sentiment = 'NEGATIF';
        recommendation = 'Arsipkan lead sebagai JUNK / COLD untuk menghemat waktu follow up sales agent.';
        updatedCat = 'JUNK';
      } else if (isHotText || behaviorScore >= 40) {
        quality = 'BAGUS';
        qualityTitle = 'Leads Bagus & Sangat Prospektif (Hot / Visited)';
        summary = 'Prospek memiliki minat beli tinggi, menanyakan harga detail dan menjadwalkan atau telah melakukan visit show unit.';
        sentiment = 'POSITIF';
        recommendation = 'Segera kunci jadwal show unit dengan Senior Property Advisor, siapkan simulasi KPR atau DP bertahap!';
        updatedCat = newBehaviors.closing ? 'VISITED' : 'PROSPECT';
      } else {
        quality = 'POTENSIAL';
        qualityTitle = 'Leads Bagus (Tahap Awal / Warm)';
        summary = 'Prospek memberikan respon awal yang baik. Perlu digali lebih dalam mengenai preferensi unit dan anggaran.';
        sentiment = 'POSITIF';
        recommendation = 'Follow up dengan video unit virtual tour dan update promo diskon unit pilihan.';
        updatedCat = 'WARM';
      }

      setLeadCategory(updatedCat);
      setAnalysisResult({
        quality,
        qualityTitle,
        summary,
        detectedKeywords,
        sentiment,
        salesRecommendation: recommendation,
        readinessScore: Math.min(100, Math.max(10, behaviorScore + 25)),
      });

      setIsAnalyzing(false);
    }, 600);
  };

  const behaviorScoreResult = calculateBehaviorScore(behaviors);

  // Apply to Lead
  const handleApplyToLead = () => {
    if (!currentLead) return;

    const updatedLeadCandidate = {
      ...currentLead,
      behaviors,
      remarksFu1: chatTranscript,
      historyRemarks: chatTranscript,
      category: leadCategory,
      resolveStatus: resolveStatus,
    };

    const newScoreBreakdown = calculateLeadScore(updatedLeadCandidate);

    onApplyScoreToLead(currentLead.id, {
      behaviors,
      behaviorScore: behaviorScoreResult.totalScore,
      score: newScoreBreakdown.totalScore,
      scoreBreakdown: newScoreBreakdown,
      category: leadCategory,
      quality: newScoreBreakdown.qualityTier,
      remarksFu1: chatTranscript,
      historyRemarks: chatTranscript,
      resolveStatus: resolveStatus,
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
  };

  const categoryMeta = getCategoryMeta(leadCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Evaluasi & Scoring Percakapan AI</span>
                <span className="text-[10px] bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
                  Lead Quality Scorer
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Analisis transkrip chat / remarks follow-up untuk menilai apakah prospek berkualitas <strong>Bagus</strong> atau <strong>Tidak Bagus (Junk)</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800">
          
          {/* Target Lead Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Pilih Prospek Excel:</span>
              <select
                value={activeLeadId}
                onChange={(e) => handleSelectLeadChange(e.target.value)}
                className="w-full sm:max-w-md text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    #{l.leadNumber || '1'} - {l.name} ({l.phone}) - [{l.category || 'COLD'}] - {l.resolveStatus}
                  </option>
                ))}
              </select>
            </div>

            {currentLead && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">Assigned: {currentLead.assignedToName}</span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}>
                  {leadCategory}
                </span>
              </div>
            )}
          </div>

          {/* Transcript / Remarks Input Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Transkrip Chat WhatsApp / Catatan Follow Up (Remarks FU 1)</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Bisa diedit atau ditempel dari riwayat chat customer
              </span>
            </div>

            <textarea
              rows={3}
              value={chatTranscript}
              onChange={(e) => setChatTranscript(e.target.value)}
              placeholder="Contoh: Customer tanya harga unit 2BR Loft, minta promo DP 0%, dan berencana visit show unit hari Sabtu jam 2 siang..."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Resolve Status:</span>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as FollowUpResolveStatus)}
                  className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-md px-2 py-1"
                >
                  <option value="First Contact">First Contact</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Cari Sewa">Cari Sewa (Junk)</option>
                  <option value="Strangers">Strangers (Junk)</option>
                  <option value="Jualan Product">Jualan Product (Junk)</option>
                  <option value="Over buget">Over buget (Junk)</option>
                  <option value="Cari Kerja">Cari Kerja (Junk)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeConversation}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Evaluasi & Hitung Skor Percakapan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Analysis Result Card (If Analyzed) */}
          {analysisResult && (
            <div className={`p-4 rounded-xl border transition-all ${
              analysisResult.quality === 'BAGUS'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : analysisResult.quality === 'TIDAK_BAGUS'
                ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-black/10">
                <div className="flex items-center gap-2">
                  {analysisResult.quality === 'BAGUS' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : analysisResult.quality === 'TIDAK_BAGUS' ? (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide">
                      {analysisResult.qualityTitle}
                    </h4>
                    <p className="text-xs opacity-90">{analysisResult.summary}</p>
                  </div>
                </div>

                <div className="text-right whitespace-nowrap bg-white/70 px-3 py-1.5 rounded-lg border border-black/10">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Skor Kesiapan Beli</div>
                  <div className="text-base font-black font-mono">
                    {analysisResult.readinessScore}/100 Poin
                  </div>
                </div>
              </div>

              {/* Detected signals & recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                <div>
                  <span className="font-bold block mb-1">Sinyal Percakapan Terdeteksi:</span>
                  {analysisResult.detectedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.detectedKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white font-bold rounded-md border border-black/10 text-[10px]">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] opacity-75 italic">Tidak ada kata kunci spesifik terdeteksi</span>
                  )}
                </div>

                <div>
                  <span className="font-bold block mb-1">Rekomendasi Tindakan Sales:</span>
                  <p className="text-[11px] leading-relaxed bg-white/80 p-2 rounded-md border border-black/10">
                    {analysisResult.salesRecommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Behavior Checklist Matrix (170 Points) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Variabel Behavior Percakapan (Total 170 Poin)</span>
              </h4>
              <div className="font-mono text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                Total: {behaviorScoreResult.totalScore} / 170 Poin
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
              <div className="p-2 divide-y divide-slate-100">
                {BEHAVIOR_POINT_CONFIG.slice(0, 4).map((item) => {
                  const isActive = !!behaviors[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggleBehavior(item.key)}
                      className={`p-2.5 flex items-center justify-between gap-2 rounded-lg cursor-pointer transition-colors ${
                        isActive ? 'bg-amber-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={`text-xs font-bold ${isActive ? 'text-slate-950' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                        isActive ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        +{item.points}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-2 divide-y divide-slate-100">
                {BEHAVIOR_POINT_CONFIG.slice(4).map((item) => {
                  const isActive = !!behaviors[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggleBehavior(item.key)}
                      className={`p-2.5 flex items-center justify-between gap-2 rounded-lg cursor-pointer transition-colors ${
                        isActive ? 'bg-amber-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={`text-xs font-bold ${isActive ? 'text-slate-950' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                        isActive ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        +{item.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Hasil evaluasi akan mengupdate skor, behavior point, dan status tier prospek <strong>{currentLead?.name}</strong>.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleApplyToLead}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Simpan Hasil Scoring ke Data Prospek</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
