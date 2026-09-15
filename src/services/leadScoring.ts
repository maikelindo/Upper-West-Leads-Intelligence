import { 
  Lead, 
  ScoreBreakdown, 
  LeadQuality, 
  LeadCategory, 
  RemarksAnalysisResult, 
  ScoringWeightsConfig,
  CategorySummaryStat,
  SalesAgent,
  PropertyUnitInterest,
  OmnichannelSource,
  FollowUpResolveStatus,
  SopComplianceStatus,
  LeadBehaviors,
  BehaviorScoreResult,
  BehaviorScoreItem
} from '../types';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeightsConfig = {
  brochureDownloadPoints: 10,
  virtualTourPoints: 8,
  mortgageCalculatorPoints: 8,
  webVisitRepeatPoints: 6,
  whatsappFastReplyPoints: 12,
  siteVisitRequestPoints: 22,
  callDurationPoints: 10,
  multiChannelBonusPoints: 10,
  highBudgetBonusPoints: 15,
  paymentSchemeSelectedPoints: 10,
  hotThreshold: 75,
  warmThreshold: 45,
};

/**
 * Exact Behavior Point Matrix as specified by user:
 * - Tanya harga: +10
 * - Tanya promo: +10
 * - Tanya lokasi: +10
 * - Schedule Visit: +20
 * - Datang ke MG / Site: +30
 * - 2nd, 3rd visit: +40
 * - Closing: +50
 * Total Point: 170
 */
export const BEHAVIOR_POINT_CONFIG: {
  key: keyof LeadBehaviors;
  label: string;
  points: number;
  description: string;
}[] = [
  { key: 'tanyaHarga', label: 'Tanya harga', points: 10, description: 'Menanyakan pricelist, estimasi harga unit, skema cicilan' },
  { key: 'tanyaPromo', label: 'Tanya promo', points: 10, description: 'Menanyakan diskon launching, DP 0%, cashback, bonus furnished' },
  { key: 'tanyaLokasi', label: 'Tanya lokasi', points: 10, description: 'Menanyakan lokasi CBD BSD, akses tol, fasilitas sekitar' },
  { key: 'scheduleVisit', label: 'Schedule Visit', points: 20, description: 'Membuat janji temu / booking jadwal survei show unit' },
  { key: 'datangMGorSite', label: 'Datang ke MG / Site', points: 30, description: 'Hadir langsung di Marketing Gallery / lokasi Upper West BSD' },
  { key: 'repeatVisit', label: '2nd, 3rd visit', points: 40, description: 'Kunjungan lanjutan (ke-2 atau ke-3) bersama keluarga/partner' },
  { key: 'closing', label: 'Closing', points: 50, description: 'Pemesanan unit, transfer booking fee, dan penandatanganan SPK' },
];

/**
 * Extracts behavioral flags from remarks, activities, messages, and stage
 */
export function extractBehaviorsFromLead(lead: Partial<Lead>): LeadBehaviors {
  // If explicitly specified in lead.behaviors, start with that
  const current = lead.behaviors || {};
  
  const text = [
    lead.remarksFu1 || '',
    lead.historyRemarks || '',
    ...(lead.notes || []),
    ...(lead.messages?.map(m => m.message) || []),
    ...(lead.activities?.map(a => `${a.title} ${a.description}`) || []),
  ].join(' ').toLowerCase();

  const stage = lead.stage;
  const activities = lead.activities || [];

  // Tanya Harga (+10)
  const hasTanyaHarga = current.tanyaHarga !== undefined 
    ? current.tanyaHarga 
    : text.includes('harga') || text.includes('pricelist') || text.includes('price list') || text.includes('price') || activities.some(a => a.type === 'PRICE_CALCULATOR');

  // Tanya Promo (+10)
  const hasTanyaPromo = current.tanyaPromo !== undefined 
    ? current.tanyaPromo 
    : text.includes('promo') || text.includes('diskon') || text.includes('discount') || text.includes('dp 0%') || text.includes('cashback') || text.includes('cicilan');

  // Tanya Lokasi (+10)
  const hasTanyaLokasi = current.tanyaLokasi !== undefined 
    ? current.tanyaLokasi 
    : text.includes('lokasi') || text.includes('alamat') || text.includes('bsd') || text.includes('akses') || text.includes('tol') || text.includes('cbd');

  // Schedule Visit (+20)
  const hasScheduleVisit = current.scheduleVisit !== undefined 
    ? current.scheduleVisit 
    : text.includes('schedule visit') || text.includes('janji visit') || text.includes('jadwal visit') || text.includes('booking visit') || text.includes('appointment') || text.includes('janji survei') || stage === 'SITE_VISIT_SCHEDULED' || activities.some(a => a.type === 'SITE_VISIT_REQUEST');

  // Datang ke MG / Site (+30)
  const hasDatangMG = current.datangMGorSite !== undefined 
    ? current.datangMGorSite 
    : text.includes('datang ke mg') || text.includes('marketing gallery') || text.includes('sudah visit') || text.includes('sudah datang') || text.includes('sudah survey') || text.includes('visit show unit') || text.includes('hadir di show unit') || text.includes('gallery bsd') || text.includes('site visit selesai');

  // 2nd, 3rd visit (+40)
  const hasRepeatVisit = current.repeatVisit !== undefined 
    ? current.repeatVisit 
    : text.includes('2nd visit') || text.includes('3rd visit') || text.includes('visit kedua') || text.includes('visit ke-2') || text.includes('visit ke-3') || text.includes('kunjungan kedua') || text.includes('datang lagi') || text.includes('survei ulang');

  // Closing (+50)
  const hasClosing = current.closing !== undefined 
    ? current.closing 
    : text.includes('closing') || text.includes('spk') || text.includes('booking fee') || text.includes('tanda jadi') || text.includes('deal unit') || text.includes('siap spk') || stage === 'BOOKING_CLOSING';

  return {
    tanyaHarga: hasTanyaHarga,
    tanyaPromo: hasTanyaPromo,
    tanyaLokasi: hasTanyaLokasi,
    scheduleVisit: hasScheduleVisit,
    datangMGorSite: hasDatangMG,
    repeatVisit: hasRepeatVisit,
    closing: hasClosing,
  };
}

