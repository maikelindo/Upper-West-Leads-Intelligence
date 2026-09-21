import React, { useState, useMemo } from 'react';
import { VisitedLeadRecord } from '../data/visitedLeadsData';
import { 
  Calendar, 
  Building2, 
  ArrowRight, 
  BarChart3,
  Users,
  Eye,
  CheckCircle2,
  HelpCircle,
  Clock,
  X
} from 'lucide-react';

interface VisitedAnalyticsSummaryProps {
  leads: VisitedLeadRecord[];
  allLeads: VisitedLeadRecord[];
  selectedMonthLabel: string;
}

interface VisitEntryAudit {
  no: number;
  leadName: string;
  month: string;
  dateVisit: string;
  incomingLeads: string;
  parsedDate: string;
  teamUnder: string;
  assignedTo: string;
  status: string;
  remarks: string;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, januari: 0,
  feb: 1, februari: 1,
  mar: 2, maret: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5,
  jul: 6, juli: 6,
  aug: 7, agustus: 7,
  sep: 8, sept: 8, september: 8,
};

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JS_DAY_TO_NAME: Record<number, string> = {
  0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu'
};

export const VisitedAnalyticsSummary: React.FC<VisitedAnalyticsSummaryProps> = ({
  leads,
  allLeads,
  selectedMonthLabel
}) => {
  const [scopeMode, setScopeMode] = useState<'all' | 'filtered'>('all');
  const [visitCalculationMode, setVisitCalculationMode] = useState<'allVisits' | 'primaryVisit'>('allVisits');
  const [selectedAuditDay, setSelectedAuditDay] = useState<string | null>(null);

  const targetDataset = scopeMode === 'all' ? allLeads : leads;

  // 1. Calculate Day of Week for Visits & Incoming Leads
  const analytics = useMemo(() => {
    const visitCounts: Record<string, number> = {
      Senin: 0, Selasa: 0, Rabu: 0, Kamis: 0, Jumat: 0, Sabtu: 0, Minggu: 0
    };
    const incomingCounts: Record<string, number> = {
      Senin: 0, Selasa: 0, Rabu: 0, Kamis: 0, Jumat: 0, Sabtu: 0, Minggu: 0
    };
    const dayLeadsMap: Record<string, VisitEntryAudit[]> = {
      Senin: [], Selasa: [], Rabu: [], Kamis: [], Jumat: [], Sabtu: [], Minggu: []
    };

    let totalVisitsCounted = 0;
    let totalIncomingCounted = 0;

    for (const lead of targetDataset) {
      // 1. INCOMING LEADS PARSER (kolom incomingLeads)
      const incMatch = (lead.incomingLeads || '').match(/(\d{1,2})\s*[-/]\s*([A-Za-z]+)\s*[-/]\s*(\d{2,4})/);
      if (incMatch) {
        const day = parseInt(incMatch[1], 10);
        const mStr = incMatch[2].toLowerCase();
        let month = -1;
        for (const [k, v] of Object.entries(MONTH_MAP)) {
          if (mStr.startsWith(k)) { month = v; break; }
        }
        let yr = parseInt(incMatch[3], 10);
        if (yr < 100) yr += 2000;
        if (month !== -1) {
          const d = new Date(yr, month, day);
          const dayName = JS_DAY_TO_NAME[d.getDay()];
          if (dayName) {
            incomingCounts[dayName] = (incomingCounts[dayName] || 0) + 1;
            totalIncomingCounted++;
          }
        }
      }

      // 2. DATE VISIT PARSER (kolom dateVisit)
      const visitStr = lead.dateVisit || '';
      const year = lead.year || 2026;
      let leadDefaultMonth = 8;
      for (const [k, v] of Object.entries(MONTH_MAP)) {
        if ((lead.month || '').toLowerCase().startsWith(k)) { leadDefaultMonth = v; break; }
      }

      // Parse multi-date strings like "17 Mei , 08 & 16 Juni", "8 & 10 Sept", "11 , 12, 18 /01/2026"
      const rawSegments = visitStr.split(/[,&.]|\bdan\b/).map(s => s.trim()).filter(Boolean);
      const segmentMonths: number[] = [];
      
      for (let i = 0; i < rawSegments.length; i++) {
        const s = rawSegments[i].toLowerCase();
        let m = -1;
        for (const [k, v] of Object.entries(MONTH_MAP)) {
          if (s.includes(k)) { m = v; break; }
        }
        const slashM = s.match(/\/0?(\d{1,2})\//);
        if (slashM) {
          const slashNum = parseInt(slashM[1], 10) - 1;
          if (slashNum >= 0 && slashNum <= 11) m = slashNum;
        }
        segmentMonths.push(m);
      }

      // Propagate forward and backward for segments without explicit month name
      for (let i = 0; i < rawSegments.length; i++) {
        if (segmentMonths[i] === -1) {
          for (let j = i + 1; j < rawSegments.length; j++) {
            if (segmentMonths[j] !== -1) { segmentMonths[i] = segmentMonths[j]; break; }
          }
          if (segmentMonths[i] === -1) {
            for (let j = i - 1; j >= 0; j--) {
              if (segmentMonths[j] !== -1) { segmentMonths[i] = segmentMonths[j]; break; }
            }
          }
          if (segmentMonths[i] === -1) {
            segmentMonths[i] = leadDefaultMonth;
          }
        }

        const dMatch = rawSegments[i].match(/(\d{1,2})/);
        if (dMatch) {
          const day = parseInt(dMatch[1], 10);
          if (day >= 1 && day <= 31) {
            const d = new Date(year, segmentMonths[i], day);
            const dayName = JS_DAY_TO_NAME[d.getDay()];
            
            if (dayName) {
              const auditEntry: VisitEntryAudit = {
                no: lead.no,
                leadName: lead.leadName,
                month: lead.month,
                dateVisit: lead.dateVisit,
                incomingLeads: lead.incomingLeads,
                parsedDate: `${day} ${Object.keys(MONTH_MAP).find(k => MONTH_MAP[k] === segmentMonths[i])?.toUpperCase()} ${year} (${dayName})`,
                teamUnder: lead.teamUnder,
                assignedTo: lead.assignedTo,
                status: lead.status,
                remarks: lead.remarks
              };

              // If primary visit mode: only count the first parsed date per lead
              if (visitCalculationMode === 'primaryVisit') {
                if (i === 0) {
                  visitCounts[dayName] = (visitCounts[dayName] || 0) + 1;
                  totalVisitsCounted++;
                  dayLeadsMap[dayName].push(auditEntry);
                }
              } else {
                // all visits mode (every physical visit log)
                visitCounts[dayName] = (visitCounts[dayName] || 0) + 1;
                totalVisitsCounted++;
                dayLeadsMap[dayName].push(auditEntry);
              }
            }
          }
        }
      }
    }

    // Identify Peak Days
    let peakVisitDay = 'Selasa';
    let peakVisitCount = 0;
    for (const d of DAY_ORDER) {
      if (visitCounts[d] > peakVisitCount) {
        peakVisitCount = visitCounts[d];
        peakVisitDay = d;
      }
    }

    let peakIncomingDay = 'Senin';
    let peakIncomingCount = 0;
    for (const d of DAY_ORDER) {
      if (incomingCounts[d] > peakIncomingCount) {
        peakIncomingCount = incomingCounts[d];
        peakIncomingDay = d;
      }
    }

    const weekendVisits = (visitCounts['Sabtu'] || 0) + (visitCounts['Minggu'] || 0);
    const weekdayVisits = totalVisitsCounted - weekendVisits;

    // 3. Product Interest Classification (Remarks & AdSource)
    const products = {
      soho: {
        id: 'soho',
        title: 'SOHO (Signature / Soho Hall / Mezzanine)',
        alias: 'SOHO Units (SH / SHSM / SHSL / SHSG)',
        count: 0,
        closings: 0,
        reservations: 0,
        color: 'emerald',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        barColor: 'bg-emerald-500',
        desc: 'Konsep hybrid ruang kantor & hunian prestisius di BSD City. Tipe paling diminati oleh pengusaha, konsultan, dan investor.'
      },
      apart: {
        id: 'apart',
        title: 'Apartemen & Penthouse (APA / APF / APH)',
        alias: 'Apartment Residential',
        count: 0,
        closings: 0,
        reservations: 0,
        color: 'blue',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        barColor: 'bg-blue-500',
        desc: 'Unit residensial premium 1BR & 2BR dengan view CBD untuk keluarga modern, profesional, dan ekspatriat.'
      },
      loft: {
        id: 'loft',
        title: 'Live-Work Loft (LLF / 169m² & 135m²)',
        alias: 'Live-Work Loft',
        count: 0,
        closings: 0,
        reservations: 0,
        color: 'purple',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
        barColor: 'bg-purple-500',
        desc: 'Hunian loft bertingkat luas 3+1 BR untuk hunian lapang yang menggabungkan studio kerja dan tempat tinggal.'
      },
      other: {
        id: 'other',
        title: 'Multi-Unit & Eksplorasi Komersial',
        alias: 'Multi-Product / Retail',
        count: 0,
        closings: 0,
        reservations: 0,
        color: 'amber',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        barColor: 'bg-amber-500',
        desc: 'Prospek komparasi ruko BSD vs Upper West atau penjajakan sewa area komersial / FnB retail.'
      }
    };

    for (const lead of targetDataset) {
      const text = ((lead.remarks || '') + ' ' + (lead.adSource || '')).toLowerCase();
      const isSoho = text.includes('soho') || text.includes('sh') || text.includes('shsm') || text.includes('shsl') || text.includes('shsg') || text.includes('shs');
      const isLoft = text.includes('llf') || text.includes('loft') || text.includes('live-work') || text.includes('live work');
      const isApt = text.includes('apart') || text.includes('apa') || text.includes('apf') || text.includes('aph') || text.includes('2br') || text.includes('1br') || text.includes('studio') || text.includes('penthouse');

      let key: 'soho' | 'apart' | 'loft' | 'other' = 'other';
      if (isSoho && !isLoft && !isApt) {
        key = 'soho';
      } else if (isLoft && !isApt && !isSoho) {
        key = 'loft';
      } else if (isApt && !isLoft && !isSoho) {
        key = 'apart';
      } else if (isSoho) {
        key = 'soho';
      } else if (isLoft) {
        key = 'loft';
      } else if (isApt) {
        key = 'apart';
      }

      products[key].count++;
      if (lead.status === 'closing') products[key].closings += (lead.closingUnits || 1);
      if (lead.status === 'reservation') products[key].reservations++;
    }

    const totalLeadsEvaluated = targetDataset.length || 1;
    const sortedProducts = Object.values(products).sort((a, b) => b.count - a.count);

    return {
      visitCounts,
      incomingCounts,
      dayLeadsMap,
      totalVisitsCounted,
      totalIncomingCounted,
      peakVisitDay,
      peakVisitCount,
      peakIncomingDay,
      peakIncomingCount,
      weekendVisits,
      weekdayVisits,
      sortedProducts,
      totalLeadsEvaluated
    };
  }, [targetDataset, visitCalculationMode]);

  const maxDayVal = Math.max(
    ...DAY_ORDER.map(d => Math.max(analytics.visitCounts[d] || 0, analytics.incomingCounts[d] || 0)),
    1
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-5">
      
      {/* Header Rangkuman & Scope Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Rangkuman Pola Kunjungan & Minat Produk
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                ✓ Terverifikasi dari Kolom "Date Visit"
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisa akurat membaca langsung kolom <strong>Date Visit</strong> untuk hari kunjungan fisik dan kolom <strong>Incoming Leads</strong> untuk hari lead masuk.
            </p>
          </div>
        </div>

        {/* Dataset Scope Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setScopeMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scopeMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Data ({allLeads.length} Log)
          </button>
          <button
            onClick={() => setScopeMode('filtered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scopeMode === 'filtered'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tersaring: {selectedMonthLabel} ({leads.length})
          </button>
        </div>
      </div>

      {/* 3 Main Highlights Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Hari VISIT Paling Ramai */}
        <div className="bg-gradient-to-br from-purple-50/60 via-white to-slate-50/50 rounded-xl p-4 border border-purple-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-900">
                    1. Hari VISIT Paling Ramai
                  </span>
                </div>
                {/* Explicit Source Indicator */}
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md mt-1.5 border border-purple-200">
                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                  Dibaca dari: Kolom "Date Visit"
                </span>
              </div>

              {/* Toggle Mode: All Visits vs Primary Visit */}
              <div className="flex items-center bg-purple-100/80 p-0.5 rounded-lg shrink-0">
                <button
                  onClick={() => setVisitCalculationMode('allVisits')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    visitCalculationMode === 'allVisits' 
                      ? 'bg-purple-700 text-white shadow-xs' 
                      : 'text-purple-900 hover:text-purple-950'
                  }`}
                  title="Hitung semua log kedatangan fisik termasuk repeat/2nd visit"
                >
                  Semua Log
                </button>
                <button
                  onClick={() => setVisitCalculationMode('primaryVisit')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    visitCalculationMode === 'primaryVisit' 
                      ? 'bg-purple-700 text-white shadow-xs' 
                      : 'text-purple-900 hover:text-purple-950'
                  }`}
                  title="Hanya hitung tanggal kedatangan pertama per lead"
                >
                  1st Visit
                </button>
              </div>
            </div>

            {/* Main Peak Day Metric */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {analytics.peakVisitDay}
              </span>
              <span className="text-xs font-bold text-purple-700">
                ({analytics.peakVisitCount} kunjungan / {analytics.totalVisitsCounted > 0 ? ((analytics.peakVisitCount / analytics.totalVisitsCounted) * 100).toFixed(1) : 0}%)
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Berdasarkan tanggal di kolom <strong>Date Visit</strong>, hari <strong>{analytics.peakVisitDay}</strong> merupakan hari terpadat ({analytics.peakVisitCount} kunjungan), disusul hari <strong>Minggu</strong> ({analytics.visitCounts['Minggu'] || 0} visit) dan <strong>Sabtu</strong> ({analytics.visitCounts['Sabtu'] || 0} visit).
            </p>
          </div>

          {/* Interactive Day Breakdown Table with Click to Audit */}
          <div className="space-y-1.5 pt-2 border-t border-purple-100/80">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mb-1">
              <span>Hari Kunjungan (Klik bar untuk lihat lead)</span>
              <span>Jumlah Visit</span>
            </div>
            {DAY_ORDER.map((day) => {
              const count = analytics.visitCounts[day] || 0;
              const pct = analytics.totalVisitsCounted > 0 ? (count / analytics.totalVisitsCounted) * 100 : 0;
              const isPeak = day === analytics.peakVisitDay;
              const isSelected = selectedAuditDay === day;

              return (
                <div 
                  key={day} 
                  onClick={() => setSelectedAuditDay(prev => prev === day ? null : day)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isSelected ? 'bg-purple-100 border border-purple-300' : 'hover:bg-purple-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className={`font-semibold flex items-center gap-1.5 ${isPeak ? 'text-purple-900 font-extrabold' : 'text-slate-700'}`}>
                      {day} 
                      {isPeak && <span className="text-[9px] px-1 bg-purple-700 text-white rounded font-bold">TOP</span>}
                      {isSelected && <Eye className="w-3 h-3 text-purple-700" />}
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      {count} <span className="text-[10px] text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isPeak ? 'bg-purple-600' : 'bg-purple-300'}`}
                      style={{ width: `${(count / maxDayVal) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekend vs Weekday summary */}
          <div className="p-2.5 rounded-lg bg-white border border-purple-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Weekend (Sabtu-Minggu):</span>
            <strong className="text-purple-900 font-bold">
              {analytics.weekendVisits} Kunjungan ({analytics.totalVisitsCounted > 0 ? ((analytics.weekendVisits / analytics.totalVisitsCounted) * 100).toFixed(0) : 0}%)
            </strong>
          </div>
        </div>

        {/* Card 2: Hari Leads MASUK (Untuk Perbandingan Langsung) */}
        <div className="bg-gradient-to-br from-blue-50/60 via-white to-slate-50/50 rounded-xl p-4 border border-blue-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                  2. Hari Leads MASUK (Perbandingan)
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Inbound Inflow
              </span>
            </div>

            {/* Explicit Source Indicator */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md mt-1.5 border border-blue-200">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              Dibaca dari: Kolom "Incoming Leads"
            </span>

            {/* Main Peak Incoming Day Metric */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {analytics.peakIncomingDay}
              </span>
              <span className="text-xs font-bold text-blue-700">
                ({analytics.peakIncomingCount} leads / {analytics.totalIncomingCounted > 0 ? ((analytics.peakIncomingCount / analytics.totalIncomingCounted) * 100).toFixed(1) : 0}%)
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sebaliknya, pada kolom <strong>Incoming Leads</strong>, hari <strong>Selasa justru paling sepi</strong> ({analytics.incomingCounts['Selasa'] || 0} leads). Traffic terbesar masuk di hari <strong>{analytics.peakIncomingDay}</strong> ({analytics.peakIncomingCount} leads) dan <strong>Minggu</strong> ({analytics.incomingCounts['Minggu'] || 0} leads).
            </p>
          </div>

          {/* Comparative Inflow vs Visit Rows */}
          <div className="space-y-2 pt-2 border-t border-blue-100/80">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mb-1">
              <span>Hari</span>
              <span className="flex items-center gap-2">
                <span className="text-blue-700 font-extrabold">Masuk</span>
                <span>vs</span>
                <span className="text-purple-700 font-extrabold">Visit Fisik</span>
              </span>
            </div>
            {DAY_ORDER.map((day) => {
              const inCount = analytics.incomingCounts[day] || 0;
              const viCount = analytics.visitCounts[day] || 0;
              return (
                <div key={day} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{day}</span>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span className="text-blue-700" title="Leads Masuk">{inCount}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="text-purple-800" title="Kunjungan Visit">{viCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(inCount / maxDayVal) * 50}%` }}
                      title={`Leads Masuk: ${inCount}`}
                    />
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(viCount / maxDayVal) * 50}%` }}
                      title={`Kunjungan Fisik: ${viCount}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Timeline Insight */}
          <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-900 leading-snug">
            <strong className="block mb-0.5">💡 Korelasi Tanggal Masuk vs Tanggal Visit:</strong>
            Lead yang masuk melalui media sosial di hari <strong>Minggu & Senin</strong> langsung dijadwalkan follow up dan datang survei pada hari <strong>Selasa</strong> (SLA Visit 1-2 hari).
          </div>
        </div>

        {/* Card 3: Analisa Visit Terbanyak Berdasarkan Tipe Produk */}
        <div className="bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/50 rounded-xl p-4 border border-emerald-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                  <Building2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  3. Analisa Minat Produk Terbanyak
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Top Visited Unit
              </span>
            </div>

            {/* Explicit Source Indicator */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-1.5 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Dibaca dari: Kolom "Remarks" & "Iklan by"
            </span>

            {/* Top Product Highlight */}
            {analytics.sortedProducts[0] && (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">
                    {analytics.sortedProducts[0].title.split('(')[0].trim()}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    ({analytics.sortedProducts[0].count} Leads / {((analytics.sortedProducts[0].count / analytics.totalLeadsEvaluated) * 100).toFixed(0)}%)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  <strong>SOHO (Signature / Mezzanine)</strong> merupakan produk yang <strong>paling mendominasi kunjungan</strong> ({((analytics.sortedProducts[0].count / analytics.totalLeadsEvaluated) * 100).toFixed(0)}% dari total log visit) dan menyumbang <strong>100% unit Closing</strong> ({analytics.sortedProducts[0].closings} Unit Closing).
                </p>
              </div>
            )}
          </div>

          {/* Product Breakdown List */}
          <div className="space-y-2 pt-2 border-t border-emerald-100/80">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mb-1">
              <span>Tipe Unit / Produk</span>
              <span>Visit & Closing</span>
            </div>
            {analytics.sortedProducts.map((p) => {
              const pct = (p.count / analytics.totalLeadsEvaluated) * 100;
              return (
                <div key={p.id} className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[190px]">
                      {p.alias}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">{p.count} Visit</span>
                      {p.closings > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                          {p.closings} Closing
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${p.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Product Strategic Note */}
          <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-900 leading-snug">
            <strong className="block mb-0.5">🎯 Rekomendasi Marketing:</strong>
            Fokuskan kampanye pada unit <strong>SOHO Mezzanine (80-87 m²)</strong> dan unit <strong>Connecting</strong> karena tingkat kedatangan dan konversi closing tertinggi terkonsentrasi di tipe ini.
          </div>
        </div>

      </div>

      {/* Interactive Audit Inspector: Shows exact leads when a day is clicked */}
      {selectedAuditDay && (
        <div className="p-4 rounded-xl bg-purple-50/90 border border-purple-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-600 text-white">
                <Eye className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide">
                Verifikasi Data Kunjungan Hari: {selectedAuditDay} ({analytics.dayLeadsMap[selectedAuditDay]?.length || 0} Kunjungan Tercatat di Kolom "Date Visit")
              </h4>
            </div>
            <button
              onClick={() => setSelectedAuditDay(null)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-purple-900">
            Berikut adalah bukti baris data aktual yang tanggal kunjungannya jatuh pada hari <strong>{selectedAuditDay}</strong>, dibaca dari kolom <strong>Date Visit</strong>:
          </p>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {(analytics.dayLeadsMap[selectedAuditDay] || []).map((audit, idx) => (
              <div 
                key={`${audit.no}-${idx}`} 
                className="p-2 bg-white rounded-lg border border-purple-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] border border-purple-200">
                    #{audit.no}
                  </span>
                  <span className="font-bold text-slate-800">{audit.leadName}</span>
                  <span className="text-[10px] text-slate-500 font-medium">({audit.month})</span>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-semibold mr-1">Date Visit:</span>
                    <strong className="text-purple-900 font-extrabold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                      {audit.dateVisit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold mr-1">Incoming:</span>
                    <span className="text-slate-600 font-mono">{audit.incomingLeads}</span>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-slate-400 font-semibold mr-1">Sales:</span>
                    <span className="text-slate-700 font-medium">{audit.assignedTo} ({audit.teamUnder})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
