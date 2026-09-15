import React, { useState } from 'react';
import { 
  PropertyUnitInterest, 
  OmnichannelSource, 
  PipelineStage, 
  SalesAgent, 
  Lead,
  FollowUpResolveStatus,
  SopComplianceStatus,
  LeadBehaviors
} from '../types';
import { 
  X, 
  Plus, 
  UserPlus, 
  Building, 
  DollarSign, 
  Phone, 
  Mail, 
  MessageCircle, 
  Tag, 
  ShieldCheck, 
  CalendarCheck,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';
import { 
  calculateLeadScore, 
  evaluateSopCompliance, 
  calculateBehaviorScore, 
  BEHAVIOR_POINT_CONFIG 
} from '../services/leadScoring';

interface AddLeadModalProps {
  salesAgents: SalesAgent[];
  onClose: () => void;
  onAddLead: (newLead: Lead) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  salesAgents,
  onClose,
  onAddLead,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+62 8');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [preferredUnit, setPreferredUnit] = useState<PropertyUnitInterest>('Lifestyle SOHO (Type A - 78m²)');
  const [budgetEstimated, setBudgetEstimated] = useState<number>(3500000000);
  const [preferredPayment, setPreferredPayment] = useState<'Hard Cash' | 'In-House 36x' | 'KPA Express' | 'Balloon Payment'>('In-House 36x');
  const [assignedAgentId, setAssignedAgentId] = useState<string>(salesAgents[0]?.id || 'agent-1');
  const [stage, setStage] = useState<PipelineStage>('NEW');
  const [resolveStatus, setResolveStatus] = useState<FollowUpResolveStatus>('FIRST_CONTACT');
  const [adSource, setAdSource] = useState('Instagram Ads - Promo SOHO Smart Loft BSD');
  const [remarksFu1, setRemarksFu1] = useState('');
  const [firstResponseTimeMinutes, setFirstResponseTimeMinutes] = useState<number>(5);
  const [isSopMet, setIsSopMet] = useState<boolean>(true);

  // Behavior selection state (170 Points)
  const [behaviors, setBehaviors] = useState<LeadBehaviors>({
    tanyaHarga: true,
    tanyaPromo: false,
    tanyaLokasi: false,
    scheduleVisit: false,
    datangKeMgOrSite: false,
    secondOrThirdVisit: false,
    closing: false,
  });

  const behaviorScoreResult = calculateBehaviorScore(behaviors);

  const toggleBehavior = (key: keyof LeadBehaviors) => {
    setBehaviors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const assignedAgent = salesAgents.find((a) => a.id === assignedAgentId);
    const nowIso = new Date().toISOString();
    const dateContactStr = nowIso.slice(0, 16).replace('T', ' ');

    const sopStatus: SopComplianceStatus = isSopMet ? 'SOP_MET' : 'SOP_BREACHED';
    const sopNotes = isSopMet
      ? `SOP Sesuai: Respon dalam ${firstResponseTimeMinutes} menit`
      : `SOP Tidak Sesuai: Melebihi standar respon`;

    const draftLead: Partial<Lead> = {
      id: `lead-${Date.now()}`,
      leadNumber: Math.floor(100 + Math.random() * 900),
      dateContact: dateContactStr,
      phone: phone.trim(),
      resolveStatus,
      assignedAgentId,
      assignedToName: assignedAgent?.name || 'Budi Hartono',
      answeredAt: dateContactStr,
      firstResponseTimeMinutes,
      firstResponseTimeFormatted: `${firstResponseTimeMinutes} menit`,
      agentFirstReplyTime: dateContactStr.slice(-5) + ' WIB',
      adSource,
      remarksFu1: remarksFu1.trim() || 'Inquiry lead baru masuk melalui form.',
      sopStatus,
      sopNotes,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      occupation: occupation.trim() || 'Profesional / Wiraswasta',
      city: 'Tangerang Selatan / Jakarta',
      preferredUnit,
      budgetEstimated,
      budgetRangeText: `Rp ${(budgetEstimated / 1000000000).toFixed(1)} Miliar`,
      preferredPayment,
      primaryChannel: 'WHATSAPP',
      goAppConversationId: `goapp-${Math.floor(1000 + Math.random() * 9000)}`,
      stage,
      lastActivityAt: nowIso,
      createdAt: nowIso,
      behaviors,
      behaviorScore: behaviorScoreResult.totalScore,
      notes: remarksFu1.trim() ? [remarksFu1.trim()] : [],
      activities: [
        {
          id: `act-${Date.now()}-1`,
          type: 'WEB_VISIT',
          title: 'Registrasi Prospek Baru',
          description: `Tertarik unit ${preferredUnit} melalui ${adSource}`,
          timestamp: nowIso,
          pointsAdded: 10,
          channel: 'WHATSAPP',
        },
      ],
      messages: [],
    };

    const breakdown = calculateLeadScore(draftLead);
    const completedLead: Lead = {
      ...draftLead,
      score: breakdown.totalScore,
      behaviorScore: behaviorScoreResult.totalScore,
      scoreBreakdown: breakdown,
      quality: breakdown.qualityTier,
      category: breakdown.leadCategory,
    } as Lead;

    onAddLead(completedLead);
    onClose();
  };

  return (
    <div 
      id="add-lead-modal-overlay" 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto cursor-default"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <UserPlus className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tambah Prospek Baru (12 Variabel & AI Behavior 170 Poin)
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi data kontak, opsi first contact/follow up, campaign Instagram, dan checklist behavior
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Nama Prospek */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Prospek *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Hendra Gunawan, Sp.A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* No. Telfon */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">3. No Telfon (WhatsApp) *</label>
              <input
                type="text"
                required
                placeholder="+62 812-xxxx-xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="hendra@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Profesi */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Profesi / Pekerjaan</label>
              <input
                type="text"
                placeholder="Dokter Spesialis / Wiraswasta"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* 4. Resolve / Follow Up */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">4. Resolve / Follow Up</label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value as FollowUpResolveStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              >
                <option value="FIRST_CONTACT">First Contact (Kontak Pertama)</option>
                <option value="FOLLOW_UP_CONTACT">Follow Up Contact (Kontak Lanjutan)</option>
                <option value="RESOLVED">Resolved / Solved</option>
                <option value="NEED_FOLLOW_UP">Need Follow Up</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING">Pending Response</option>
                <option value="ESCALATED">Escalated to SPV</option>
              </select>
            </div>

            {/* 6. assigned_to */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">6. Assigned To (Nama Sales)</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              >
                {salesAgents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 8. first_response_time */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">8. First Response Time (Menit)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={firstResponseTimeMinutes}
                onChange={(e) => setFirstResponseTimeMinutes(parseInt(e.target.value, 10) || 5)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">&lt; 15 menit memenuhi target SLA SOP</p>
            </div>

            {/* 10. Source Iklan by */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">10. Source Iklan By</label>
              <input
                type="text"
                placeholder="Instagram Ads - Promo SOHO Smart Loft BSD"
                value={adSource}
                onChange={(e) => setAdSource(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Tipe Unit */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tipe Unit Diminati</label>
              <select
                value={preferredUnit}
                onChange={(e) => setPreferredUnit(e.target.value as PropertyUnitInterest)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              >
                <option value="Lifestyle SOHO (Type A - 78m²)">Lifestyle SOHO (Type A - 78m²)</option>
                <option value="SOHO Suite (Type B - 112m²)">SOHO Suite (Type B - 112m²)</option>
                <option value="1BR Modern Loft (45m²)">1BR Modern Loft (45m²)</option>
                <option value="2BR Sky Residence (88m²)">2BR Sky Residence (88m²)</option>
                <option value="Grand Penthouse (180m²)">Grand Penthouse (180m²)</option>
                <option value="Commercial Ground Floor (150m²)">Commercial Ground Floor (150m²)</option>
              </select>
            </div>

            {/* 12. SOP Status Option (Ceklis / Silang) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">12. SOP SLA Kepatuhan (Klik Opsi)</label>
              <button
                type="button"
                onClick={() => setIsSopMet(!isSopMet)}
                className={`w-full py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isSopMet 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                }`}
              >
                {isSopMet ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ Sesuai SOP (Respon &lt; 15 Mnt)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>✗ Tidak Sesuai SOP (&gt; 30 Mnt)</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Behavior Checklist Matrix (170 Points) */}
          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Checklist Behavior Prospek (Total 170 Poin)
              </label>
              <span className="font-mono font-black text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                {behaviorScoreResult.totalScore} / 170 Poin
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BEHAVIOR_POINT_CONFIG.map((item) => {
                const checked = !!behaviors[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleBehavior(item.key)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      checked 
                        ? 'bg-white border-amber-400 shadow-2xs font-bold text-slate-900'
                        : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-white'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="text-[11px] truncate">{item.label}</div>
                      <div className="text-[10px] text-amber-700 font-mono">+{item.points} pt</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 11. Remaks FU 1 */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              11. Remarks Follow up (Catatan FU 1 & Kebutuhan Prospek)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Menanyakan harga dan promo KPA DP 0%, tertarik visit marketing gallery weekend..."
              value={remarksFu1}
              onChange={(e) => setRemarksFu1(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Sistem akan otomatis mengevaluasi kata kunci minat unit, jadwal visit, dan budget untuk menetapkan Status Leads.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg transition-all shadow-xs cursor-pointer active:scale-98"
            >
              + Simpan & Nilai Prospek
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