/**
 * Calculates Behavior Score based on 170 Points scale
 */
export function calculateBehaviorScore(behaviors: LeadBehaviors): BehaviorScoreResult {
  let totalScore = 0;
  const items: BehaviorScoreItem[] = BEHAVIOR_POINT_CONFIG.map(config => {
    const active = !!behaviors[config.key];
    if (active) {
      totalScore += config.points;
    }
    return {
      key: config.key,
      label: config.label,
      points: config.points,
      active,
      description: config.description,
    };
  });

  const maxScore = 170;
  const percentage = Math.min(Math.round((totalScore / maxScore) * 100), 100);

  return {
    totalScore,
    maxScore,
    percentage,
    behaviors,
    items,
  };
}

/**
 * Intelligent Remark & Keyword Analysis for Indonesian Property Sales Notes (FU 1 / Remarks)
 */
export function analyzeRemarks(remarksText: string = ''): RemarksAnalysisResult {
  const text = remarksText.toLowerCase().trim();
  
  if (!text) {
    return {
      category: 'COLD',
      scoreModifier: 0,
      detectedSignals: ['Belum ada riwayat catatan follow-up (FU 1)'],
      explanation: 'Tidak ada catatan follow up, skor dihitung dari data profil & kecepatan respon.',
      sentiment: 'NEUTRAL',
    };
  }

  // 1. JUNK KEYWORDS CHECK (High Priority Filter)
  const junkPatterns = [
    { key: 'salah sambung', label: 'Salah Sambung' },
    { key: 'salah nomor', label: 'Nomor Salah' },
    { key: 'tidak aktif', label: 'Nomor Tidak Aktif' },
    { key: 'tidak terdaftar', label: 'Tidak Terdaftar' },
    { key: 'batal', label: 'Batal Minat' },
    { key: 'cancel', label: 'Cancel Follow-up' },
    { key: 'tidak berminat', label: 'Tidak Berminat' },
    { key: 'tidak tertarik', label: 'Tidak Tertarik' },
    { key: 'bukan target', label: 'Bukan Target Market' },
    { key: 'rumah subsidi', label: 'Cari Rumah Subsidi / Budget Rendah' },
    { key: 'cari kontrakan', label: 'Hanya Cari Sewa / Kontrakan' },
    { key: 'dana tidak cukup', label: 'Kendala Budget / Dana' },
    { key: 'tidak ada uang', label: 'Ketiadaan Dana' },
    { key: 'spam', label: 'Spam Lead' },
    { key: 'blokir', label: 'Kontak Memblokir' },
    { key: 'marah', label: 'Respon Negatif / Menolak Dihubungi' },
    { key: 'jangan wa lagi', label: 'Meminta Jangan Dihubungi' },
    { key: 'jangan hubungi', label: 'Permintaan DND (Do Not Disturb)' },
    { key: 'iseng', label: 'Prospek Iseng / Tidak Valid' },
    { key: 'out of budget', label: 'Out of Budget' },
  ];

  const matchedJunk = junkPatterns.filter(p => text.includes(p.key));
  if (matchedJunk.length > 0) {
    return {
      category: 'JUNK',
      scoreModifier: -50,
      detectedSignals: matchedJunk.map(m => m.label),
      explanation: `Terdeteksi indikasi Junk Lead: "${matchedJunk.map(m => m.label).join(', ')}". Disarankan arsipkan kontak.`,
      sentiment: 'DISQUALIFIED',
    };
  }

  // 2. VISITED KEYWORDS (Survey Fisik / Show Unit / Closed / SPK)
  const visitedPatterns = [
    { key: 'sudah visit', label: 'Telah Visit Show Unit (+28 Poin)' },
    { key: 'sudah datang', label: 'Hadir di Lokasi Upper West (+25 Poin)' },
    { key: 'sudah survey', label: 'Selesai Survei Lokasi (+25 Poin)' },
    { key: 'visit show unit', label: 'Kunjungan Show Unit (+28 Poin)' },
    { key: 'marketing gallery', label: 'Temu di Marketing Gallery BSD (+24 Poin)' },
    { key: 'gallery bsd', label: 'Kunjungan Gallery BSD (+24 Poin)' },
    { key: 'survei lokasi', label: 'Survei Lapangan (+25 Poin)' },
    { key: 'tinjau lokasi', label: 'Tinjau Lapangan (+22 Poin)' },
    { key: 'tour unit', label: 'Show Unit Tour (+24 Poin)' },
    { key: 'show unit selesai', label: 'Visit Show Unit Berhasil (+25 Poin)' },
    { key: 'booking fee', label: 'Pembayaran Tanda Jadi / Booking Fee (+30 Poin)' },
    { key: 'tanda jadi', label: 'Tanda Jadi Unit (+30 Poin)' },
    { key: 'siap spk', label: 'Kesiapan TTD SPK (+30 Poin)' },
    { key: 'draft spk', label: 'Permintaan Draft SPK (+28 Poin)' },
    { key: 'closing di tempat', label: 'Closing On the Spot (+30 Poin)' },
    { key: 'suka sekali unit', label: 'Feedback Sangat Positif (+20 Poin)' },
    { key: 'deal unit', label: 'Kesepakatan Deal Unit (+30 Poin)' },
  ];

  const matchedVisited = visitedPatterns.filter(p => text.includes(p.key));
  if (matchedVisited.length > 0) {
    return {
      category: 'VISITED',
      scoreModifier: 30,
      detectedSignals: matchedVisited.map(m => m.label),
      explanation: `Prospek telah mengunjungi show unit / gallery Upper West (${matchedVisited.map(m => m.label).join(', ')}). Peluang closing tertinggi!`,
      sentiment: 'URGENT',
    };
  }

  // 3. PROSPECT KEYWORDS (Finansial, Negosiasi, Simulasi KPA, Cicilan In-House)
  const prospectPatterns = [
    { key: 'simulasi kpa', label: 'Minta Simulasi KPA Bank (+18 Poin)' },
    { key: 'hitung kpa', label: 'Kalkulasi Plafon KPA (+18 Poin)' },
    { key: 'dp 10%', label: 'Diskusi Skema DP 10% (+15 Poin)' },
    { key: 'dp 20%', label: 'Diskusi Skema DP 20% (+16 Poin)' },
    { key: 'bca', label: 'Kesiapan Pengajuan KPA BCA (+15 Poin)' },
    { key: 'mandiri', label: 'Kesiapan Pengajuan KPA Mandiri (+15 Poin)' },
    { key: 'inhouse 36x', label: 'Minat Cicilan In-House 36x (+16 Poin)' },
    { key: 'in-house 36x', label: 'Minat Cicilan In-House 36x (+16 Poin)' },
    { key: 'nego', label: 'Negosiasi Harga / Cara Bayar (+14 Poin)' },
    { key: 'diskon', label: 'Tanya Diskon / Promo Spesial (+12 Poin)' },
    { key: 'janji visit', label: 'Janji Kunjungan Show Unit (+20 Poin)' },
    { key: 'booking jadwal', label: 'Jadwal Survei Disepakati (+20 Poin)' },
    { key: 'siap booking', label: 'Indikasi Kesiapan Booking (+25 Poin)' },
    { key: 'konsultasi arsitek', label: 'Konsultasi Layout Ruang (+15 Poin)' },
    { key: 'minat tipe', label: 'Minat Tipe Spesifik (+14 Poin)' },
  ];

  const matchedProspect = prospectPatterns.filter(p => text.includes(p.key));
  if (matchedProspect.length > 0) {
    return {
      category: 'PROSPECT',
      scoreModifier: 20,
      detectedSignals: matchedProspect.map(m => m.label),
      explanation: `Prospek berada pada tahap evaluasi finansial & penjadwalan visit (${matchedProspect.map(m => m.label).join(', ')}).`,
      sentiment: 'POSITIVE',
    };
  }

  // 4. WARM KEYWORDS (Brosur, Pricelist, Tanya Spesifikasi)
  const warmPatterns = [
    { key: 'minta brosur', label: 'Permintaan E-Brochure (+10 Poin)' },
    { key: 'kirim brosur', label: 'Kirim E-Brochure (+10 Poin)' },
    { key: 'pricelist', label: 'Permintaan Pricelist (+12 Poin)' },
    { key: 'price list', label: 'Permintaan Pricelist (+12 Poin)' },
    { key: 'harga', label: 'Tanya Rentang Harga (+8 Poin)' },
    { key: 'tanya luas', label: 'Tanya Luas Unit (+8 Poin)' },
    { key: 'floorplan', label: 'Tanya Denah/Floorplan (+10 Poin)' },
    { key: 'layout', label: 'Tanya Layout Ruang (+10 Poin)' },
    { key: 'tipe a', label: 'Tertarik Tipe A (+10 Poin)' },
    { key: 'tipe b', label: 'Tertarik Tipe B (+10 Poin)' },
    { key: 'loft', label: 'Tertarik Unit Loft (+10 Poin)' },
    { key: 'soho', label: 'Tertarik Konsep SOHO (+10 Poin)' },
    { key: 'investasi', label: 'Tujuan Investasi Sewa (+12 Poin)' },
    { key: 'tanya lokasi', label: 'Tanya Lokasi CBD BSD (+6 Poin)' },
    { key: 'ramah', label: 'Respon Chat Ramah & Terbuka (+8 Poin)' },
  ];

  const matchedWarm = warmPatterns.filter(p => text.includes(p.key));
  if (matchedWarm.length > 0) {
    return {
      category: 'WARM',
      scoreModifier: 10,
      detectedSignals: matchedWarm.map(m => m.label),
      explanation: `Prospek aktif menanyakan informasi Upper West (${matchedWarm.map(m => m.label).join(', ')}).`,
      sentiment: 'INQUIRING',
    };
  }

  // 5. COLD KEYWORDS / DEFAULT
  const coldPatterns = [
    { key: 'belum balas', label: 'Belum Membalas Pesan' },
    { key: 'centang satu', label: 'Pesan Belum Diterima' },
    { key: 'pending', label: 'Menunggu Respon' },
    { key: 'nanti dikabari', label: 'Follow Up Tertunda' },
    { key: 'sibuk', label: 'Sedang Sibuk / Belum Sempat' },
    { key: 'kirim wa dulu', label: 'Kirim Info Awal' },
  ];

  const matchedCold = coldPatterns.filter(p => text.includes(p.key));
  return {
    category: 'COLD',
    scoreModifier: 0,
    detectedSignals: matchedCold.length > 0 ? matchedCold.map(m => m.label) : ['Tahap Kontak Awal'],
    explanation: matchedCold.length > 0
      ? `Prospek masih pasif / tahap awal outreach (${matchedCold.map(m => m.label).join(', ')}).`
      : 'Prospek dalam tahap perkenalan, belum ada sinyal transaksi kuat.',
    sentiment: 'NEUTRAL',
  };
}

