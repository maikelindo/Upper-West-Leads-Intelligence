import { Lead, SalesAgent, FollowUpResolveStatus, SopComplianceStatus, LeadCategory, ExcelRowInput } from '../types';
import { calculateLeadScore, evaluateSopCompliance, extractBehaviorsFromLead, parseCampaignSource } from '../services/leadScoring';
import { EXCEL_LEADS_SEPTEMBER } from './leadsSeptemberData';
import { EXCEL_LEADS_AUGUST } from './leadsAugustData';
import { EXCEL_LEADS_JULY_310 } from './leadsJulyData';

export const MOCK_SALES_AGENTS: SalesAgent[] = [
  {
    id: 'agent-bayu',
    name: 'Kadek Bayu Permana Putra',
    email: 'bayu.permana@upperwest-bsd.com',
    phone: '+62 812-3456-7801',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Senior Property Advisor',
    activeLeadsCount: 42,
    closingRate: 31.5,
    avgResponseTimeMinutes: 4.2,
    sopComplianceRate: 98,
  },
  {
    id: 'agent-regina',
    name: 'Regina Junita',
    email: 'regina.junita@upperwest-bsd.com',
    phone: '+62 813-4567-8902',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'Property Consultant',
    activeLeadsCount: 36,
    closingRate: 28.0,
    avgResponseTimeMinutes: 5.1,
    sopComplianceRate: 95,
  },
  {
    id: 'agent-fitriyani',
    name: 'Fitriyani Dewi',
    email: 'fitriyani.dewi@upperwest-bsd.com',
    phone: '+62 811-5678-9013',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'Property Consultant',
    activeLeadsCount: 22,
    closingRate: 29.5,
    avgResponseTimeMinutes: 3.9,
    sopComplianceRate: 99,
  },
  {
    id: 'agent-ditto',
    name: 'Ditto Zulfikar Junaedi',
    email: 'ditto.zulfikar@upperwest-bsd.com',
    phone: '+62 812-6789-0124',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'Senior Property Advisor',
    activeLeadsCount: 28,
    closingRate: 34.0,
    avgResponseTimeMinutes: 4.8,
    sopComplianceRate: 97,
  },
  {
    id: 'agent-yulia',
    name: 'Yulia Eunike',
    email: 'yulia.eunike@upperwest-bsd.com',
    phone: '+62 813-7890-1235',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Property Consultant',
    activeLeadsCount: 30,
    closingRate: 26.2,
    avgResponseTimeMinutes: 14.5,
    sopComplianceRate: 88,
  },
  {
    id: 'agent-ira',
    name: 'Ira Rosdiana',
    email: 'ira.rosdiana@upperwest-bsd.com',
    phone: '+62 811-8901-2346',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'Property Consultant',
    activeLeadsCount: 18,
    closingRate: 27.8,
    avgResponseTimeMinutes: 3.2,
    sopComplianceRate: 100,
  },
  {
    id: 'agent-sarah',
    name: 'Sarah Safira Firdais',
    email: 'sarah.safira@upperwest-bsd.com',
    phone: '+62 812-7890-4321',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    role: 'Property Consultant',
    activeLeadsCount: 15,
    closingRate: 25.0,
    avgResponseTimeMinutes: 4.5,
    sopComplianceRate: 96,
  },
];

export function getAgentIdByName(name: string): string {
  const n = (name || '').toLowerCase();
  const words = n.split(/[\s,.-]+/);
  if (words.includes('sarah') || words.includes('safira') || words.includes('firdais') || n.includes('sarah')) return 'agent-sarah';
  if (words.includes('bayu') || words.includes('kadek') || n.includes('bayu') || n.includes('kadek')) return 'agent-bayu';
  if (words.includes('regina') || n.includes('regina')) return 'agent-regina';
  if (words.includes('fitriyani') || words.includes('dewi') || n.includes('fitriyani') || n.includes('dewi')) return 'agent-fitriyani';
  if (words.includes('ditto') || n.includes('ditto')) return 'agent-ditto';
  if (words.includes('yulia') || words.includes('eunike') || n.includes('yulia') || n.includes('eunike')) return 'agent-yulia';
  if (words.includes('ira') || words.includes('rosdiana') || n.includes('ira rosdiana')) return 'agent-ira';
  return 'agent-bayu';
}

/**
 * Checks if a lead belongs to an agent accurately, preventing false-positive substring collisions
 * (e.g. preventing 'Ira' from matching 'Sarah Safira Firdais' where 'safira' contains 'ira').
 */
export function isLeadAssignedToAgent(
  lead: { assignedAgentId?: string; assignedToName?: string },
  agent: { id: string; name: string }
): boolean {
  // 1. Direct agent ID match
  if (lead.assignedAgentId && lead.assignedAgentId === agent.id) return true;

  // 2. Exact full name match (case-insensitive, trimmed)
  const leadAgentName = (lead.assignedToName || '').toLowerCase().trim();
  const agentName = agent.name.toLowerCase().trim();
  if (leadAgentName && leadAgentName === agentName) return true;

  // 3. Word-level token match (prevents substring collision like 'ira' matching inside 'safira')
  if (leadAgentName) {
    const leadWords = leadAgentName.split(/[\s,.-]+/);
    const agentWords = agentName.split(/[\s,.-]+/);
    const hasWordMatch = agentWords.some((w) => w.length >= 3 && leadWords.includes(w));
    if (hasWordMatch) return true;
  }

  return false;
}

