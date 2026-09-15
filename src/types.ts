export type LeadQuality = 'HOT' | 'WARM' | 'COLD';

export type LeadCategory = 
  | 'VISITED'   // Skor 85-100: Sudah survei fisik/show unit, booking fee, atau siap SPK
  | 'PROSPECT'  // Skor 70-84: Negosiasi harga, minta simulasi KPA/cicilan, minat tinggi
  | 'WARM'      // Skor 45-69: Responsif, tanya pricelist & e-brochure, eksplorasi unit
  | 'COLD'      // Skor 20-44: Baru kontak awal, belum respon/read-only, pasif
  | 'JUNK';     // Skor 0-19: Salah sambung, batal, nomor tidak aktif, out of budget

export type PipelineStage = 
  | 'NEW'
  | 'CONTACTED'
  | 'SITE_VISIT_SCHEDULED'
  | 'NEGOTIATION'
  | 'BOOKING_CLOSING'
  | 'LOST';

export type OmnichannelSource = 
  | 'WHATSAPP' 
  | 'INSTAGRAM' 
  | 'WEBSITE' 
  | 'TIKTOK'
  | 'PHONE_CALL' 
  | 'EMAIL' 
  | 'EXCEL_IMPORT'
  | 'WALK_IN';

export type PropertyUnitInterest = 
  | 'Lifestyle SOHO (Type A - 78m²)'
  | 'SOHO Suite (Type B - 112m²)'
  | '1BR Modern Loft (45m²)'
  | '2BR Sky Residence (88m²)'
  | 'Grand Penthouse (180m²)'
  | 'Commercial Ground Floor (150m²)';

// 12 Performance Evaluation Specific Types:
export type FollowUpResolveStatus = 
  | 'FIRST_CONTACT'       // First Contact / Kontak Pertama
  | 'FOLLOW_UP_CONTACT'   // Follow Up Contact / Kontak Lanjutan
  | 'RESOLVED'            // Selesai Follow Up / Closed / Solved
  | 'NEED_FOLLOW_UP'      // Perlu Tindak Lanjut Berikutnya
  | 'IN_PROGRESS'         // Sedang Berkomunikasi Aktif
  | 'PENDING'             // Menunggu Respon Prospek
  | 'ESCALATED';          // Eskalasi ke Sales Manager / SPV

export interface LeadBehaviors {
  tanyaHarga?: boolean;       // +10
  tanyaPromo?: boolean;       // +10
  tanyaLokasi?: boolean;      // +10
  scheduleVisit?: boolean;    // +20
  datangMGorSite?: boolean;   // +30
  repeatVisit?: boolean;      // +40 (2nd, 3rd visit)
  closing?: boolean;          // +50 (Closing / SPK)
}

export interface BehaviorScoreItem {
  key: keyof LeadBehaviors;
  label: string;
  points: number;
  active: boolean;
  description: string;
}

export interface BehaviorScoreResult {
  totalScore: number;         // 0 - 170
  maxScore: number;           // 170
  percentage: number;         // (totalScore / 170) * 100
  behaviors: LeadBehaviors;
  items: BehaviorScoreItem[];
}

export type SopComplianceStatus = 
  | 'SOP_MET'          // < 15 Menit: Sesuai SLA SOP Respon Cepat
  | 'SOP_WARNING'      // 15 - 30 Menit: Mendekati Batas Maksimal
  | 'SOP_BREACHED'     // > 30 Menit: Melanggar SLA SOP Respon
  | 'PENDING';         // Belum Ada Respon Pertama

export interface ActivityEvent {
  id: string;
  type: 
    | 'BROCHURE_DOWNLOAD'
    | 'FLOORPLAN_DOWNLOAD'
    | 'VIRTUAL_TOUR'
    | 'WEB_VISIT'
    | 'PRICE_CALCULATOR'
    | 'GOAPP_CHAT_MESSAGE'
    | 'GOAPP_VOICE_CALL'
    | 'SITE_VISIT_REQUEST'
    | 'PRICE_PROPOSAL_VIEWED'
    | 'SALES_NOTE_ADDED'
    | 'EXCEL_IMPORT_EVENT';
  title: string;
  description: string;
  timestamp: string;
  pointsAdded: number;
  channel: OmnichannelSource;
  metadata?: Record<string, any>;
}

