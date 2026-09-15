import React, { useState, useMemo, useEffect } from 'react';
import { 
  Lead, 
  SalesAgent, 
  LeadCategory,
  FollowUpResolveStatus 
} from '../types';
import { 
  getSavedWeeklyAdCosts, 
  saveWeeklyAdCost, 
  getTotalMonthAdCost,
  WeekAdCostConfig 
} from '../services/adSpendService';
import { 
  AUGUST_2026_WEEKS, 
  JULY_2026_WEEKS,
  getWeeksForMonth,
  WeekRange, 
  parseLeadDate, 
  filterLeadsByWeek, 
  formatDateIndonesian, 
  getIndonesianDayName 
} from '../utils/dateUtils';
import { 
  formatRupiah, 
  formatNumberWithDots,
  parseNumberFromDots,
  getCategoryMeta, 
  getResolveStatusMeta, 
  getSopStatusMeta 
} from '../services/leadScoring';
import { isLeadAssignedToAgent } from '../data/mockData';
import { DetailedDateRangePicker } from './DetailedDateRangePicker';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Download, 
  Filter, 
  Clock, 
  Users, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Compass, 
  RefreshCw,
  ChevronRight,
  Printer,
  DollarSign,
  Calculator
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { generateWeeklyReportPdf } from '../utils/exportToPdf';

interface WeeklyReportDashboardProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead?: (lead: Lead) => void;
  onOpenScoringModal?: (lead?: Lead) => void;
}

