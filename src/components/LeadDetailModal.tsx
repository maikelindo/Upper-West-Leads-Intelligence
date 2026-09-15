import React, { useState } from 'react';
import { 
  Lead, 
  SalesAgent, 
  PipelineStage, 
  OmnichannelSource, 
  LeadCategory,
  FollowUpResolveStatus,
  SopComplianceStatus,
  LeadBehaviors
} from '../types';
import { 
  X, 
  Flame, 
  TrendingUp, 
  Clock, 
  Building, 
  MessageCircle, 
  Instagram, 
  Globe, 
  Phone, 
  Mail, 
  Sparkles, 
  Send, 
  CalendarCheck, 
  FileText, 
  CheckCircle2, 
  Bot, 
  User, 
  ShieldCheck, 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  AlertTriangle,
  Paperclip,
  Share2,
  FileSpreadsheet,
  Tag,
  Hash,
  Compass,
  CheckCheck,
  Edit3,
  Save,
  CheckSquare,
  Square,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { 
  formatRupiah, 
  getCategoryMeta, 
  getResolveStatusMeta, 
  getSopStatusMeta,
  evaluateSopCompliance,
  calculateLeadScore,
  calculateBehaviorScore,
  BEHAVIOR_POINT_CONFIG,
  extractBehaviorsFromLead,
  analyzeRemarks 
} from '../services/leadScoring';
import confetti from 'canvas-confetti';

interface LeadDetailModalProps {
  lead: Lead | null;
  salesAgents: SalesAgent[];
  onClose: () => void;
  onUpdateStage: (leadId: string, nextStage: PipelineStage) => void;
  onReassignAgent: (leadId: string, agentId: string) => void;
  onSendMessage: (leadId: string, text: string, channel: OmnichannelSource) => void;
  onAddNote: (leadId: string, note: string) => void;
  onUpdateAIEvaluation?: (leadId: string, evaluation: any) => void;
  onUpdateLeadPerformance?: (leadId: string, updatedFields: Partial<Lead>) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  salesAgents,
  onClose,
  onUpdateStage,
  onReassignAgent,
  onSendMessage,
  onAddNote,
  onUpdateAIEvaluation,
  onUpdateLeadPerformance,
}) => {
  if (!lead) return null;

  const [activeTab, setActiveTab] = useState<'variables' | 'behavior' | 'chat' | 'scoring' | 'timeline'>('variables');
  const [outgoingText, setOutgoingText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<OmnichannelSource>(lead.primaryChannel || 'WHATSAPP');
  const [noteText, setNoteText] = useState('');
  const [isGeneratingAIDraft, setIsGeneratingAIDraft] = useState(false);

  // Editable 12 variables local state
  const [isEditing, setIsEditing] = useState(false);
  const [editableResolveStatus, setEditableResolveStatus] = useState<FollowUpResolveStatus>(lead.resolveStatus || 'FIRST_CONTACT');
  const [editableRemarksFu1, setEditableRemarksFu1] = useState(lead.remarksFu1 || lead.historyRemarks || '');
  const [editableAdSource, setEditableAdSource] = useState(lead.adSource || 'Instagram Ads - Promo SOHO Smart Loft BSD');
  const [editableAnsweredAt, setEditableAnsweredAt] = useState(lead.answeredAt || '');
  const [editableFirstResponseMinutes, setEditableFirstResponseMinutes] = useState<number | undefined>(lead.firstResponseTimeMinutes);
  const [editableDateContact, setEditableDateContact] = useState(lead.dateContact || lead.createdAt.slice(0, 16).replace('T', ' '));
  const [editablePhone, setEditablePhone] = useState(lead.phone || '');
  const [editableSopStatus, setEditableSopStatus] = useState<SopComplianceStatus>(lead.sopStatus || 'SOP_MET');

  // Behavior local state (170 Points)
  const initialBehaviors = lead.behaviors || extractBehaviorsFromLead(lead);
  const [behaviors, setBehaviors] = useState<LeadBehaviors>(initialBehaviors);

  const behaviorScoreResult = calculateBehaviorScore(behaviors);
  const assignedAgent = salesAgents.find((a) => a.id === lead.assignedAgentId);
  const categoryMeta = getCategoryMeta(lead.category || 'COLD');
  const resolveMeta = getResolveStatusMeta(lead.resolveStatus);
  const sopMeta = getSopStatusMeta(editableSopStatus || lead.sopStatus);

  // Toggle single behavior flag
  const handleToggleBehavior = (key: keyof LeadBehaviors) => {
    const updatedBehaviors = {
      ...behaviors,
      [key]: !behaviors[key],
    };
    setBehaviors(updatedBehaviors);

    const newScoreResult = calculateBehaviorScore(updatedBehaviors);
    const updatedLeadCandidate = {
      ...lead,
      behaviors: updatedBehaviors,
      remarksFu1: editableRemarksFu1,
    };
    const newBreakdown = calculateLeadScore(updatedLeadCandidate);

    if (onUpdateLeadPerformance) {
      onUpdateLeadPerformance(lead.id, {
        behaviors: updatedBehaviors,
        behaviorScore: newScoreResult.totalScore,
        score: newBreakdown.totalScore,
        scoreBreakdown: newBreakdown,
        category: newBreakdown.leadCategory,
        quality: newBreakdown.qualityTier,
      });
    }

    if (key === 'closing' && !behaviors.closing) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  // Toggle SOP Compliance status between Met (✓) and Breached (✗)
  const handleToggleSopStatus = () => {
    const nextStatus: SopComplianceStatus = 
      editableSopStatus === 'SOP_MET' ? 'SOP_BREACHED' : 'SOP_MET';
    
    setEditableSopStatus(nextStatus);
    const notes = nextStatus === 'SOP_MET' 
      ? 'SOP Sesuai: Respon cepat (< 15 menit SLA)' 
      : 'SOP Tidak Sesuai: Melebihi batas SLA (> 30 menit)';

    if (onUpdateLeadPerformance) {
      onUpdateLeadPerformance(lead.id, {
        sopStatus: nextStatus,
        sopNotes: notes,
      });
    }
  };

  // Save changes to the 12 performance fields
  const handleSavePerformanceVariables = () => {
    const sopEval = evaluateSopCompliance(editableFirstResponseMinutes, editableAnsweredAt, editableRemarksFu1);
    const updatedLeadCandidate = {
      ...lead,
      resolveStatus: editableResolveStatus,
      remarksFu1: editableRemarksFu1,
      historyRemarks: editableRemarksFu1,
      adSource: editableAdSource,
      answeredAt: editableAnsweredAt,
      firstResponseTimeMinutes: editableFirstResponseMinutes,
      firstResponseTimeFormatted: editableFirstResponseMinutes !== undefined ? `${editableFirstResponseMinutes} menit` : 'Belum Dijawab',
      agentFirstReplyTime: editableAnsweredAt ? editableAnsweredAt.slice(-5) + ' WIB' : '-',
      dateContact: editableDateContact,
      phone: editablePhone,
      sopStatus: editableSopStatus || sopEval.sopStatus,
      sopNotes: sopEval.notes,
      behaviors,
    };

    const newBreakdown = calculateLeadScore(updatedLeadCandidate);

    const updatedLeadFields: Partial<Lead> = {
      ...updatedLeadCandidate,
      score: newBreakdown.totalScore,
      behaviorScore: behaviorScoreResult.totalScore,
      scoreBreakdown: newBreakdown,
      category: newBreakdown.leadCategory,
      quality: newBreakdown.qualityTier,
    };

    if (onUpdateLeadPerformance) {
      onUpdateLeadPerformance(lead.id, updatedLeadFields);
    }
    setIsEditing(false);
  };

  const handleStageChange = (newStage: PipelineStage) => {
    onUpdateStage(lead.id, newStage);
    if (newStage === 'BOOKING_CLOSING') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Generate AI Pitch Draft
  const handleGenerateAIDraft = async () => {
    setIsGeneratingAIDraft(true);
    try {
      const response = await fetch('/api/gemini/draft-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          userIntent: `Follow-up ketertarikan unit ${lead.preferredUnit} dan tawarkan private visit show unit akhir pekan`,
          tone: 'friendly_professional',
        }),
      });
      const data = await response.json();
      if (data.draft) {
        setOutgoingText(data.draft);
      }
    } catch (err) {
      console.warn('Backend draft API unavailable, using offline template:', err);
      setOutgoingText(`Halo Bapak/Ibu ${lead.name}, terima kasih telah menghubungi Upper West BSD. Menindaklanjuti ketertarikan Anda pada unit ${lead.preferredUnit || 'Upper West'}, kami memiliki promo diskon khusus dan opsi cicilan ${lead.preferredPayment || 'In-House'}. Apakah akhir pekan ini ada waktu luang untuk kami jadwalkan private tour di Marketing Gallery BSD? Terima kasih!`);
    } finally {
      setIsGeneratingAIDraft(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingText.trim()) return;
    onSendMessage(lead.id, outgoingText, selectedChannel);
    setOutgoingText('');
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(lead.id, noteText);
    setNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-400 font-mono text-sm">
              #{lead.leadNumber || '1'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{lead.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}>
                  {lead.category || 'COLD'}
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  Behavior AI: {behaviorScoreResult.totalScore} / 170 Poin
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5 flex items-center gap-2">
                <span>{lead.phone}</span>
                <span>•</span>
                <span>{lead.preferredUnit}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{formatRupiah(lead.budgetEstimated || 0)}</span>
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

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('variables')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'variables'
                  ? 'border-amber-500 text-amber-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>12 Variabel Penilaian</span>
            </button>

            <button
              onClick={() => setActiveTab('behavior')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'behavior'
                  ? 'border-amber-500 text-amber-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Skor AI Behavior ({behaviorScoreResult.totalScore}/170)</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'border-amber-500 text-amber-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Percakapan ({lead.messages?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('scoring')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'scoring'
                  ? 'border-amber-500 text-amber-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Breakdown Skor ({lead.score}/100)</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'timeline'
                  ? 'border-amber-500 text-amber-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Riwayat Aktivitas ({lead.activities?.length || 0})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            <span className="text-[11px] font-bold text-slate-500">Tahap Pipeline:</span>
            <select
              value={lead.stage}
              onChange={(e) => handleStageChange(e.target.value as PipelineStage)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="NEW">New Lead</option>
              <option value="CONTACTED">Contacted</option>
              <option value="SITE_VISIT_SCHEDULED">Site Visit Scheduled</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="BOOKING_CLOSING">Booking / Closed SPK</option>
              <option value="LOST">Disqualified / Lost</option>
            </select>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
          
          {/* TAB 1: 12 VARIABLES PERFORMANCE EVALUATION */}
          {activeTab === 'variables' && (
            <div className="space-y-5">
              
              {/* Header Action to Toggle Edit Mode */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    Penilaian 12 Variabel Evaluasi Performa Leads
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lengkap dengan opsi Resolve/Follow Up, durasi respon, source campaign Instagram, dan klik SOP checklist.
                  </p>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSavePerformanceVariables}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Variabel</span>
                  </button>
                )}
              </div>

              {/* 12-Variable Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                
                {/* 1. No. */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    1. No. Prospek
                  </div>
                  <div className="text-base font-mono font-black text-slate-900">
                    #{lead.leadNumber || '1'}
                  </div>
                  <p className="text-[10px] text-slate-500">Nomor urut leads dalam antrian CRM</p>
                </div>

                {/* 2. Date contact */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <CalendarCheck className="w-3 h-3 text-slate-400" />
                    2. Date Contact
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableDateContact}
                      onChange={(e) => setEditableDateContact(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded p-1"
                    />
                  ) : (
                    <div className="text-xs font-mono font-bold text-slate-900">
                      {lead.dateContact || lead.createdAt.slice(0, 16).replace('T', ' ')}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">Waktu pertama kali lead masuk ke sistem</p>
                </div>

                {/* 3. No Telfon */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    3. No Telfon
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editablePhone}
                      onChange={(e) => setEditablePhone(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded p-1"
                    />
                  ) : (
                    <div className="text-xs font-mono font-bold text-slate-900 flex items-center justify-between">
                      <span>{lead.phone}</span>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 text-[10px] font-bold underline"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">Nomor kontak WhatsApp aktif customer</p>
                </div>

                {/* 4. Resolve / Follow Up */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                    4. Resolve / Follow Up
                  </div>
                  {isEditing ? (
                    <select
                      value={editableResolveStatus}
                      onChange={(e) => setEditableResolveStatus(e.target.value as FollowUpResolveStatus)}
                      className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                    >
                      <option value="FIRST_CONTACT">First Contact (Kontak Pertama)</option>
                      <option value="FOLLOW_UP_CONTACT">Follow Up Contact (Kontak Lanjutan)</option>
                      <option value="RESOLVED">Resolved / Solved (Selesai)</option>
                      <option value="NEED_FOLLOW_UP">Need Follow Up (Perlu Tindak Lanjut)</option>
                      <option value="IN_PROGRESS">In Progress (Sedang Berjalan)</option>
                      <option value="PENDING">Pending Response (Menunggu)</option>
                      <option value="ESCALATED">Escalated to SPV (Eskalasi)</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${resolveMeta.badgeBg} ${resolveMeta.badgeBorder} ${resolveMeta.badgeText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${resolveMeta.dotColor}`}></span>
                        <span>{resolveMeta.label}</span>
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">Opsi utama: First Contact / Follow Up Contact</p>
                </div>

                {/* 5. Status Leads */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-slate-400" />
                    5. Status Leads & Behavior Score
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${categoryMeta.dotColor}`}></span>
                      <span>{lead.category || 'COLD'}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      {behaviorScoreResult.totalScore} / 170 Poin
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">{categoryMeta.description}</p>
                </div>

                {/* 6. assigned_to */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    6. Assigned To (Nama Sales)
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={lead.assignedAgentId}
                      onChange={(e) => onReassignAgent(lead.id, e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 rounded p-1 w-full text-slate-800"
                    >
                      {salesAgents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500">Nama sales in-house penanggung jawab</p>
                </div>

                {/* 7. answered_at */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    7. Answered At
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableAnsweredAt}
                      placeholder="e.g. 2026-08-16 09:19"
                      onChange={(e) => setEditableAnsweredAt(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded p-1"
                    />
                  ) : (
                    <div className="text-xs font-mono font-bold text-slate-900">
                      {lead.answeredAt ? `${lead.answeredAt} (Durasi: ${lead.firstResponseTimeFormatted || '4 mnt'})` : 'Belum Dijawab'}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">Waktu sales respon beserta durasi respon</p>
                </div>

                {/* 8. first_response_time */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-slate-400" />
                    8. First Response Time
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editableFirstResponseMinutes ?? ''}
                        placeholder="Menit"
                        onChange={(e) => setEditableFirstResponseMinutes(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="w-24 text-xs font-mono bg-white border border-slate-200 rounded p-1"
                      />
                      <span className="text-xs text-slate-500">menit</span>
                    </div>
                  ) : (
                    <div className={`text-xs font-mono font-bold ${
                      (lead.firstResponseTimeMinutes ?? 99) <= 15
                        ? 'text-emerald-700'
                        : (lead.firstResponseTimeMinutes ?? 99) <= 30
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}>
                      {lead.firstResponseTimeFormatted || (lead.firstResponseTimeMinutes ? `${lead.firstResponseTimeMinutes} menit` : 'Belum Dijawab')}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">Durasi respon awal sejak pesan prospek masuk</p>
                </div>

                {/* 9. agent_first_reply_time */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    9. Agent First Reply Time
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {lead.agentFirstReplyTime || '-'}
                  </div>
                  <p className="text-[10px] text-slate-500">Jam pesan balasan pertama terkirim ke customer</p>
                </div>

                {/* 10. Source Iklan by */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 md:col-span-2 lg:col-span-1">
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-slate-400" />
                    10. Source Iklan By
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableAdSource}
                      placeholder="e.g. Instagram Ads - Promo SOHO BSD"
                      onChange={(e) => setEditableAdSource(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded p-1"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        (lead.adSource || '').startsWith('Instagram')
                          ? 'bg-pink-50 text-pink-900 border-pink-200'
                          : (lead.adSource || '').startsWith('Google')
                          ? 'bg-blue-50 text-blue-900 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {lead.adSource || lead.primaryChannel}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">Source platform & nama campaign / content iklan</p>
                </div>

                {/* 12. SOP Status (Clickable Option Ceklis / Silang Merah) */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 md:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-400" />
                      12. SOP (Klik Ceklis / Silang Merah Sesuai)
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Klik tombol untuk ganti status:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Interactive Clickable SOP Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleSopStatus}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        (editableSopStatus || lead.sopStatus) === 'SOP_MET'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                      }`}
                      title="Klik untuk ubah status SOP"
                    >
                      {(editableSopStatus || lead.sopStatus) === 'SOP_MET' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>✓ Sesuai SOP (&lt; 15 Mnt)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-700" />
                          <span>✗ Tidak Sesuai SOP (&gt; 30 Mnt)</span>
                        </>
                      )}
                    </button>

                    <span className="text-xs text-slate-600 font-medium truncate">
                      {lead.sopNotes || ((editableSopStatus || lead.sopStatus) === 'SOP_MET' ? 'Respon cepat sesuai SOP' : 'Terlambat merespon')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Standar SOP: Target &lt; 15 menit. Klik tombol di atas untuk mengubah status kepatuhan.</p>
                </div>

              </div>

              {/* 11. Remaks FU 1 (Wide Box with NLP Scoring Details) */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold uppercase text-amber-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    11. Remarks Follow up (Catatan FU 1 & Hasil Kontak)
                  </div>
                  {lead.remarksAnalysis?.detectedSignals && lead.remarksAnalysis.detectedSignals.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {lead.remarksAnalysis.detectedSignals.map((sig, i) => (
                        <span key={i} className="text-[10px] bg-white border border-amber-300 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                          {sig}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    rows={3}
                    value={editableRemarksFu1}
                    onChange={(e) => setEditableRemarksFu1(e.target.value)}
                    placeholder="Tuliskan catatan hasil follow up pertama (FU 1)..."
                    className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-slate-800 leading-relaxed font-medium">
                    {lead.remarksFu1 || lead.historyRemarks || 'Belum ada catatan follow-up FU 1 yang dimasukkan.'}
                  </div>
                )}

                <p className="text-[11px] text-amber-900/80">
                  {lead.remarksAnalysis?.explanation || 'AI mendeteksi sinyal minat unit, skema bayar, atau booking dari catatan ini.'}
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: AI BEHAVIOR SCORING (170 POINTS MATRIX) */}
          {activeTab === 'behavior' && (
            <div className="space-y-5">
              
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                      Penilaian AI Berdasarkan Behavior
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">
                      Kalkulasi Poin Behavior Prospek
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xl mt-0.5">
                      Poin dihitung secara otomatis dan dapat dicentang langsung oleh tim sales untuk mengukur kesiapan beli prospek hingga tahap Closing.
                    </p>
                  </div>

                  <div className="text-right bg-slate-950/60 p-3.5 rounded-xl border border-slate-700 flex flex-col items-end min-w-[170px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Poin Behavior</span>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {behaviorScoreResult.totalScore} <span className="text-xs text-slate-400 font-normal">/ 170 Poin</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-amber-400 h-full transition-all duration-300"
                        style={{ width: `${behaviorScoreResult.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavior Checklist Table as Requested by User */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Tabel 7 Variabel Poin Behavior (Total 170 Poin)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Klik ceklis untuk mengaktifkan / menonaktifkan behavior
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {BEHAVIOR_POINT_CONFIG.map((item) => {
                    const isActive = !!behaviors[item.key];

                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggleBehavior(item.key)}
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isActive ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`p-1 rounded-md transition-colors ${
                              isActive ? 'text-amber-700' : 'text-slate-400'
                            }`}
                          >
                            {isActive ? (
                              <CheckSquare className="w-5 h-5 text-amber-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isActive ? 'text-slate-950' : 'text-slate-700'}`}>
                                {item.label}
                              </span>
                              {isActive && (
                                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border ${
                            isActive 
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs' 
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            +{item.points} Poin
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Summary Footer */}
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between font-bold text-xs">
                  <span>Total Poin Terkumpul:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-amber-400">
                      {behaviorScoreResult.totalScore} / 170 Poin ({behaviorScoreResult.percentage}%)
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CHAT & CONVERSATION */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Chat Thread */}
              <div className="md:col-span-2 flex flex-col h-[400px] border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-900 text-white text-xs font-bold flex items-center justify-between">
                  <span>Percakapan WhatsApp Omnichannel</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {lead.goAppConversationId || 'conv-01'}</span>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50 text-xs">
                  {lead.messages && lead.messages.length > 0 ? (
                    lead.messages.map((m, i) => (
                      <div
                        key={m.id || i}
                        className={`flex ${m.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl p-3 shadow-2xs ${
                            m.sender === 'CUSTOMER'
                              ? 'bg-white border border-slate-200 text-slate-800'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[10px]">
                              {m.senderName || (m.sender === 'CUSTOMER' ? lead.name : 'Sales Agent')}
                            </span>
                            <span className="text-[9px] opacity-70">
                              {m.timestamp?.slice(11, 16)}
                            </span>
                          </div>
                          <p className="leading-snug">{m.message || (m as any).text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Belum ada percakapan terekam. Kirim pesan pertama di bawah ini.
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendChat} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    placeholder="Tulis balasan pesan WhatsApp..."
                    value={outgoingText}
                    onChange={(e) => setOutgoingText(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAIDraft}
                    disabled={isGeneratingAIDraft}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Draft Otomatis AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>AI Draft</span>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Internal Notes Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Catatan Internal Sales
                </h4>

                <form onSubmit={handleAddInternalNote} className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Tambahkan catatan internal..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    + Simpan Catatan
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {lead.notes?.map((note, i) => (
                    <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SCORING BREAKDOWN */}
          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Total Skor Leads: {lead.score} / 100 (Behavior: {behaviorScoreResult.totalScore}/170)</h4>
                  <p className="text-xs text-slate-500">
                    Kategori: <strong className="text-slate-900">{lead.category}</strong> • Prioritas Tindakan: <span className="text-amber-900 font-semibold">{categoryMeta.recommendedAction}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}>
                    {categoryMeta.scoreRange}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>1. Digital Engagement</span>
                    <span className="font-mono text-amber-700">{lead.scoreBreakdown?.digitalEngagement?.score || 0} / 30 pts</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                    {lead.scoreBreakdown?.digitalEngagement?.details?.map((d, i) => (
                      <li key={i}>{d}</li>
                    )) || <li>Aktivitas digital awal</li>}
                  </ul>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>2. Omnichannel Velocity</span>
                    <span className="font-mono text-amber-700">{lead.scoreBreakdown?.omnichannelVelocity?.score || 0} / 35 pts</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                    {lead.scoreBreakdown?.omnichannelVelocity?.details?.map((d, i) => (
                      <li key={i}>{d}</li>
                    )) || <li>Kecepatan respon & interaksi WhatsApp</li>}
                  </ul>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>3. Budget & Purchasing Power</span>
                    <span className="font-mono text-amber-700">{lead.scoreBreakdown?.budgetAndFit?.score || 0} / 25 pts</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                    {lead.scoreBreakdown?.budgetAndFit?.details?.map((d, i) => (
                      <li key={i}>{d}</li>
                    )) || <li>Estimasi budget {formatRupiah(lead.budgetEstimated || 0)}</li>}
                  </ul>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>4. Recency & Freshness</span>
                    <span className="font-mono text-amber-700">{lead.scoreBreakdown?.recencyFreshness?.score || 0} / 10 pts</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                    {lead.scoreBreakdown?.recencyFreshness?.details?.map((d, i) => (
                      <li key={i}>{d}</li>
                    )) || <li>Interaksi dalam 24-72 jam terakhir</li>}
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Kronologi Aktivitas Interaksi</h4>
              <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
                {lead.activities?.map((act, i) => (
                  <div key={act.id || i} className="relative space-y-0.5">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{act.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{act.timestamp?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-600">{act.description}</p>
                  </div>
                )) || (
                  <div className="text-xs text-slate-400">Belum ada timeline aktivitas tersimpan.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Terakhir aktif: <span className="font-mono text-slate-700 font-bold">{lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleString('id-ID') : '-'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