export interface OmnichannelMessage {
  id: string;
  sender: 'CUSTOMER' | 'SALES_AGENT' | 'SYSTEM_BOT';
  senderName: string;
  channel: OmnichannelSource;
  message: string;
  timestamp: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'INQUIRING' | 'URGENT' | 'NEGATIVE';
  attachments?: {
    name: string;
    type: 'PDF' | 'IMAGE' | 'LOCATION';
    url: string;
  }[];
}

export interface RemarksAnalysisResult {
  category: LeadCategory;
  scoreModifier: number;
  detectedSignals: string[];
  explanation: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT' | 'DISQUALIFIED' | 'INQUIRING';
}

export interface ScoreBreakdown {
  digitalEngagement: {
    score: number;
    maxScore: number;
    details: string[];
  };
  omnichannelVelocity: {
    score: number;
    maxScore: number;
    details: string[];
  };
  budgetAndFit: {
    score: number;
    maxScore: number;
    details: string[];
  };
  recencyFreshness: {
    score: number;
    maxScore: number;
    details: string[];
  };
  remarksEvaluation?: {
    score: number;
    scoreModifier?: number;
    detectedSignals?: string[];
    reason?: string;
    details: string[];
  };
  behaviorScore?: BehaviorScoreResult;
  totalScore: number; // 0 - 100
  behaviorTotalScore?: number; // 0 - 170
  qualityTier: LeadQuality;
  leadCategory: LeadCategory;
  categoryTier?: LeadCategory;
}

export interface SalesAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'Senior Property Advisor' | 'Property Consultant' | 'Sales Manager';
  activeLeadsCount: number;
  closingRate: number; // percentage
  avgResponseTimeMinutes?: number;
  sopComplianceRate?: number; // percentage (e.g. 94%)
}

/**
 * Lead Interface with the 12 Essential Performance Evaluation Variables:
 * 1. No. (leadNumber)
 * 2. Date contact (dateContact)
 * 3. No Telfon (phone)
 * 4. Resolve / Follow Up (resolveStatus)
 * 5. Status Leads (category & stage)
 * 6. assigned_to (assignedToName & assignedAgentId)
 * 7. answered_at (answeredAt)
 * 8. first_response_time (firstResponseTimeMinutes & firstResponseTimeFormatted)
 * 9. agent_first_reply_time (agentFirstReplyTime)
 * 10. Source Iklan by (adSource)
 * 11. Remaks FU 1 (remarksFu1)
 * 12. SOP (sopStatus & sopNotes)
 */
export interface Lead {
  id: string;
  
  // 1. No.
  leadNumber: number;
  
  // 2. Date contact
  dateContact: string;
  
  // 3. No Telfon
  phone: string;
  
  // 4. Resolve / Follow Up
  resolveStatus: FollowUpResolveStatus;
  
  // 5. Status Leads
  stage: PipelineStage;
  category?: LeadCategory;
  
  // 6. assigned_to
  assignedAgentId: string;
  assignedToName?: string;
  
  // 7. answered_at
  answeredAt?: string;
  
  // 8. first_response_time
  firstResponseTimeMinutes?: number;
  firstResponseTimeFormatted?: string;
  
  // 9. agent_first_reply_time
  agentFirstReplyTime?: string;
  
  // 10. Source Iklan by & Campaign
  adSource: string;
  adPlatform?: string;
  adContent?: string;
  campaignSource?: string;
  
  // 11. Remaks FU 1
  remarksFu1: string;
  
  // 12. SOP
  sopStatus: SopComplianceStatus;
  sopNotes?: string;

  // Additional Profile & Scoring Details
  name: string;
  email: string;
  occupation: string;
  company?: string;
  city: string;
  preferredUnit: PropertyUnitInterest;
  budgetEstimated: number; // In IDR (e.g. 3500000000)
  budgetRangeText: string;
  preferredPayment: 'Hard Cash' | 'In-House 36x' | 'KPA Express' | 'Balloon Payment';
  primaryChannel: OmnichannelSource;
  goAppConversationId: string;
  
  historyRemarks?: string;
  remarksAnalysis?: RemarksAnalysisResult;
  behaviors?: LeadBehaviors;
  behaviorScore?: number; // 0 - 170 points
  
  // Dynamic Calculated Score
  score: number;
  scoreBreakdown: ScoreBreakdown;
  quality: LeadQuality;
  
  lastActivityAt: string;
  createdAt: string;
  notes: string[];
  
  activities: ActivityEvent[];
  messages: OmnichannelMessage[];
  