const CATEGORY_COLORS = {
  VISITED: '#d97706', // amber-600
  PROSPECT: '#f59e0b', // amber-500
  WARM: '#10b981', // emerald-500
  COLD: '#0284c7', // sky-600
  JUNK: '#e11d48', // rose-600
};

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const WeeklyReportDashboard: React.FC<WeeklyReportDashboardProps> = ({
  leads,
  salesAgents,
  onSelectLead,
  onOpenScoringModal,
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
    });

    return Array.from(monthSet).sort().reverse();
  }, [leads]);

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  // Month label helper
  const getMonthLabel = (mKey: string) => {
    if (mKey === 'ALL') return 'Semua Bulan (All-Time)';
    const [year, month] = mKey.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || 'Bulan'} ${year}`;
  };

  // Weeks for current selected month
  const activeWeeksList = useMemo(() => {
    return getWeeksForMonth(selectedMonth);
  }, [selectedMonth]);

  const [selectedWeekId, setSelectedWeekId] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-30');
  const [activeChartTab, setActiveChartTab] = useState<'overview' | 'daily' | 'channels' | 'agents' | 'resolve'>('overview');

  // Handle Month Switch from month tabs
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

  // Handle Detailed Date Range Picker Apply without resetting custom range
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

  // Filter leads based on selected month & week
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

  // Calculations for KPI Cards with Official Formula:
  // Total Leads - Junk Leads = Qualified Leads -> % Cold, % Warm, % Visited
  const totalLeads = filteredLeads.length;
  
  const junkLeads = filteredLeads.filter((l) => {
    const res = (l.resolveStatus as string) || '';
    const rem = (l.historyRemarks || '').toLowerCase();
    return (
      l.category === 'JUNK' || 
      res.includes('Cari Sewa') || 
      res.includes('Strangers') || 
      res.includes('Jualan Product') || 
      res.includes('Over buget') || 
      res.includes('Cari Kerja') ||
      rem.includes('cari sewa') ||
      rem.includes('stranger') ||
      rem.includes('jualan') ||
      rem.includes('over buget') ||
      rem.includes('cari kerja')
    );
  });
  const junkCount = junkLeads.length;
  const qualifiedLeadsCount = Math.max(0, totalLeads - junkCount);

  const visitedLeads = filteredLeads.filter((l) => l.category === 'VISITED' && !junkLeads.includes(l));
  const prospectLeads = filteredLeads.filter((l) => l.category === 'PROSPECT' && !junkLeads.includes(l));
  const warmLeads = filteredLeads.filter((l) => l.category === 'WARM' && !junkLeads.includes(l));
  const coldLeads = filteredLeads.filter((l) => l.category === 'COLD' && !junkLeads.includes(l));

  const visitedCount = visitedLeads.length;
  const prospectCount = prospectLeads.length;
  const warmCount = warmLeads.length;
  const coldCount = coldLeads.length;

  // Percentage based on Qualified Leads
  const visitedPctFromQualified = qualifiedLeadsCount > 0 ? ((visitedCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';
  const prospectPctFromQualified = qualifiedLeadsCount > 0 ? ((prospectCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';
  const warmPctFromQualified = qualifiedLeadsCount > 0 ? ((warmCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';
  const coldPctFromQualified = qualifiedLeadsCount > 0 ? ((coldCount / qualifiedLeadsCount) * 100).toFixed(1) : '0';

  const junkPctFromTotal = totalLeads > 0 ? ((junkCount / totalLeads) * 100).toFixed(1) : '0';
  const qualifiedPctFromTotal = totalLeads > 0 ? ((qualifiedLeadsCount / totalLeads) * 100).toFixed(1) : '0';

  // SOP Checklist: Derived from SOP Status (Checklist ✅ vs ❌) on Qualified Leads
  const qualifiedLeadsForSop = filteredLeads.filter((l) => l.category !== 'JUNK');
  const sopMetCount = qualifiedLeadsForSop.filter((l) => l.sopStatus === 'SOP_MET').length;
  const sopBreachedCount = qualifiedLeadsForSop.filter((l) => l.sopStatus === 'SOP_BREACHED').length;
  const sopComplianceRate = qualifiedLeadsCount > 0 ? Math.round((sopMetCount / qualifiedLeadsCount) * 100) : 0;

  // SLA First Response Speed (< 2 Menit):
  const slaMetCount = filteredLeads.filter((l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes <= 2).length;
  const slaComplianceRate = totalLeads > 0 ? Math.round((slaMetCount / totalLeads) * 100) : 0;

  const totalPipelineValue = filteredLeads.reduce((sum, l) => sum + (l.budgetEstimated || 0), 0);
  const highTierPipelineValue = [...visitedLeads, ...prospectLeads].reduce((sum, l) => sum + (l.budgetEstimated || 0), 0);

  const avgLeadScore = totalLeads > 0 
    ? Math.round(filteredLeads.reduce((sum, l) => sum + l.score, 0) / totalLeads) 
    : 0;

  // Stored ad spend per week with centralized storage for selectedMonth
  const [weeklyAdCosts, setWeeklyAdCosts] = useState<WeekAdCostConfig>(() => getSavedWeeklyAdCosts(selectedMonth));

  // Reload weekly ad costs whenever selectedMonth changes
  useEffect(() => {
    setWeeklyAdCosts(getSavedWeeklyAdCosts(selectedMonth));
  }, [selectedMonth]);

  // Sync state when storage updates or window event fires
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

  const currentPeriodCost = useMemo(() => {
    if (selectedWeekId === 'ALL') {
      return getTotalMonthAdCost(selectedMonth);
    }
    return weeklyAdCosts[selectedWeekId] || 0;
  }, [selectedWeekId, selectedMonth, weeklyAdCosts]);

  const handleUpdateCost = (cost: number) => {
    if (selectedWeekId === 'ALL') return;
    const updated = saveWeeklyAdCost(selectedWeekId, cost, selectedMonth);
    setWeeklyAdCosts(updated);
  };

  const cpl = totalLeads > 0 ? Math.round(currentPeriodCost / totalLeads) : 0;
  const cpql = qualifiedLeadsCount > 0 ? Math.round(currentPeriodCost / qualifiedLeadsCount) : 0;
  const costPerVisited = visitedCount > 0 ? Math.round(currentPeriodCost / visitedCount) : 0;

  // 1. Daily Breakdown Data (Senin - Minggu)
  const dailyBreakdownData = useMemo(() => {
    const dayStats: Record<string, {
      day: string;
      total: number;
      bagus: number;
      potensial: number;
      junk: number;
      sopMet: number;
      totalResponseMinutes: number;
      responseCount: number;
      dateSamples: string[];
    }> = {};

    DAY_ORDER.forEach((dayName) => {
      dayStats[dayName] = {
        day: dayName,
        total: 0,
        bagus: 0,
        potensial: 0,
        junk: 0,
        sopMet: 0,
        totalResponseMinutes: 0,
        responseCount: 0,
        dateSamples: [],
      };
    });

    filteredLeads.forEach((lead) => {
      const d = parseLeadDate(lead.dateContact || lead.createdAt || lead.answeredAt);
      const dayName = d ? getIndonesianDayName(d) : 'Senin';
      if (dayStats[dayName]) {
        dayStats[dayName].total += 1;
        
        const resStr = (lead.resolveStatus as string) || '';
        const remStr = (lead.historyRemarks || '').toLowerCase();
        const isJunk = 
          lead.category === 'JUNK' || 
          resStr.includes('Cari Sewa') || 
          resStr.includes('Strangers') || 
          resStr.includes('Jualan Product') || 
          resStr.includes('Over buget') || 
          resStr.includes('Cari Kerja') ||
          remStr.includes('cari sewa') ||
          remStr.includes('stranger') ||
          remStr.includes('jualan') ||
          remStr.includes('over buget') ||
          remStr.includes('cari kerja');

        if (isJunk) {
          dayStats[dayName].junk += 1;
        } else if (lead.category === 'VISITED' || lead.category === 'PROSPECT') {
          dayStats[dayName].bagus += 1;
        } else {
          dayStats[dayName].potensial += 1;
        }

        if (lead.sopStatus === 'SOP_MET') {
          dayStats[dayName].sopMet += 1;
        }

        if (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes > 0) {
          dayStats[dayName].totalResponseMinutes += lead.firstResponseTimeMinutes;
          dayStats[dayName].responseCount += 1;
        }

        if (d && dayStats[dayName].dateSamples.length < 2) {
          const dateStr = formatDateIndonesian(d);
          if (!dayStats[dayName].dateSamples.includes(dateStr)) {
            dayStats[dayName].dateSamples.push(dateStr);
          }
        }
      }
    });

    return DAY_ORDER.map((dayName) => {
      const item = dayStats[dayName];
      const avgResp = item.responseCount > 0 
        ? +(item.totalResponseMinutes / item.responseCount).toFixed(1) 
        : 4.5;

      return {
        name: dayName,
        total: item.total,
        bagus: item.bagus,
        potensial: item.potensial,
        junk: item.junk,
        sopCompliance: item.total > 0 ? Math.round((item.sopMet / item.total) * 100) : 0,
        avgResponseMinutes: avgResp,
        dateDisplay: item.dateSamples.join(', ') || '-',
      };
    });
  }, [filteredLeads]);

  // 2. Lead Quality Distribution Data (Donut Chart)
  const qualityPieData = useMemo(() => {
    return [
      { name: 'Visited (Kunjungan)', value: visitedLeads.length, color: CATEGORY_COLORS.VISITED },
      { name: 'Prospect (Hot Interest)', value: prospectLeads.length, color: CATEGORY_COLORS.PROSPECT },
      { name: 'Warm (Respon Positif)', value: warmLeads.length, color: CATEGORY_COLORS.WARM },
      { name: 'Cold (First Contact)', value: coldCount, color: CATEGORY_COLORS.COLD },
      { name: 'Junk / Tidak Relevan', value: junkCount, color: CATEGORY_COLORS.JUNK },
    ].filter(item => item.value > 0);
  }, [visitedLeads, prospectLeads, warmLeads, coldCount, junkCount]);

  // 3. Ad Source / Campaign Performance Data
  const adSourceData = useMemo(() => {
    const map: Record<string, { name: string; total: number; bagus: number; junk: number; value: number }> = {};

    filteredLeads.forEach((lead) => {
      const src = lead.adSource || lead.primaryChannel || 'Direct Inbound';
      if (!map[src]) {
        map[src] = { name: src, total: 0, bagus: 0, junk: 0, value: 0 };
      }
      map[src].total += 1;
      
      const isJunk = lead.category === 'JUNK' || 
        lead.resolveStatus === 'Cari Sewa' || 
        lead.resolveStatus === 'Strangers' || 
        lead.resolveStatus === 'Jualan Product' || 
        lead.resolveStatus === 'Over buget' || 
        lead.resolveStatus === 'Cari Kerja';

      if (isJunk) {
        map[src].junk += 1;
      } else if (lead.category === 'VISITED' || lead.category === 'PROSPECT' || lead.category === 'WARM') {
        map[src].bagus += 1;
      }

      map[src].value += lead.budgetEstimated || 0;
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredLeads]);

  // 4. Sales Agent SLA & Lead Handling Data
  const agentPerformanceData = useMemo(() => {
    return salesAgents.map((agent) => {
      const agentLeads = filteredLeads.filter((l) => isLeadAssignedToAgent(l, agent));
      const count = agentLeads.length;
      const validLeads = agentLeads.filter(l => l.category !== 'JUNK');
      const validCount = validLeads.length;
      const sopMet = validLeads.filter((l) => l.sopStatus === 'SOP_MET' || String(l.sopStatus || '').toLowerCase().includes('met')).length;
      const sopBreached = validCount - sopMet;
      const sopRate = validCount > 0 ? Math.round((sopMet / validCount) * 100) : (count > 0 ? 0 : 100);
      
      let totalMins = 0;
      let minCount = 0;
      validLeads.forEach((l) => {
        if (l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes > 0) {
          totalMins += l.firstResponseTimeMinutes;
          minCount += 1;
        }
      });
      const avgMins = minCount > 0 ? +(totalMins / minCount).toFixed(1) : agent.avgResponseTimeMinutes;

      const hotCount = agentLeads.filter((l) => l.category === 'VISITED' || l.category === 'PROSPECT').length;

      return {
        name: agent.name.split(' ')[0],
        fullName: agent.name,
        totalLeads: count,
        validLeads: validCount,
        sopMetCount: sopMet,
        sopBreachedCount: sopBreached,
        hotLeads: hotCount,
        sopComplianceRate: sopRate,
        avgResponseMinutes: avgMins,
      };
    }).filter(a => a.totalLeads > 0 || selectedWeekId === 'ALL');
  }, [salesAgents, filteredLeads, selectedWeekId]);

  // 5. Follow-Up Resolve Status Data
  const resolveStatusData = useMemo(() => {
    const map: Record<string, number> = {
      'First Contact': 0,
      'Follow Up': 0,
      'Resolved': 0,
      'Cari Sewa (Junk)': 0,
      'Strangers (Junk)': 0,
      'Jualan Product (Junk)': 0,
      'Over buget (Junk)': 0,
      'Cari Kerja (Junk)': 0,
    };

    filteredLeads.forEach((l) => {
      if (l.resolveStatus === 'Cari Sewa') map['Cari Sewa (Junk)'] += 1;
      else if (l.resolveStatus === 'Strangers') map['Strangers (Junk)'] += 1;
      else if (l.resolveStatus === 'Jualan Product') map['Jualan Product (Junk)'] += 1;
      else if (l.resolveStatus === 'Over buget') map['Over buget (Junk)'] += 1;
      else if (l.resolveStatus === 'Cari Kerja') map['Cari Kerja (Junk)'] += 1;
      else if (l.resolveStatus === 'Follow Up' || l.resolveStatus === 'FOLLOW_UP_CONTACT') map['Follow Up'] += 1;
      else if (l.resolveStatus === 'Resolved' || l.resolveStatus === 'RESOLVED') map['Resolved'] += 1;
      else map['First Contact'] += 1;
    });

    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      isJunk: name.includes('Junk'),
    }));
  }, [filteredLeads]);

  // Export Weekly Report to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Date Contact',
      'Prospek Name',
      'Phone',
      'Resolve Status',
      'Status Leads',
      'Assigned To',
      'Answered At',
      'First Response Time',
      'Agent First Reply Time',
      'Source Iklan',
      'Remarks FU 1',
      'SOP Status',
      'Score'
    ];

    const rows = filteredLeads.map((l, i) => [
      l.leadNumber || i + 1,
      l.dateContact || l.createdAt,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      l.resolveStatus,
      l.category,
      `"${l.assignedToName || ''}"`,
      l.answeredAt || '',
      l.firstResponseTimeFormatted || '',
      l.agentFirstReplyTime || '',
      `"${l.adSource || ''}"`,
      `"${(l.remarksFu1 || l.historyRemarks || '').replace(/"/g, '""')}"`,
      l.sopStatus,
      l.score
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Weekly_Report_UpperWest_${currentWeekMeta.shortLabel.replace(/[\s()]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const validResponses = filteredLeads.filter((l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes > 0);
    const avgResponseMinutes = validResponses.length > 0 ? (validResponses.reduce((sum, l) => sum + (l.firstResponseTimeMinutes || 0), 0) / validResponses.length).toFixed(1) : '1.8';

    generateWeeklyReportPdf({
      weekLabel: currentWeekMeta.fullLabel,
      displayRange: currentWeekMeta.dateRangeLabel,
      adCost: currentPeriodCost,
      totalLeads,
      qualifiedCount: qualifiedLeadsCount,
      junkCount,
      coldCount,
      warmCount,
      prospectCount,
      visitedCount,
      cpl,
      cpql,
      costPerVisited,
      sopMetCount,
      sopBreachedCount,
      sopComplianceRate,
      avgResponseTimeFormatted: `${avgResponseMinutes} Menit`,
      dailyStats: dailyBreakdownData.map((d) => ({
        day: d.name,
        total: d.total,
        bagus: d.bagus,
        potensial: d.potensial,
        junk: d.junk,
        sopMet: Math.round((d.sopCompliance / 100) * d.total),
        avgResponse: `${d.avgResponseMinutes} mnt`,
      })),
      leads: filteredLeads,
    });
  };

  return (
    <div id="weekly-report-dashboard" className="space-y-4 animate-fadeIn">
      
      {/* Header & Weekly Filter Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Report Dashboard Mingguan (Weekly CRM)
                </h2>
                <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  Senin - Minggu
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Filter performa leads, evaluasi percakapan sales, komposisi kualitas prospek, dan audit SLA berdasarkan siklus mingguan.
              </p>
            </div>
          </div>

          {/* Right: Export buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
              title="Print Laporan"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs transition-all shadow-2xs cursor-pointer"
              title="Download Dokumen PDF Resmi"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Period & Detailed Date Range Picker Bar */}
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

      {/* RUMUSAN RESMI PENILAIAN & WATERFALL CLASSIFICATION (CLEAN WHITE THEME) */}
      <div className="bg-white text-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              RUMUSAN PENILAIAN MINGGUAN
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              Total Leads Masuk dikurangi Junk = Qualified Leads ({currentWeekMeta.displayRange})
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SLA Target: &lt; 2 Menit
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
            <span className="text-[10px] text-slate-400 block mt-1">Seluruh Inbound Terdata</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-rose-800 uppercase block">2. (-) Junk / Non-Prospek</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {junkCount} <span className="text-xs font-normal text-rose-700">Leads ({junkPctFromTotal}%)</span>
            </div>
            <span className="text-[10px] text-rose-600/80 block mt-1">Cari Sewa, Strangers, Overbudget, Jualan</span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3.5 ring-1 ring-emerald-400">
            <span className="text-[11px] font-bold text-emerald-900 uppercase block">3. (=) Qualified Leads (Valid)</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {qualifiedLeadsCount} <span className="text-xs font-normal text-emerald-800">Leads ({qualifiedPctFromTotal}%)</span>
            </div>
            <span className="text-[10px] text-emerald-800 block mt-1">Basis Pembagi Kategori Cold, Warm, Visited</span>
          </div>
        </div>

        {/* Breakdown of Qualified Leads */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Cold Leads</span>
            <div className="text-base font-black text-slate-800 mt-0.5">
              {coldCount} <span className="text-xs text-slate-500">({coldPctFromQualified}%)</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>

          <div className="bg-amber-50/80 rounded-lg p-2.5 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Warm Leads</span>
            <div className="text-base font-black text-amber-700 mt-0.5">
              {warmCount} <span className="text-xs text-amber-800">({warmPctFromQualified}%)</span>
            </div>
            <span className="text-[9px] text-amber-800/80 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>

          <div className="bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Prospect Leads</span>
            <div className="text-base font-black text-emerald-700 mt-0.5">
              {prospectCount} <span className="text-xs text-emerald-800">({prospectPctFromQualified}%)</span>
            </div>
            <span className="text-[9px] text-emerald-800/80 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>

          <div className="bg-purple-50/80 rounded-lg p-2.5 border border-purple-200">
            <span className="text-[10px] uppercase font-bold text-purple-800 block">Visited / Show Unit</span>
            <div className="text-base font-black text-purple-700 mt-0.5">
              {visitedCount} <span className="text-xs text-purple-800">({visitedPctFromQualified}%)</span>
            </div>
            <span className="text-[9px] text-purple-800/80 block mt-0.5">dari {qualifiedLeadsCount} Qualified Leads</span>
          </div>
        </div>
      </div>

      {/* TABEL RINCIAN BIAYA IKLAN & CPL PERIODE TERPILIH (LAMPIRAN 1 DESIGN) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Tabel Rincian Biaya Iklan &amp; CPL Periode Terpilih (Bisa Diedit)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ubah angka pada kolom "Biaya Iklan (IDR)", nilai CPL dan CPQL akan langsung dihitung secara otomatis untuk periode {currentWeekMeta.shortLabel} ({currentWeekMeta.displayRange}).
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
            <span>Periode Aktif:</span>
            <span className="font-bold text-amber-900">{currentWeekMeta.shortLabel}</span>
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
              <tr className="hover:bg-amber-50/30 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-black text-slate-900 text-xs">
                    {currentWeekMeta.shortLabel}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    {currentWeekMeta.displayRange.replace(/\s*\([^)]*\)/g, '')}
                  </div>
                </td>
                <td className="py-3 px-2.5">
                  <div className={`flex items-center gap-1 border rounded-lg px-2 py-1 w-32 sm:w-36 transition-all ${
                    selectedWeekId === 'ALL' 
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-90' 
                      : 'bg-slate-50 border-slate-300 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white focus-within:border-amber-400'
                  }`}>
                    <span className="text-[11px] font-bold text-slate-400">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberWithDots(currentPeriodCost)}
                      onChange={(e) => handleUpdateCost(parseNumberFromDots(e.target.value))}
                      disabled={selectedWeekId === 'ALL'}
                      className={`w-full text-xs font-black bg-transparent focus:outline-none ${
                        selectedWeekId === 'ALL' ? 'text-slate-600 cursor-not-allowed' : 'text-slate-900'
                      }`}
                      placeholder="0"
                      title={selectedWeekId === 'ALL' ? 'Akumulasi total bulan. Pilih minggu tertentu (W1-W5) untuk mengedit budget mingguan.' : 'Edit nominal biaya iklan minggu ini'}
                    />
                  </div>
                  {selectedWeekId === 'ALL' && (
                    <span className="text-[9px] text-amber-700 block mt-0.5 font-medium">Total Akumulasi Bulan</span>
                  )}
                </td>
                <td className="py-3 px-2 text-center font-black text-slate-900 text-sm">
                  {totalLeads}
                </td>
                <td className="py-3 px-2 text-center font-black text-rose-600 text-sm">
                  {junkCount}
                </td>
                <td className="py-3 px-2 text-center font-black text-emerald-600 text-sm">
                  {qualifiedLeadsCount}
                </td>
                <td className="py-3 px-2 text-center font-black text-amber-800 text-xs sm:text-sm font-mono">
                  {totalLeads > 0 && currentPeriodCost > 0 ? formatRupiah(cpl) : (currentPeriodCost === 0 ? 'Rp 0' : '-')}
                </td>
                <td className="py-3 px-2 text-center font-black text-emerald-700 text-xs sm:text-sm font-mono">
                  {qualifiedLeadsCount > 0 && currentPeriodCost > 0 ? formatRupiah(cpql) : (currentPeriodCost === 0 ? 'Rp 0' : '-')}
                </td>
                <td className="py-3 px-2 text-center font-black text-purple-700 text-xs sm:text-sm font-mono">
                  {visitedCount > 0 && currentPeriodCost > 0 ? formatRupiah(costPerVisited) : (currentPeriodCost === 0 && visitedCount > 0 ? 'Rp 0' : '-')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards for Selected Week */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* KPI 1: Total Leads & Bagus vs Junk */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Volume Leads Minggu Ini</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {totalLeads}
            </p>
            <span className="text-xs text-slate-500">Prospek Terdata</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 font-semibold">
            <span className="text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {qualifiedLeadsCount} Valid ({qualifiedPctFromTotal}%)
            </span>
            <span className="text-rose-600 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              {junkCount} Junk
            </span>
          </div>
        </div>

        {/* KPI 2: Kepatuhan SOP Sales (Checklist) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Kepatuhan SOP Sales</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-700 leading-tight">
              {sopComplianceRate}%
            </p>
            <span className="text-xs text-slate-500">Checklist Sesuai</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-600">
            <span>SOP Sesuai:</span>
            <span className="font-bold text-slate-900">✅ {sopMetCount} | ❌ {sopBreachedCount}</span>
          </div>
        </div>

        {/* KPI 3: High-Tier Qualified Leads */}
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

        {/* KPI 4: Biaya Iklan & CPL Minggu Ini */}
        <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">CPL &amp; CPQL Minggu Ini</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-800 leading-tight">
              {totalLeads > 0 ? formatRupiah(cpl) : '-'}
            </p>
            <span className="text-xs text-amber-700">/lead</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-200/80 text-amber-900 font-semibold">
            <span>CPQL (Valid Lead):</span>
            <span className="font-bold text-emerald-800">{qualifiedLeadsCount > 0 ? formatRupiah(cpql) : '-'}</span>
          </div>
        </div>

      </div>

      {/* Interactive Chart Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        
        {/* Navigation Tabs for Charts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">Tampilan Diagram:</span>
            
            <button
              onClick={() => setActiveChartTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. Tren Harian (Senin - Minggu)
            </button>

            <button
              onClick={() => setActiveChartTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'daily'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2. Komposisi Kualitas
            </button>

            <button
              onClick={() => setActiveChartTab('channels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'channels'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3. Source Iklan
            </button>

            <button
              onClick={() => setActiveChartTab('agents')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'agents'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              4. Performa & SLA Sales
            </button>

            <button
              onClick={() => setActiveChartTab('resolve')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'resolve'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              5. Rekap Follow-Up
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {currentWeekMeta.label}
          </span>
        </div>

        {/* Diagram 1: Tren Harian (Senin - Minggu) */}
        {activeChartTab === 'overview' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Distribusi & Volume Leads Masuk Harian (Senin - Minggu)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Grafik perbandingan jumlah prospek Bagus (Hot), Potensial (Warm/Cold), dan Junk/Tidak Bagus setiap hari dalam minggu terpilih.
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px', border: 'none' }}
                    labelStyle={{ fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="bagus" name="Prospek Bagus (Hot / Visited)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="potensial" name="Potensial (Warm / Cold)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="junk" name="Junk / Tidak Bagus" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Diagram 2: Komposisi Kualitas Leads (Pie / Donut) */}
        {activeChartTab === 'daily' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center animate-fadeIn">
            <div className="md:col-span-7 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {qualityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} Leads (${totalLeads > 0 ? Math.round((value / totalLeads) * 100) : 0}%)`, 'Jumlah']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-5 space-y-2 text-xs">
              <h4 className="font-black text-slate-900 text-sm mb-2">Ringkasan Status Leads:</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="font-bold text-amber-900">Visited (Kunjungan Site):</span>
                  <span className="font-mono font-black text-amber-900">{visitedLeads.length} ({totalLeads > 0 ? Math.round((visitedLeads.length / totalLeads) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200/60">
                  <span className="font-bold text-amber-800">Prospect (Minat Tinggi):</span>
                  <span className="font-mono font-black text-amber-800">{prospectLeads.length} ({totalLeads > 0 ? Math.round((prospectLeads.length / totalLeads) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900">Warm (Respon Positif):</span>
                  <span className="font-mono font-black text-emerald-900">{warmLeads.length} ({totalLeads > 0 ? Math.round((warmLeads.length / totalLeads) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-200">
                  <span className="font-bold text-sky-900">Cold (Tahap Awal):</span>
                  <span className="font-mono font-black text-sky-900">{coldCount} ({totalLeads > 0 ? Math.round((coldCount / totalLeads) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="font-bold text-rose-900">Junk / Irrelevant (Cari Sewa/Jual):</span>
                  <span className="font-mono font-black text-rose-900">{junkCount} ({totalLeads > 0 ? Math.round((junkCount / totalLeads) * 100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diagram 3: Source Iklan / Kampanye */}
        {activeChartTab === 'channels' && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Efektivitas Sumber Iklan (Ad Source Attribution)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Peringkat iklan yang menghasilkan volume dan rasio prospek berkualitas tertinggi pada minggu ini.
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adSourceData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#334155' }} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="bagus" name="Prospek Bagus (Hot/Warm)" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="junk" name="Junk / Tidak Bagus" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Diagram 4: Performa & SLA Response Time Sales Agent */}
        {activeChartTab === 'agents' && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Kinerja Tim Sales Advisor & Kepatuhan SOP SLA</span>
              </h3>
              <p className="text-xs text-slate-500">
                Membandingkan beban penanganan leads, rata-rata kecepatan balasan (menit), dan kepatuhan standar respon &lt; 15 menit.
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#334155' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="totalLeads" name="Total Leads Ditangani" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hotLeads" name="Prospek Hot / Visited" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sopComplianceRate" name="% Kepatuhan SOP (✅ Sesuai)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Diagram 5: Rekapitulasi Follow-Up Status */}
        {activeChartTab === 'resolve' && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Distribusi Status Follow Up (Resolve / Junk / In Progress)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pemisahan jelas antara prospek aktif versus leads yang mencari sewa, strangers, atau salah target.
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resolveStatusData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#334155' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="count" name="Jumlah Leads" fill="#d97706" radius={[4, 4, 0, 0]}>
                    {resolveStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isJunk ? '#f43f5e' : '#059669'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* Weekly Executive Summary Table (Senin s/d Minggu Breakdown) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Tabel Rekapitulasi Harian ({currentWeekMeta.shortLabel})</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Rincian metrik harian dari hari Senin sampai Minggu.
            </p>
          </div>
          <div className="font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-300">
            Total Mingguan: {totalLeads} Leads
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3">Hari</th>
                <th className="py-2.5 px-3">Tanggal Sampel</th>
                <th className="py-2.5 px-3 text-center">Total Leads</th>
                <th className="py-2.5 px-3 text-center">Prospek Bagus</th>
                <th className="py-2.5 px-3 text-center">Potensial</th>
                <th className="py-2.5 px-3 text-center">Junk / Cold</th>
                <th className="py-2.5 px-3 text-center">Kepatuhan SOP</th>
                <th className="py-2.5 px-3 text-right">Rata² Respon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {dailyBreakdownData.map((d) => (
                <tr key={d.name} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {d.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {d.dateDisplay}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono">
                    {d.total}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                    {d.bagus}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                    {d.potensial}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                    {d.junk}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.sopCompliance >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.sopCompliance >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {d.sopCompliance}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-700">
                    {d.avgResponseMinutes} mnt
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