/**
 * Evaluates SOP SLA compliance based on First Response Time
 */
export function evaluateSopCompliance(
  firstResponseMinutes?: number,
  answeredAt?: string,
  remarksFu1?: string
): {
  sopStatus: SopComplianceStatus;
  notes: string;
} {
  if (firstResponseMinutes === undefined || firstResponseMinutes === null) {
    if (!answeredAt && (!remarksFu1 || remarksFu1.toLowerCase().includes('belum') || remarksFu1.toLowerCase().includes('pending'))) {
      return {
        sopStatus: 'PENDING',
        notes: 'Menunggu balasan pertama dari agen sales.',
      };
    }
    // Default estimated from answeredAt presence
    return {
      sopStatus: 'SOP_MET',
      notes: 'Respon pertama telah terkirim sesuai standar.',
    };
  }

  if (firstResponseMinutes <= 15) {
    return {
      sopStatus: 'SOP_MET',
      notes: `Respon sangat cepat: ${firstResponseMinutes} menit (< 15 menit target SLA SOP).`,
    };
  } else if (firstResponseMinutes <= 30) {
    return {
      sopStatus: 'SOP_WARNING',
      notes: `Respon cukup: ${firstResponseMinutes} menit (15 - 30 menit toleransi SOP).`,
    };
  } else {
    return {
      sopStatus: 'SOP_BREACHED',
      notes: `Melebihi SLA SOP: ${firstResponseMinutes} menit (> 30 menit). Perlu perbaikan kecepatan respon.`,
    };
  }
}