  // AI Copilot evaluation
  aiEvaluation?: {
    summary: string;
    buyingReadiness: string;
    keyInterest: string;
    objectionsOrRisks: string[];
    recommendedNextStep: string;
    suggestedPitchScript: string;
    lastEvaluatedAt: string;
  };
}

export interface ExcelRowInput {
  id?: string;
  no: number;
  date: string;
  contact: string;
  phone: string;
  resolve: string;
  status: string;
  assigned: string;
  answeredAt: string;
  firstResponseTime: string;
  agentFirstReplyTime: string;
  source: string;
  adSource: string;
  remarks: string;
  sop?: string;
  notes?: string | null;
}

export interface ExcelImportRow {
  no?: number | string;
  dateContact?: string;
  phone: string;
  resolveStatus?: string;
  statusLeads?: string;
  assignedTo?: string;
  answeredAt?: string;
  firstResponseTime?: string | number;
  agentFirstReplyTime?: string;
  adSource?: string;
  remarksFu1?: string;
  sop?: string;

  // Optional Standard Profile
  name?: string;
  email?: string;
  occupation?: string;
  preferredUnit?: string;
  budgetEstimated?: number | string;
  historyRemarks?: string;
  preferredPayment?: string;
  channel?: string;
  stage?: string;
}

export interface CategorySummaryStat {
  category: LeadCategory;
  label: string;
  count: number;
  percentage: number;
  totalPipelineValue: number;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  description: string;
  recommendedAction: string;
}

export interface ScoringWeightsConfig {
  brochureDownloadPoints: number;
  virtualTourPoints: number;
  mortgageCalculatorPoints: number;
  webVisitRepeatPoints: number;
  whatsappFastReplyPoints: number;
  siteVisitRequestPoints: number;
  callDurationPoints: number;
  multiChannelBonusPoints: number;
  highBudgetBonusPoints: number;
  paymentSchemeSelectedPoints: number;
  hotThreshold: number;
  warmThreshold: number;
}

export interface GoAppWebhookLog {
  id: string;
  eventType: 'INCOMING_MESSAGE' | 'SITE_VISIT_BOOKED' | 'CALL_COMPLETED' | 'BROCHURE_REQUEST';
  channel: OmnichannelSource;
  leadName: string;
  summary: string;
  rawPayload: any;
  scoreImpact: number;
  timestamp: string;
}

export interface CampaignAdCostConfig {
  [campaignKey: string]: number;
}

export interface CampaignSourceStat {
  campaignKey: string;        // e.g. "Instagram - SOHO Signature"
  platform: string;           // "Instagram", "Google", "Not Detected", etc.
  contentName: string;        // "SOHO Signature", "Apart Kampus", etc.
  totalLeads: number;
  percentageOfTotal: number;
  visitedCount: number;
  prospectCount: number;
  warmCount: number;
  coldCount: number;
  junkCount: number;
  qualifiedCount: number;     // visited + prospect + warm
  qualifiedRate: number;      // (qualified / total) * 100
  junkRate: number;           // (junk / total) * 100
  manualCost: number;         // in IDR
  costSharePercentage: number;
  cpl: number;                // Cost per Lead
  cpql: number;               // Cost per Qualified Lead
  costPerVisited: number;     // Cost per Visited Lead
  avgResponseTime: number;
  leads: Lead[];
}

export interface DigitalAdsResultRow {
  no: number;
  month: string;           // 'JANUARI', 'FEBRUARI', etc.
  monthKey: string;        // '2026-01', '2026-02', etc.
  adBudget: number;        // Rp Ad Budget
  meta: number;            // Rp Meta Ads
  google: number;          // Rp Google Ads
  tiktok: number;          // Rp TikTok Ads
  rawLeads: number;        // Raw Incoming Leads
  validLeads: number;      // Valid / Qualified Leads
  qualifiedLeadsPct: number; // % Qualified
  sourceFb: number;        // Source closing - FB
  sourceIg: number;        // Source closing - IG
  sourceGoogle: number;    // Source closing - Google
  sourceTiktok: number;    // Source closing - TikTok
  sourceYoutube: number;   // Source closing - YouTube
  visited: number;         // Total Visited (Show Unit)
  totalSold: number;       // Total Closed Units Sold
  priceExcPpn: number;     // Revenue Price Exc PPN in IDR
  cpl: number;             // Cost Per Lead (IDR)
  percentRate: number;     // Sales % Rate (e.g. 1.29%)
  leadsToVisit: number;    // Leads to Visit % (e.g. 7.87%)
  notes?: string;
}