export function parseResponseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === '0:00:00') return 0;
  const parts = timeStr.split(':').map(p => parseInt(p, 10));
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + (parts[2] > 0 ? parts[2] / 60 : 0);
  }
  if (parts.length === 2) {
    return parts[0] + parts[1] / 60;
  }
  return 0;
}

// All leads from Excel / PDF dataset (September 273 leads + August 335 leads + July 310 leads = 918 leads)
export const EXCEL_LEADS_DATA: ExcelRowInput[] = [
  ...EXCEL_LEADS_SEPTEMBER,
  ...EXCEL_LEADS_AUGUST,
  ...EXCEL_LEADS_JULY_310
];

export function mapExcelRowToLead(row: ExcelRowInput): Lead {
  const respMins = parseResponseTimeToMinutes(row.firstResponseTime);
  const agentId = getAgentIdByName(row.assigned);
  const dateLower = (row.date || '').toLowerCase();
  const monthTag = dateLower.includes('sep') ? 'sep' : dateLower.includes('jul') ? 'jul' : 'aug';
  
  // Normalize Lead Category
  let category: LeadCategory = 'COLD';
  const statusUpper = (row.status || '').toUpperCase();
  if (statusUpper.includes('WARM')) category = 'WARM';
  else if (statusUpper.includes('JUNK') || row.resolve.includes('Junk') || row.resolve.includes('Strangers') || row.resolve.includes('Cari Sewa') || row.resolve.includes('Jualan Product') || row.resolve.includes('Cari Kerja') || row.resolve.includes('Over buget')) category = 'JUNK';
  else if (statusUpper.includes('VISITED')) category = 'VISITED';
  else if (statusUpper.includes('PROSPECT')) category = 'PROSPECT';
  else if (statusUpper.includes('COLD')) category = 'COLD';
  else {
    // If not specified, derive from remarks
    if (row.remarks.toLowerCase().includes('minat') || row.remarks.toLowerCase().includes('visit')) {
      category = 'WARM';
    } else {
      category = 'COLD';
    }
  }

  // Normalize Resolve Status
  let resolveStatus: FollowUpResolveStatus = 'FIRST_CONTACT';
  const resText = (row.resolve || '').toLowerCase();
  if (resText.includes('follow up') || resText.includes('fu')) resolveStatus = 'FOLLOW_UP_CONTACT';
  else if (resText.includes('first contact') || resText.includes('first')) resolveStatus = 'FIRST_CONTACT';
  else if (resText.includes('resolved') || resText.includes('closing')) resolveStatus = 'RESOLVED';
  else if (resText.includes('pending')) resolveStatus = 'PENDING';
  else if (resText.includes('progress')) resolveStatus = 'IN_PROGRESS';
  else if (resText.includes('escalated')) resolveStatus = 'ESCALATED';
  else resolveStatus = 'FIRST_CONTACT';

  // SOP Compliance Status (ditarik dari data kolom checklist SOP ✅ / ❌ pada file PDF/Excel)
  let sopStatus: SopComplianceStatus = 'SOP_MET';
  if (category === 'JUNK') {
    // Junk leads tidak dievaluasi (non-evaluasi)
    sopStatus = 'PENDING';
  } else if (row.sop) {
    const rawSop = String(row.sop).trim();
    if (rawSop.includes('❌') || rawSop.toUpperCase().includes('BREACH') || rawSop.toUpperCase().includes('UNMET') || rawSop === 'NO' || rawSop.includes('TIDAK')) {
      sopStatus = 'SOP_BREACHED';
    } else if (rawSop.includes('⚠️') || rawSop.toUpperCase().includes('WARN')) {
      sopStatus = 'SOP_WARNING';
    } else if (rawSop.includes('✅') || rawSop.toUpperCase().includes('MET') || rawSop === 'YES') {
      sopStatus = 'SOP_MET';
    }
  } else {
    const agentReplyMins = parseResponseTimeToMinutes(row.agentFirstReplyTime);
    sopStatus = agentReplyMins <= 2.0 ? 'SOP_MET' : 'SOP_BREACHED';
  }

  // Initial stage mapping
  let stage: Lead['stage'] = 'CONTACTED';
  if (category === 'JUNK') stage = 'LOST';
  else if (category === 'VISITED') stage = 'SITE_VISIT_SCHEDULED';
  else if (category === 'WARM') stage = 'CONTACTED';
  else stage = 'NEW';

  const campaignMeta = parseCampaignSource(row.source, row.adSource);

  const baseLead: Partial<Lead> = {
    id: row.id || `excel-lead-${monthTag}-${row.no}`,
    leadNumber: row.no,
    dateContact: row.date,
    name: row.contact,
    phone: row.phone,
    resolveStatus: resolveStatus,
    stage: stage,
    category: category,
    assignedAgentId: agentId,
    assignedToName: row.assigned,
    answeredAt: row.answeredAt,
    firstResponseTimeMinutes: Math.round(respMins * 10) / 10,
    firstResponseTimeFormatted: row.firstResponseTime,
    agentFirstReplyTime: row.agentFirstReplyTime,
    adSource: campaignMeta.fullName,
    adPlatform: campaignMeta.platform,
    adContent: campaignMeta.content,
    campaignSource: campaignMeta.fullName,
    primaryChannel: row.source.toLowerCase().includes('google') ? 'WEBSITE' : row.source.toLowerCase().includes('instagram') ? 'INSTAGRAM' : row.source.toLowerCase().includes('tiktok') ? 'TIKTOK' : 'WHATSAPP',
    remarksFu1: row.remarks,
    historyRemarks: row.remarks,
    sopStatus: sopStatus,
    sopNotes: sopStatus === 'SOP_MET' 
      ? 'SOP Sales Sesuai (✅ Sesuai)' 
      : sopStatus === 'PENDING' 
      ? 'Non-Evaluated / Junk Lead' 
      : 'SOP Sales Tidak Sesuai (❌ Breached)',
    createdAt: new Date().toISOString(),
    preferredUnit: row.adSource.includes('SOHO') ? 'Lifestyle SOHO (Type A - 78m²)' : row.adSource.includes('Apart') ? '2BR Sky Residence (88m²)' : 'Lifestyle SOHO (Type A - 78m²)',
    budgetEstimated: category === 'WARM' ? 1850000000 : 1200000000,
    city: 'Jabodetabek',
    notes: row.remarks ? [row.remarks] : [],
    messages: [
      {
        id: `msg-${monthTag}-${row.no}-1`,
        sender: 'CUSTOMER',
        senderName: row.contact,
        channel: 'WHATSAPP',
        message: row.remarks || 'Halo, saya ingin informasi mengenai Upper West BSD.',
        timestamp: row.date,
      },
      {
        id: `msg-${monthTag}-${row.no}-2`,
        sender: 'SALES_AGENT',
        senderName: row.assigned,
        channel: 'WHATSAPP',
        message: `Halo ${row.contact}, terima kasih telah menghubungi Upper West BSD. Ada yang bisa kami bantu?`,
        timestamp: row.answeredAt || row.date,
      }
    ],
    activities: [
      {
        id: `act-${monthTag}-${row.no}-1`,
        type: 'EXCEL_IMPORT_EVENT',
        title: 'Lead Masuk',
        description: `Lead tercatat pada ${row.date} via ${row.source} (${row.adSource})`,
        timestamp: row.date,
        pointsAdded: 10,
        channel: 'WHATSAPP',
      }
    ]
  };

  const behaviors = extractBehaviorsFromLead(baseLead);
  const scoreBreakdown = calculateLeadScore({ ...baseLead, behaviors } as Lead);

  return {
    ...baseLead,
    score: scoreBreakdown.totalScore,
    behaviors: behaviors,
    behaviorScore: scoreBreakdown.behaviorScore?.totalScore || 0,
    scoreBreakdown: scoreBreakdown,
    quality: scoreBreakdown.qualityTier,
    category: category,
  } as Lead;
}