/**
 * Main Dynamic Lead Score & 5-Tier Category Calculation
 */
export function calculateLeadScore(
  lead: Partial<Lead>,
  weights: ScoringWeightsConfig = DEFAULT_SCORING_WEIGHTS
): ScoreBreakdown {
  const activities = lead.activities || [];
  const messages = lead.messages || [];
  
  // 1. Digital Engagement Score (Max 30)
  let digitalScore = 0;
  const digitalDetails: string[] = [];

  const brochureDownloads = activities.filter(a => a.type === 'BROCHURE_DOWNLOAD' || a.type === 'FLOORPLAN_DOWNLOAD').length;
  if (brochureDownloads > 0) {
    const pts = Math.min(brochureDownloads * weights.brochureDownloadPoints, 12);
    digitalScore += pts;
    digitalDetails.push(`Download E-Brochure/Floorplan (${brochureDownloads}x): +${pts} pts`);
  }

  const virtualTours = activities.filter(a => a.type === 'VIRTUAL_TOUR').length;
  if (virtualTours > 0) {
    digitalScore += weights.virtualTourPoints;
    digitalDetails.push(`Virtual Tour 360° SOHO: +${weights.virtualTourPoints} pts`);
  }

  const calculatorUses = activities.filter(a => a.type === 'PRICE_CALCULATOR').length;
  if (calculatorUses > 0) {
    digitalScore += weights.mortgageCalculatorPoints;
    digitalDetails.push(`Simulasi KPA / Angsuran: +${weights.mortgageCalculatorPoints} pts`);
  }

  const webVisits = activities.filter(a => a.type === 'WEB_VISIT').length;
  if (webVisits >= 2) {
    const pts = Math.min(webVisits * weights.webVisitRepeatPoints, 8);
    digitalScore += pts;
    digitalDetails.push(`Kunjungan Landing Page (${webVisits}x): +${pts} pts`);
  }

  const cappedDigital = Math.min(digitalScore, 30);

  // 2. Velocity & Response Speed (Max 35)
  let omniScore = 0;
  const omniDetails: string[] = [];

  const siteVisitRequested = activities.some(a => a.type === 'SITE_VISIT_REQUEST') || 
    messages.some(m => m.message.toLowerCase().includes('visit') || m.message.toLowerCase().includes('survey') || m.message.toLowerCase().includes('lihat show unit'));
  if (siteVisitRequested) {
    omniScore += weights.siteVisitRequestPoints;
    omniDetails.push(`Request Show Unit / Site Visit: +${weights.siteVisitRequestPoints} pts`);
  }

  // Response Speed Bonus (SOP evaluation)
  if (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes <= 5) {
    omniScore += 10;
    omniDetails.push(`Respon Kilat Agen (< 5 min): +10 pts`);
  } else if (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes <= 15) {
    omniScore += 6;
    omniDetails.push(`Respon Cepat SOP (< 15 min): +6 pts`);
  }

  const customerMessages = messages.filter(m => m.sender === 'CUSTOMER');
  if (customerMessages.length >= 3) {
    omniScore += weights.whatsappFastReplyPoints;
    omniDetails.push(`Keaktifan Respon Percakapan (${customerMessages.length} pesan): +${weights.whatsappFastReplyPoints} pts`);
  } else if (customerMessages.length > 0) {
    omniScore += 6;
    omniDetails.push(`Respon Pesan Pertama: +6 pts`);
  }

  const voiceCalls = activities.filter(a => a.type === 'GOAPP_VOICE_CALL').length;
  if (voiceCalls > 0) {
    omniScore += weights.callDurationPoints;
    omniDetails.push(`Tersambung Telepon Konsultasi: +${weights.callDurationPoints} pts`);
  }

  // Multi-channel bonus
  const channelsUsed = new Set(messages.map(m => m.channel).concat(activities.map(a => a.channel)));
  if (channelsUsed.size >= 2) {
    omniScore += weights.multiChannelBonusPoints;
    omniDetails.push(`Interaksi Multi-Channel: +${weights.multiChannelBonusPoints} pts`);
  }

  const cappedOmni = Math.min(omniScore, 35);

  // 3. Purchasing Power & Unit Fit (Max 25)
  let budgetScore = 0;
  const budgetDetails: string[] = [];

  const budget = typeof lead.budgetEstimated === 'number' ? lead.budgetEstimated : 0;
  if (budget >= 4000000000) {
    budgetScore += weights.highBudgetBonusPoints;
    budgetDetails.push(`Budget Sesuai Unit Premium (> Rp 4 Miliar): +${weights.highBudgetBonusPoints} pts`);
  } else if (budget >= 2000000000) {
    budgetScore += 10;
    budgetDetails.push(`Budget Menengah (> Rp 2 Miliar): +10 pts`);
  } else if (budget > 0) {
    budgetScore += 5;
    budgetDetails.push(`Budget Terkonfirmasi: +5 pts`);
  }

  if (lead.preferredPayment && lead.preferredPayment !== 'Hard Cash') {
    budgetScore += weights.paymentSchemeSelectedPoints;
    budgetDetails.push(`Skema Pembayaran Dipilih (${lead.preferredPayment}): +${weights.paymentSchemeSelectedPoints} pts`);
  } else if (lead.preferredPayment === 'Hard Cash') {
    budgetScore += 12;
    budgetDetails.push(`Minat Pembayaran Hard Cash (Prioritas): +12 pts`);
  }

  if (lead.preferredUnit) {
    budgetScore += 5;
    budgetDetails.push(`Target Tipe Unit Spesifik: +5 pts`);
  }

  const cappedBudget = Math.min(budgetScore, 25);

  // 4. Recency & Freshness (Max 10)
  let recencyScore = 0;
  const recencyDetails: string[] = [];

  const now = new Date().getTime();
  const lastActive = lead.lastActivityAt ? new Date(lead.lastActivityAt).getTime() : now;
  const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);

  if (hoursSinceActive <= 24) {
    recencyScore = 10;
    recencyDetails.push(`Aktivitas Terbaru (< 24 Jam Terakhir): +10 pts`);
  } else if (hoursSinceActive <= 72) {
    recencyScore = 6;
    recencyDetails.push(`Aktivitas 3 Hari Terakhir: +6 pts`);
  } else if (hoursSinceActive <= 168) {
    recencyScore = 3;
    recencyDetails.push(`Aktivitas 7 Hari Terakhir: +3 pts`);
  } else {
    recencyScore = 0;
    recencyDetails.push(`Tidak Aktif > 7 Hari: 0 pts`);
  }

  // 5. Remarks FU 1 / History Remarks Analysis
  const remarksText = [
    lead.remarksFu1 || '',
    lead.historyRemarks || '',
    ...(lead.notes || []),
  ].filter(Boolean).join(' ');

  const remarksAnalysis = analyzeRemarks(remarksText);
  const remarksDetails: string[] = [];

  if (remarksText) {
    if (remarksAnalysis.scoreModifier !== 0) {
      remarksDetails.push(`Analisis FU 1 (${remarksAnalysis.category}): ${remarksAnalysis.scoreModifier > 0 ? '+' : ''}${remarksAnalysis.scoreModifier} pts`);
    }
    remarksDetails.push(`Sinyal: ${remarksAnalysis.detectedSignals.join(', ')}`);
  }

  // 6. Behavior Scoring Engine (170 Points Scale)
  const behaviors = extractBehaviorsFromLead(lead);
  const behaviorScoreResult = calculateBehaviorScore(behaviors);
  const behaviorTotalScore = behaviorScoreResult.totalScore; // 0 - 170

  // Calculate Base Raw Score (0 - 100) combining behavior points & omnichannel signals
  let baseScore = 0;
  if (behaviorTotalScore > 0) {
    // Proportional conversion of 170 points scale to 0-100 with engagement bonus
    const behaviorRatioScore = Math.round((behaviorTotalScore / 170) * 85);
    baseScore = behaviorRatioScore + Math.min(cappedDigital / 3, 10) + Math.min(recencyScore / 2, 5);
  } else if (activities.length === 0 && messages.length === 0) {
    if (remarksAnalysis.category === 'VISITED') baseScore = 88;
    else if (remarksAnalysis.category === 'PROSPECT') baseScore = 72;
    else if (remarksAnalysis.category === 'WARM') baseScore = 52;
    else if (remarksAnalysis.category === 'COLD') baseScore = 30;
    else if (remarksAnalysis.category === 'JUNK') baseScore = 10;
  } else {
    baseScore = cappedDigital + cappedOmni + cappedBudget + recencyScore + remarksAnalysis.scoreModifier;
  }

  // Resolve status bonus
  if (lead.resolveStatus === 'RESOLVED') {
    baseScore += 5;
  }

  // Force bounds for JUNK and VISITED
  if (remarksAnalysis.category === 'JUNK') {
    baseScore = Math.min(baseScore, 18);
  }

  const finalTotalScore = Math.min(Math.max(Math.round(baseScore), 0), 100);

  // Determine Exact 5-Tier Category based on Behavior Points (170 Scale) & NLP
  let leadCategory: LeadCategory = remarksAnalysis.category;
  if (remarksAnalysis.category === 'JUNK' || (behaviorTotalScore === 0 && finalTotalScore < 20)) {
    leadCategory = 'JUNK';
  } else if (
    behaviors.closing ||
    behaviorTotalScore >= 90 ||
    behaviors.repeatVisit ||
    (behaviors.datangMGorSite && behaviors.scheduleVisit) ||
    remarksAnalysis.category === 'VISITED' ||
    finalTotalScore >= 85 ||
    lead.stage === 'SITE_VISIT_SCHEDULED' ||
    lead.stage === 'BOOKING_CLOSING'
  ) {
    leadCategory = 'VISITED';
  } else if (
    behaviorTotalScore >= 50 ||
    behaviors.scheduleVisit ||
    behaviors.datangMGorSite ||
    remarksAnalysis.category === 'PROSPECT' ||
    finalTotalScore >= 70 ||
    lead.stage === 'NEGOTIATION'
  ) {
    leadCategory = 'PROSPECT';
  } else if (
    behaviorTotalScore >= 30 ||
    (behaviors.tanyaHarga && behaviors.tanyaPromo) ||
    remarksAnalysis.category === 'WARM' ||
    finalTotalScore >= 45
  ) {
    leadCategory = 'WARM';
  } else {
    leadCategory = 'COLD';
  }

  // Determine Legacy 3-tier Quality
  let qualityTier: LeadQuality = 'COLD';
  if (leadCategory === 'VISITED' || leadCategory === 'PROSPECT' || finalTotalScore >= weights.hotThreshold) {
    qualityTier = 'HOT';
  } else if (leadCategory === 'WARM' || finalTotalScore >= weights.warmThreshold) {
    qualityTier = 'WARM';
  } else {
    qualityTier = 'COLD';
  }

  return {
    digitalEngagement: {
      score: cappedDigital,
      maxScore: 30,
      details: digitalDetails,
    },
    omnichannelVelocity: {
      score: cappedOmni,
      maxScore: 35,
      details: omniDetails,
    },
    budgetAndFit: {
      score: cappedBudget,
      maxScore: 25,
      details: budgetDetails,
    },
    recencyFreshness: {
      score: recencyScore,
      maxScore: 10,
      details: recencyDetails,
    },
    remarksEvaluation: {
      score: remarksAnalysis.scoreModifier,
      scoreModifier: remarksAnalysis.scoreModifier,
      detectedSignals: remarksAnalysis.detectedSignals,
      reason: remarksAnalysis.explanation,
      details: remarksDetails,
    },
    behaviorScore: behaviorScoreResult,
    totalScore: finalTotalScore,
    behaviorTotalScore,
    qualityTier,
    leadCategory,
    categoryTier: leadCategory,
  };
}

