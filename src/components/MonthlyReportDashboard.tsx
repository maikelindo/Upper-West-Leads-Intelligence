import React, { useState, useMemo, useEffect } from 'react';
import { Lead, SalesAgent } from '../types';
import { 
  getSavedWeeklyAdCosts, 
  saveWeeklyAdCost, 
  WeekAdCostConfig 
} from '../services/adSpendService';
import { 
  AUGUST_2026_WEEKS,
  getWeeksForMonth, 
  filterLeadsByWeek 
} from '../utils/dateUtils';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Layers, 
  Flame, 
  Clock, 
  Sparkles,
  Calculator,
  ChevronRight,
  ArrowRight,
  TrendingDown,
  Info,
  Building2
} from 'lucide-react';
import { 
  formatRupiah,
  formatNumberWithDots,
  parseNumberFromDots
} from '../services/leadScoring';
import { generateMonthlyReportPdf } from '../utils/exportToPdf';
import { DetailedDateRangePicker } from './DetailedDateRangePicker';

interface MonthlyReportDashboardProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead?: (lead: Lead) => void;
}

export const MonthlyReportDashboard: React.FC<MonthlyReportDashboardProps> = ({
  leads,
  salesAgents,
  onSelectLead,
}) => {
  // Available Months
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add('2026-09');
    monthSet.add('2026-08');
    monthSet.add('2026-07');

    leads.forEach((l) => {
      if (l.dateContact) {
        const parts = l.dateContact.split('-');
        if (parts.length >= 3) {
          const monthStr = parts[1]?.toLowerCase();
          const yearStr = parts[2]?.slice(0, 2);
          const monthMap: Record<string, string> = {
            jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
            jun: '06', jul: '07', agt: '08', aug: '08', sep: '09', okt: '10', oct: '10',
            nov: '11', des: '12', dec: '12'
          };
          const mNum = monthMap[monthStr] || '08';
          const yNum = yearStr ? `20${yearStr}` : '2026';
          monthSet.add(`${yNum}-${mNum}`);
        }
      }
    }
    );

    return Array.from(monthSet).sort().reverse();
  }, [leads]);

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [selectedWeekId, setSelectedWeekId] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-30');

  // Weeks for selected month
  const activeWeeksList = useMemo(() => {
    return getWeeksForMonth(selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setSelectedWeekId('ALL');
    if (newMonth === '2026-07') {
      setCustomStartDate('2026-07-01');
      setCustomEndDate('2026-07-31');
    } else if (newMonth === '2026-08') {
      setCustomStartDate('2026-08-01');
      setCustomEndDate('2026-08-31');
    } else if (newMonth === '2026-09') {
      setCustomStartDate('2026-09-01');
      setCustomEndDate('2026-09-30');
    } else if (newMonth === 'ALL') {
      setCustomStartDate('2026-07-01');
      setCustomEndDate('2026-09-30');
    }
  };

  const handleDateRangeApply = (start: string, end: string, isAll?: boolean) => {
    if (isAll) {
      setSelectedMonth('ALL');
      setSelectedWeekId('ALL');
      setCustomStartDate('2026-07-01');
      setCustomEndDate('2026-09-30');
    } else {
      const s = start <= end ? start : end;
      const e = start <= end ? end : start;
      setSelectedWeekId('CUSTOM');
      setCustomStartDate(s);
      setCustomEndDate(e);

      const startM = s.slice(0, 7);
      const endM = e.slice(0, 7);
      if (startM === endM) {
        setSelectedMonth(startM);
      } else {
        setSelectedMonth('ALL');
      }
    }
  };

  // Shared weekly ad costs for selected month
  const [weeklyAdCosts, setWeeklyAdCosts] = useState<WeekAdCostConfig>(() => getSavedWeeklyAdCosts(selectedMonth));

  // Reload weekly ad costs whenever selectedMonth changes
  useEffect(() => {
    setWeeklyAdCosts(getSavedWeeklyAdCosts(selectedMonth));
  }, [selectedMonth]);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setWeeklyAdCosts(getSavedWeeklyAdCosts(selectedMonth));
    };
    window.addEventListener('upperwest_ad_costs_updated', handleStorageUpdate);
    window.addEventListener('upperwest_campaign_costs_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('upperwest_ad_costs_updated', handleStorageUpdate);
      window.removeEventListener('upperwest_campaign_costs_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [selectedMonth]);

  const handleUpdateCost = (weekId: string, newCost: number) => {
    const updated = saveWeeklyAdCost(weekId, newCost, selectedMonth);
    setWeeklyAdCosts(updated);
  };

  // Month label helper
  const getMonthLabel = (mKey: string) => {
    if (mKey === 'ALL') return 'Semua Bulan (Overall All-Time)';
    const [year, month] = mKey.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || 'Bulan'} ${year}`;
  };

  // Leads for the selected month (used for the weekly breakdown rows)
  const monthLeads = useMemo(() => {
    return filterLeadsByWeek(leads, 'ALL', undefined, undefined, selectedMonth);
  }, [leads, selectedMonth]);

  // Leads for the selected week filter within the month
  const filteredLeads = useMemo(() => {
    return filterLeadsByWeek(leads, selectedWeekId, customStartDate, customEndDate, selectedMonth);
  }, [leads, selectedWeekId, customStartDate, customEndDate, selectedMonth]);

  // Current active week object
  const currentWeekMeta = useMemo(() => {
    if (selectedWeekId === 'CUSTOM') {
      return {
        id: 'CUSTOM',
        label: `Kustom: ${customStartDate} s/d ${customEndDate}`,
        shortLabel: 'Kustom',
        displayRange: `${customStartDate} s/d ${customEndDate}`,
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }
    const found = activeWeeksList.find((w) => w.id === selectedWeekId);
    return found || activeWeeksList[0] || AUGUST_2026_WEEKS[0];
  }, [selectedWeekId, customStartDate, customEndDate, activeWeeksList]);

  // Classification Metrics for Monthly Waterfall
  const totalLeads = filteredLeads.length;
  const junkLeads = filteredLeads.filter((l) => l.category === 'JUNK');
  const junkCount = junkLeads.length;
  const qualifiedLeads = filteredLeads.filter((l) => l.category !== 'JUNK');
  const qualifiedLeadsCount = qualifiedLeads.length;

  const coldLeads = qualifiedLeads.filter((l) => l.category === 'COLD');
  const warmLeads = qualifiedLeads.filter((l) => l.category === 'WARM');
  const prospectLeads = qualifiedLeads.filter((l) => l.category === 'PROSPECT');
  const visitedLeads = qualifiedLeads.filter((l) => l.category === 'VISITED');

  const coldCount = coldLeads.length;
  const warmCount = warmLeads.length;
  const prospectCount = prospectLeads.length;
  const visitedCount = visitedLeads.length;

  const junkPctTotal = totalLeads > 0 ? ((junkCount / totalLeads) * 100).toFixed(1) : '0';
  const qualifiedPctTotal = totalLeads > 0 ? ((qualifiedLeadsCount / totalLeads) * 100).toFixed(1) : '0';

  const coldPctQualified = qualifiedLeadsCount > 0 ? ((coldCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';
  const warmPctQualified = qualifiedLeadsCount > 0 ? ((warmCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';
  const prospectPctQualified = qualifiedLeadsCount > 0 ? ((prospectCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';
  const visitedPctQualified = qualifiedLeadsCount > 0 ? ((visitedCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';

  // SLA & Pipeline
  const slaMetCount = filteredLeads.filter((l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes <= 2).length;
  const slaCompliancePct = totalLeads > 0 ? Math.round((slaMetCount / totalLeads) * 100) : 0;
  const totalPipeline = filteredLeads.reduce((sum, l) => sum + (l.budgetEstimated || 0), 0);

  // Weekly Rows Breakdown for selected month (calculated from all leads of that month)
  const weeklyBreakdownRows = useMemo(() => {
    const weeksList = getWeeksForMonth(selectedMonth);
    return weeksList.filter((w) => w.id !== 'ALL').map((week) => {
      const wLeads = filterLeadsByWeek(monthLeads, week.id, undefined, undefined, selectedMonth);
      const wTotal = wLeads.length;
      const wJunk = wLeads.filter((l) => l.category === 'JUNK').length;
      const wQualified = wTotal - wJunk;
      const wVisited = wLeads.filter((l) => l.category === 'VISITED').length;
      const wCost = weeklyAdCosts[week.id] || 0;

      const wCpl = wTotal > 0 && wCost > 0 ? Math.round(wCost / wTotal) : (wCost === 0 ? 0 : 0);
      const wCpql = wQualified > 0 && wCost > 0 ? Math.round(wCost / wQualified) : 0;
      const wCostVisited = wVisited > 0 && wCost > 0 ? Math.round(wCost / wVisited) : 0;

      return {
        ...week,
        cost: wCost,
        totalLeads: wTotal,
        junkCount: wJunk,
        qualifiedCount: wQualified,
        visitedCount: wVisited,
        cpl: wCpl,
        cpql: wCpql,
        costVisited: wCostVisited,
      };
    });
  }, [monthLeads, weeklyAdCosts, selectedMonth]);

  // Overall Month Totals
  const totalMonthCost = weeklyBreakdownRows.reduce((sum, r) => sum + r.cost, 0);
  const totalMonthLeads = weeklyBreakdownRows.reduce((sum, r) => sum + r.totalLeads, 0);
  const totalMonthJunk = weeklyBreakdownRows.reduce((sum, r) => sum + r.junkCount, 0);
  const totalMonthQualified = weeklyBreakdownRows.reduce((sum, r) => sum + r.qualifiedCount, 0);
  const totalMonthVisited = weeklyBreakdownRows.reduce((sum, r) => sum + r.visitedCount, 0);

  const overallMonthCpl = totalMonthLeads > 0 && totalMonthCost > 0 ? Math.round(totalMonthCost / totalMonthLeads) : 0;
  const overallMonthCpql = totalMonthQualified > 0 && totalMonthCost > 0 ? Math.round(totalMonthCost / totalMonthQualified) : 0;
  const overallMonthCostVisited = totalMonthVisited > 0 && totalMonthCost > 0 ? Math.round(totalMonthCost / totalMonthVisited) : 0;

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Header with Month and Week Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-400">
                REPORT MONTHLY
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Laporan Akumulasi Bulanan &amp; Overall Performance
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Report Monthly — {getMonthLabel(selectedMonth)}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis keseluruhan performa inbound leads, rincian biaya iklan per minggu, CPL, dan kepatuhan SLA.
            </p>
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export PDF Button */}
            <button
              onClick={() => generateMonthlyReportPdf({
                monthLabel: getMonthLabel(selectedMonth),
                totalMonthCost,
                totalMonthLeads,
                totalMonthQualified,
                totalMonthJunk,
                coldCount,
                warmCount,
                prospectCount,
                visitedCount,
                overallCpl: overallMonthCpl,
                overallCpql: overallMonthCpql,
                overallCostVisited: overallMonthCostVisited,
                slaCompliancePct,
                slaMetCount,
                weeklyBreakdown: weeklyBreakdownRows.map((r) => ({
                  shortLabel: r.shortLabel,
                  displayRange: r.displayRange,
                  cost: r.cost,
                  totalLeads: r.totalLeads,
                  junkCount: r.junkCount,
                  qualifiedCount: r.qualifiedCount,
                  visitedCount: r.visitedCount,
                  cpl: r.cpl,
                  cpql: r.cpql,
                  costVisited: r.costVisited,
                })),
                leads: filteredLeads,
              })}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Detailed Date Range Picker Bar within Monthly Report */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Filter Tanggal:</span>
            </span>

            {/* Detailed Calendar Date Range Picker matching user's exact specification */}
            <DetailedDateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              isAllTime={selectedMonth === 'ALL' && selectedWeekId === 'ALL'}
              currentMonthHint={selectedMonth !== 'ALL' ? selectedMonth : '2026-09'}
              onApply={handleDateRangeApply}
            />
          </div>

          {/* Active Period Info */}
          <div className="text-xs text-amber-900 font-mono flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/80 px-2.5 py-1.5 rounded-lg shrink-0">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Periode: <strong>{selectedMonth === 'ALL' && selectedWeekId === 'ALL' ? 'Semua Data' : `${customStartDate} s/d ${customEndDate}`}</strong></span>
            <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[11px] font-bold">
              {totalLeads} Leads
            </span>
          </div>
        </div>
      </div>

      {/* RUMUSAN PENILAIAN BULANAN (WATERFALL CLASSIFICATION - CLEAN WHITE THEME) */}
      <div className="bg-white text-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              RUMUSAN PENILAIAN BULANAN
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              Total Inbound ({totalLeads}) dikurangi Junk ({junkCount}) = {qualifiedLeadsCount} Qualified Leads
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SLA Target Respon: &lt; 2 Menit ({slaCompliancePct}% Tercapai)
            </span>
          </div>
        </div>

        {/* 3 Step Waterfall Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">1. Total Leads Masuk</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalLeads} <span className="text-xs font-normal text-slate-500">Leads (100%)</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Akumulasi Seluruh Inbound Terdata</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-rose-800 uppercase block">2. (-) Junk / Non-Prospek</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {junkCount} <span className="text-xs font-normal text-rose-700">Leads ({junkPctTotal}%)</span>
            </div>
            <span className="text-[10px] text-rose-600/80 block mt-1">Sewa, Strangers, Overbudget, Jualan</span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3.5 ring-1 ring-emerald-400">
            <span className="text-[11px] font-bold text-emerald-900 uppercase block">3. (=) Qualified Leads (Valid)</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {qualifiedLeadsCount} <span className="text-xs font-normal text-emerald-800">Leads ({qualifiedPctTotal}%)</span>
            </div>
            <span className="text-[10px] text-emerald-800 block mt-1">Basis Pembagi Kategori Cold, Warm, Visited</span>
          </div>
        </div>

        {/* Breakdown of Qualified Leads */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Cold Leads</span>
            <div className="text-base font-black text-slate-800 mt-0.5">
              {coldCount} <span className="text-xs text-slate-500">({coldPctQualified}%)</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>

          <div className="bg-amber-50/80 rounded-lg p-2.5 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Warm Leads</span>
            <div className="text-base font-black text-amber-700 mt-0.5">
              {warmCount} <span className="text-xs text-amber-800">({warmPctQualified}%)</span>
            </div>
            <span className="text-[9px] text-amber-800/80 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>

          <div className="bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Prospect Leads</span>
            <div className="text-base font-black text-emerald-700 mt-0.5">
              {prospectCount} <span className="text-xs text-emerald-800">({prospectPctQualified}%)</span>
            </div>
            <span className="text-[9px] text-emerald-800/80 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>

          <div className="bg-purple-50/80 rounded-lg p-2.5 border border-purple-200">
            <span className="text-[10px] uppercase font-bold text-purple-800 block">Visited / Show Unit</span>
            <div className="text-base font-black text-purple-700 mt-0.5">
              {visitedCount} <span className="text-xs text-purple-800">({visitedPctQualified}%)</span>
            </div>
            <span className="text-[9px] text-purple-800/80 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>
        </div>
      </div>

      {/* TABEL RINCIAN BIAYA IKLAN & CPL MINGGUAN & OVERALL (LAMPIRAN 1 DESIGN) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span>Tabel Rincian Biaya Iklan &amp; CPL Mingguan &amp; Akumulasi Bulan (Bisa Diedit)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit nominal biaya iklan per minggu secara langsung di tabel. Nilai total akumulasi dan CPL/CPQL bulanan akan terhitung otomatis dan tersinkronisasi ke Report Weekly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              Total Budget Iklan: <span className="font-black text-amber-900">{formatRupiah(totalMonthCost)}</span>
            </span>
          </div>
        </div>

        <div className="w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3">SIKLUS &amp; PERIODE</th>
                <th className="py-2.5 px-2.5 min-w-[130px]">BIAYA IKLAN (IDR)</th>
                <th className="py-2.5 px-2 text-center">TOTAL LEADS</th>
                <th className="py-2.5 px-2 text-center">JUNK</th>
                <th className="py-2.5 px-2 text-center">QUALIFIED</th>
                <th className="py-2.5 px-2 text-center">CPL (GROSS)</th>
                <th className="py-2.5 px-2 text-center">CPQL (QUALIFIED)</th>
                <th className="py-2.5 px-2 text-center">COST / VISITED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weeklyBreakdownRows.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-black text-slate-900 text-xs">
                      {row.shortLabel}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {row.displayRange.replace(/\s*\([^)]*\)/g, '')}
                    </div>
                  </td>
                  <td className="py-2.5 px-2.5">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 w-32 sm:w-36 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white focus-within:border-amber-400 transition-all">
                      <span className="text-[11px] font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithDots(row.cost)}
                        onChange={(e) => handleUpdateCost(row.id, parseNumberFromDots(e.target.value))}
                        className="w-full text-xs font-black text-slate-900 bg-transparent focus:outline-hidden"
                        placeholder="0"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-slate-900 text-sm">
                    {row.totalLeads}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-rose-600 text-sm">
                    {row.junkCount}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-emerald-600 text-sm">
                    {row.qualifiedCount}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-amber-800 text-xs sm:text-sm font-mono">
                    {row.totalLeads > 0 && row.cost > 0 ? formatRupiah(row.cpl) : (row.cost === 0 ? 'Rp 0' : '-')}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-emerald-700 text-xs sm:text-sm font-mono">
                    {row.qualifiedCount > 0 && row.cost > 0 ? formatRupiah(row.cpql) : (row.cost === 0 ? 'Rp 0' : '-')}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-purple-700 text-xs sm:text-sm font-mono">
                    {row.visitedCount > 0 && row.cost > 0 ? formatRupiah(row.costVisited) : (row.cost === 0 && row.visitedCount > 0 ? 'Rp 0' : '-')}
                  </td>
                </tr>
              ))}

              {/* OVERALL TOTAL ACCUMULATION ROW (LIGHT STYLED) */}
              <tr className="bg-amber-50/80 text-slate-900 font-bold border-t-2 border-amber-400">
                <td className="py-3 px-3 font-black uppercase text-xs tracking-wider text-amber-900">
                  TOTAL AKUMULASI {getMonthLabel(selectedMonth).toUpperCase()}
                </td>
                <td className="py-3 px-2.5 font-black text-xs sm:text-sm text-amber-950 font-mono">
                  {formatRupiah(totalMonthCost)}
                </td>
                <td className="py-3 px-2 text-center font-black text-sm text-slate-900">
                  {totalMonthLeads}
                </td>
                <td className="py-3 px-2 text-center font-black text-sm text-rose-600">
                  {totalMonthJunk}
                </td>
                <td className="py-3 px-2 text-center font-black text-sm text-emerald-700">
                  {totalMonthQualified}
                </td>
                <td className="py-3 px-2 text-center font-black text-xs sm:text-sm text-amber-800 font-mono">
                  {overallMonthCpl > 0 ? formatRupiah(overallMonthCpl) : (totalMonthCost === 0 ? 'Rp 0' : '-')}
                </td>
                <td className="py-3 px-2 text-center font-black text-xs sm:text-sm text-emerald-800 font-mono">
                  {overallMonthCpql > 0 ? formatRupiah(overallMonthCpql) : (totalMonthCost === 0 ? 'Rp 0' : '-')}
                </td>
                <td className="py-3 px-2 text-center font-black text-xs sm:text-sm text-purple-800 font-mono">
                  {overallMonthCostVisited > 0 ? formatRupiah(overallMonthCostVisited) : (totalMonthCost === 0 && totalMonthVisited > 0 ? 'Rp 0' : '-')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards for Monthly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Total Volume Bulanan</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {totalLeads}
            </p>
            <span className="text-xs text-slate-500">Leads Masuk</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 font-semibold">
            <span className="text-emerald-700">
              {qualifiedLeadsCount} Valid ({qualifiedPctTotal}%)
            </span>
            <span className="text-rose-600">
              {junkCount} Junk ({junkPctTotal}%)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Kepatuhan SLA (&lt; 2m)</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-700 leading-tight">
              {slaCompliancePct}%
            </p>
            <span className="text-xs text-slate-500">Standar Respon</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-600">
            <span>Sesuai SOP:</span>
            <span className="font-bold text-slate-900">{slaMetCount} dari {totalLeads} Chat</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Prospek Visited &amp; Prospect</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {visitedCount + prospectCount}
            </p>
            <span className="text-xs text-slate-500">Leads Berkualitas</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-600 font-semibold">
            <span className="text-purple-700">Visited: {visitedCount}</span>
            <span className="text-emerald-700">Prospect: {prospectCount}</span>
          </div>
        </div>

        <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Rata-Rata CPL Bulanan</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-800 leading-tight">
              {overallMonthCpl > 0 ? formatRupiah(overallMonthCpl) : (totalMonthCost === 0 ? 'Rp 0' : '-')}
            </p>
            <span className="text-xs text-amber-700">/lead</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-200/80 text-amber-900 font-semibold">
            <span>CPQL (Valid):</span>
            <span className="font-bold text-emerald-800">{overallMonthCpql > 0 ? formatRupiah(overallMonthCpql) : (totalMonthCost === 0 ? 'Rp 0' : '-')}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