export const INITIAL_LEADS: Lead[] = (() => {
  const seenIds = new Set<string>();
  return EXCEL_LEADS_DATA.map((row, idx) => {
    const lead = mapExcelRowToLead(row);
    if (seenIds.has(lead.id)) {
      lead.id = `${lead.id}-dup-${idx + 1}`;
    }
    seenIds.add(lead.id);
    return lead;
  });
})();

export const MOCK_GOAPP_WEBHOOKS = [
  {
    id: 'wh-01',
    eventType: 'INCOMING_MESSAGE' as const,
    channel: 'WHATSAPP' as const,
    leadName: 'Niki',
    summary: 'Customer mengirim pesan: Tanya harga unit SOHO dan promo launching',
    rawPayload: { phone: '081283626372', text: 'Halo mau tanya harga SOHO BSD' },
    scoreImpact: 10,
    timestamp: '2026-08-16 09:15',
  },
  {
    id: 'wh-02',
    eventType: 'SITE_VISIT_BOOKED' as const,
    channel: 'WHATSAPP' as const,
    leadName: 'Ibu Yenny',
    summary: 'Customer menjadwalkan visit show unit hari Sabtu',
    rawPayload: { phone: '081387654321', text: 'Saya mau survey lokasi sabtu jam 2 siang' },
    scoreImpact: 20,
    timestamp: '2026-08-16 10:30',
  },
  {
    id: 'wh-03',
    eventType: 'BROCHURE_REQUEST' as const,
    channel: 'INSTAGRAM' as const,
    leadName: 'Bapak Hendra',
    summary: 'Download e-brochure Sky Residence',
    rawPayload: { phone: '081122334455', campaign: 'Instagram Ads Promo SOHO' },
    scoreImpact: 10,
    timestamp: '2026-08-16 11:00',
  }
];