/**
 * Visual styling and metadata for each of the 5 categories
 */
export function getCategoryMeta(category: LeadCategory): {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  cardBg: string;
  scoreRange: string;
  description: string;
  recommendedAction: string;
} {
  switch (category) {
    case 'VISITED':
      return {
        label: 'Visited / Ready SPK',
        badgeBg: 'bg-purple-50',
        badgeBorder: 'border-purple-300',
        badgeText: 'text-purple-900',
        dotColor: 'bg-purple-600',
        cardBg: 'bg-purple-50/50',
        scoreRange: '90 - 170 Poin (85 - 100%)',
        description: 'Sudah visit show unit / Marketing Gallery BSD, repeat visit, atau siap closing SPK.',
        recommendedAction: 'Prioritas Utama: Kirimkan draft SPK dan lock nomor unit pilihan.',
      };
    case 'PROSPECT':
      return {
        label: 'Prospect / Negotiation',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-300',
        badgeText: 'text-emerald-900',
        dotColor: 'bg-emerald-600',
        cardBg: 'bg-emerald-50/50',
        scoreRange: '50 - 89 Poin (70 - 84%)',
        description: 'Schedule visit, negosiasi cara bayar, simulasi KPA, dan kesiapan survei lokasi.',
        recommendedAction: 'Telepon konsultasi KPA Bank rekanan & konfirmasi jadwal private visit.',
      };
    case 'WARM':
      return {
        label: 'Warm / Inquiring',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-300',
        badgeText: 'text-amber-900',
        dotColor: 'bg-amber-600',
        cardBg: 'bg-amber-50/50',
        scoreRange: '30 - 49 Poin (45 - 69%)',
        description: 'Responsif menanyakan harga, promo DP cicilan, dan lokasi/spesifikasi unit.',
        recommendedAction: 'Kirimkan e-brochure lengkap & virtual tour 360° via WhatsApp.',
      };
    case 'COLD':
      return {
        label: 'Cold / Outreach',
        badgeBg: 'bg-slate-100',
        badgeBorder: 'border-slate-300',
        badgeText: 'text-slate-700',
        dotColor: 'bg-slate-500',
        cardBg: 'bg-slate-50',
        scoreRange: '10 - 29 Poin (20 - 44%)',
        description: 'Baru kontak tahap awal, baru menanyakan 1 info dasar, atau masih pasif.',
        recommendedAction: 'Jadwalkan pesan broadcast perkenalan promo khusus launching.',
      };
    case 'JUNK':
      return {
        label: 'Junk / Disqualified',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-300',
        badgeText: 'text-rose-900',
        dotColor: 'bg-rose-600',
        cardBg: 'bg-rose-50/40',
        scoreRange: '0 Poin (0 - 19%)',
        description: 'Nomor tidak aktif, salah sambung, batal minat, atau out of budget.',
        recommendedAction: 'Arsipkan lead agar sales fokus pada prospek potensial.',
      };
    default:
      return {
        label: 'Cold / Outreach',
        badgeBg: 'bg-slate-100',
        badgeBorder: 'border-slate-300',
        badgeText: 'text-slate-700',
        dotColor: 'bg-slate-500',
        cardBg: 'bg-slate-50',
        scoreRange: '10 - 29 Poin',
        description: 'Baru kontak tahap awal.',
        recommendedAction: 'Lakukan follow-up awal.',
      };
  }
}

/**
 * Visual styling and metadata for Resolve / Follow Up Status
 */
export function getResolveStatusMeta(status: FollowUpResolveStatus = 'IN_PROGRESS'): {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
} {
  switch (status) {
    case 'FIRST_CONTACT':
      return {
        label: 'First Contact',
        badgeBg: 'bg-cyan-50',
        badgeBorder: 'border-cyan-300',
        badgeText: 'text-cyan-800',
        dotColor: 'bg-cyan-600',
      };
    case 'FOLLOW_UP_CONTACT':
      return {
        label: 'Follow Up Contact',
        badgeBg: 'bg-indigo-50',
        badgeBorder: 'border-indigo-300',
        badgeText: 'text-indigo-800',
        dotColor: 'bg-indigo-600',
      };
    case 'RESOLVED':
      return {
        label: 'Resolved / Solved',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-300',
        badgeText: 'text-emerald-800',
        dotColor: 'bg-emerald-600',
      };
    case 'NEED_FOLLOW_UP':
      return {
        label: 'Need Follow Up',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-300',
        badgeText: 'text-amber-800',
        dotColor: 'bg-amber-600',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        badgeBg: 'bg-blue-50',
        badgeBorder: 'border-blue-300',
        badgeText: 'text-blue-800',
        dotColor: 'bg-blue-600',
      };
    case 'PENDING':
      return {
        label: 'Pending Response',
        badgeBg: 'bg-slate-100',
        badgeBorder: 'border-slate-300',
        badgeText: 'text-slate-700',
        dotColor: 'bg-slate-500',
      };
    case 'ESCALATED':
      return {
        label: 'Escalated to SPV',
        badgeBg: 'bg-purple-50',
        badgeBorder: 'border-purple-300',
        badgeText: 'text-purple-800',
        dotColor: 'bg-purple-600',
      };
    default:
      return {
        label: 'In Progress',
        badgeBg: 'bg-blue-50',
        badgeBorder: 'border-blue-300',
        badgeText: 'text-blue-800',
        dotColor: 'bg-blue-600',
      };
  }
}

/**
 * Visual styling and metadata for SOP Compliance Status
 */
export function getSopStatusMeta(status: SopComplianceStatus = 'SOP_MET'): {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconColor: string;
  isCompliant: boolean;
} {
  switch (status) {
    case 'SOP_MET':
      return {
        label: 'SOP Sesuai (✅)',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-300',
        badgeText: 'text-emerald-800',
        iconColor: 'text-emerald-600',
        isCompliant: true,
      };
    case 'SOP_WARNING':
      return {
        label: 'SOP Warning (⚠️)',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-300',
        badgeText: 'text-amber-800',
        iconColor: 'text-amber-600',
        isCompliant: true,
      };
    case 'SOP_BREACHED':
      return {
        label: 'SOP Tidak Sesuai (❌)',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-300',
        badgeText: 'text-rose-800',
        iconColor: 'text-rose-600',
        isCompliant: false,
      };
    case 'PENDING':
      return {
        label: 'Non-Evaluated / Junk (-)',
        badgeBg: 'bg-slate-100',
        badgeBorder: 'border-slate-300',
        badgeText: 'text-slate-700',
        iconColor: 'text-slate-500',
        isCompliant: false,
      };
    default:
      return {
        label: 'SOP Sesuai (✅)',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-300',
        badgeText: 'text-emerald-800',
        iconColor: 'text-emerald-600',
        isCompliant: true,
      };
  }
}

/**
 * Aggregates leads into executive category summary stats
 */
export function calculateCategorySummary(leads: Lead[]): CategorySummaryStat[] {
  const categories: LeadCategory[] = ['VISITED', 'PROSPECT', 'WARM', 'COLD', 'JUNK'];
  const total = leads.length || 1;

  return categories.map((cat) => {
    const matched = leads.filter((l) => l.category === cat);
    const count = matched.length;
    const percentage = Math.round((count / total) * 100);
    const totalPipelineValue = matched.reduce((acc, l) => acc + (l.budgetEstimated || 0), 0);
    const meta = getCategoryMeta(cat);

    return {
      category: cat,
      label: meta.label,
      count,
      percentage,
      totalPipelineValue,
      colorBg: meta.badgeBg,
      colorBorder: meta.badgeBorder,
      colorText: meta.badgeText,
      description: meta.description,
      recommendedAction: meta.recommendedAction,
    };
  });
}

export function formatRupiah(amount: number, options?: { showDecimals?: boolean; compact?: boolean }): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  
  if (options?.compact) {
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(2).replace(/\.?0+$/, '')} Miliar`;
    }
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(2).replace(/\.?0+$/, '')} Juta`;
    }
  }

  // Default: EXACT FULL DETAILED RUPIAH with thousand dots (e.g. Rp 17.198.274)
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: options?.showDecimals ? 2 : 0,
    maximumFractionDigits: options?.showDecimals ? 2 : 0,
  }).format(amount);

  return `Rp\u00A0${formatted}`;
}

export function formatNumberWithDots(val: number | string): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function parseNumberFromDots(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/\D/g, '');
  return parseInt(clean, 10) || 0;
}

/**
 * Standardize and parse Ad Platform and Campaign / Content Name
 * Ensures consistent output format:
 * - "Instagram - [Nama Content]"
 * - "Google - [Nama Content]"
 * - "Not Detected"
 */
export function parseCampaignSource(source?: string, adSource?: string): {
  platform: string;
  content: string;
  fullName: string;
} {
  const rawSource = (source || '').trim();
  const rawAd = (adSource || '').trim();

  // If already full "Platform - Content"
  if (rawAd.includes(' - ') && !rawAd.toLowerCase().startsWith('meta ads -') && !rawAd.toLowerCase().startsWith('google search ads -')) {
    const parts = rawAd.split(' - ');
    const p = parts[0].trim();
    const c = parts.slice(1).join(' - ').trim();
    const cleanPlatform = p.toLowerCase() === 'instagram' ? 'Instagram' : p.toLowerCase() === 'google' ? 'Google' : p.toLowerCase() === 'tiktok' ? 'TikTok' : p;
    return {
      platform: cleanPlatform,
      content: c,
      fullName: `${cleanPlatform} - ${c}`,
    };
  }

  // Detect platform
  let platform = 'Not Detected';
  const srcLower = rawSource.toLowerCase();
  const adLower = rawAd.toLowerCase();

  if (srcLower.includes('insta') || srcLower.includes('ig') || adLower.includes('instagram') || adLower.includes('ig') || adLower.includes('reels')) {
    platform = 'Instagram';
  } else if (srcLower.includes('google') || srcLower.includes('search') || srcLower.includes('gads') || adLower.includes('google')) {
    platform = 'Google';
  } else if (srcLower.includes('tiktok') || srcLower.includes('tt') || adLower.includes('tiktok')) {
    platform = 'TikTok';
  } else if (srcLower.includes('facebook') || srcLower.includes('meta') || adLower.includes('facebook') || adLower.includes('meta ads')) {
    platform = 'Meta Ads';
  } else if (srcLower === 'not detected' || adLower === 'not detected' || (!rawSource && !rawAd)) {
    platform = 'Not Detected';
  } else if (rawSource) {
    platform = rawSource;
  }

  // Extract content name
  let content = rawAd || rawSource || 'Not Detected';
  if (content.toLowerCase().startsWith('meta ads -')) {
    content = content.replace(/^meta ads -\s*/i, '');
  } else if (content.toLowerCase().startsWith('google search ads -')) {
    content = content.replace(/^google search ads -\s*/i, '');
  } else if (content.toLowerCase().startsWith('tiktok ads -')) {
    content = content.replace(/^tiktok ads -\s*/i, '');
  }

  // If TikTok raw ad is a URL or has raw link
  if (platform === 'TikTok') {
    if (content.includes('tiktok.com') || content.toLowerCase() === 'tiktok' || content.toLowerCase() === 'video') {
      content = 'Video Promo / Show Unit';
    } else if (content.toLowerCase().startsWith('tiktok ')) {
      content = content.replace(/^tiktok\s+/i, '');
    }
  }

  if (platform === 'Not Detected' && (content.toLowerCase() === 'not detected' || !content)) {
    return {
      platform: 'Not Detected',
      content: 'Not Detected',
      fullName: 'Not Detected',
    };
  }

  if (content.toLowerCase() === 'not detected') {
    return {
      platform,
      content: 'Not Detected',
      fullName: platform === 'Not Detected' ? 'Not Detected' : `${platform} - Not Detected`,
    };
  }

  // If content already contains the platform name prefix
  if (content.toLowerCase().startsWith(`${platform.toLowerCase()} -`)) {
    return {
      platform,
      content: content.slice(platform.length + 3).trim(),
      fullName: content,
    };
  }

  const fullName = `${platform} - ${content}`;
  return {
    platform,
    content,
    fullName,
  };
}


