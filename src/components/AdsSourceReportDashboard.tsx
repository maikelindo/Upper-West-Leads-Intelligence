import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lead, 
  SalesAgent, 
  LeadCategory,
  CampaignSourceStat
} from '../types';
import { 
  getSavedCampaignAdCosts, 
  saveCampaignAdCost, 
  resetCampaignAdCostsToDefault,
  getTotalMonthAdCost,
  getSynchronizedCampaignAdCosts,
  getSavedWeeklyAdCosts,
  WeekAdCostConfig
} from '../services/adSpendService';
import { 
  AUGUST_2026_WEEKS,
  JULY_2026_WEEKS,
  getWeeksForMonth, 
  WeekRange, 
  filterLeadsByWeek 
} from '../utils/dateUtils';
import { 
  formatRupiah, 
  formatNumberWithDots, 
  parseNumberFromDots,
  getCategoryMeta,
  parseCampaignSource
} from '../services/leadScoring';
import { 
  Megaphone, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Award, 
  BarChart3, 
  PieChart, 
  Search, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  RefreshCw, 
  Download, 
  X,
  Phone,
  HelpCircle,
  Sparkles,
  Filter,
  Calendar
} from 'lucide-react';
import { DetailedDateRangePicker } from './DetailedDateRangePicker';
import * as XLSX from 'xlsx';

interface AdsSourceReportDashboardProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead: (lead: Lead) => void;
}

export const AdsSourceReportDashboard: React.FC<AdsSourceReportDashboardProps> = ({
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
    });

    return Array.from(monthSet).sort().reverse();
  }, [leads]);

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  // Month label helper
  const getMonthLabel = (mKey: string) => {
    if (mKey === 'ALL') return 'Semua Bulan (Overall)';
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

  // Weekly Filter State
  const [selectedWeekId, setSelectedWeekId] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-30');

  // When month changes, update default custom dates and ensure week ID is valid
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

  // Real-time synchronization with Monthly Report Total Ad Cost & Weekly Costs for selectedMonth
  const [totalMonthCost, setTotalMonthCost] = useState<number>(() => getTotalMonthAdCost(selectedMonth));
  const [weeklyAdCosts, setWeeklyAdCosts] = useState<WeekAdCostConfig>(() => getSavedWeeklyAdCosts(selectedMonth));
  const [adCosts, setAdCosts] = useState<Record<string, number>>(() => getSynchronizedCampaignAdCosts(getTotalMonthAdCost(selectedMonth)));
  const [editingCampaignKey, setEditingCampaignKey] = useState<string | null>(null);
  const [tempCostInput, setTempCostInput] = useState<string>('');
  
  // Table Filters
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'Instagram' | 'Google' | 'TikTok' | 'Not Detected'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUALIFIED' | LeadCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'LEADS_DESC' | 'QUALIFIED_DESC' | 'COST_DESC' | 'CPL_ASC' | 'CPQL_ASC'>('LEADS_DESC');
  
  // Drill-down modal state
  const [drilldownCampaign, setDrilldownCampaign] = useState<CampaignSourceStat | null>(null);
  const [drilldownStatusFilter, setDrilldownStatusFilter] = useState<'ALL' | 'QUALIFIED' | LeadCategory>('ALL');
  const [drilldownSearch, setDrilldownSearch] = useState<string>('');
  const [savedAlert, setSavedAlert] = useState<string | null>(null);

  // Reload ad costs whenever selectedMonth changes
  useEffect(() => {
    const monthTotal = getTotalMonthAdCost(selectedMonth);
    setTotalMonthCost(monthTotal);
    setAdCosts(getSynchronizedCampaignAdCosts(monthTotal));
    setWeeklyAdCosts(getSavedWeeklyAdCosts(selectedMonth));
  }, [selectedMonth]);

  // Listen to ad cost updates in real time from Monthly Report, Weekly Report, or Campaign edits
  useEffect(() => {
    const handleSync = () => {
      const monthTotal = getTotalMonthAdCost(selectedMonth);
      setTotalMonthCost(monthTotal);
      setAdCosts(getSynchronizedCampaignAdCosts(monthTotal));
      setWeeklyAdCosts(getSavedWeeklyAdCosts(selectedMonth));
    };

    window.addEventListener('upperwest_ad_costs_updated', handleSync);
    window.addEventListener('upperwest_campaign_costs_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('upperwest_ad_costs_updated', handleSync);
      window.removeEventListener('upperwest_campaign_costs_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [selectedMonth]);

  // Current active week metadata
  const currentWeekMeta = useMemo(() => {
    if (selectedWeekId === 'CUSTOM') {
      return {
        id: 'CUSTOM',
        label: `Rentang Kustom (${customStartDate} s/d ${customEndDate})`,
        shortLabel: 'Kustom',
        startDate: customStartDate,
        endDate: customEndDate,
        displayRange: `${customStartDate} s/d ${customEndDate}`,
        isCurrentOrLatest: false,
      };
    }
    const found = activeWeeksList.find((w) => w.id === selectedWeekId);
    return found || activeWeeksList[0] || AUGUST_2026_WEEKS[0];
  }, [selectedWeekId, customStartDate, customEndDate, activeWeeksList]);

  // Filter leads based on selected weekly range and month
  const activeLeads = useMemo(() => {
    return filterLeadsByWeek(leads, selectedWeekId, customStartDate, customEndDate, selectedMonth);
  }, [leads, selectedWeekId, customStartDate, customEndDate, selectedMonth]);

  // Determine budget spent for the selected week
  const periodTotalSpend = useMemo(() => {
    if (selectedWeekId === 'ALL' || selectedWeekId === 'CUSTOM') {
      return totalMonthCost;
    }
    return weeklyAdCosts[selectedWeekId] ?? 0;
  }, [selectedWeekId, totalMonthCost, weeklyAdCosts]);

  // Proportional campaign costs for the selected period
  const campaignCostsForPeriod = useMemo(() => {
    if (selectedWeekId === 'ALL' || selectedWeekId === 'CUSTOM') {
      return adCosts;
    }
    const weekBudget = weeklyAdCosts[selectedWeekId] ?? 0;
    if (totalMonthCost <= 0 || weekBudget <= 0) {
      const zeroMap: Record<string, number> = {};
      Object.keys(adCosts).forEach((k) => { zeroMap[k] = 0; });
      return zeroMap;
    }
    const propMap: Record<string, number> = {};
    Object.keys(adCosts).forEach((k) => {
      const baseCost = adCosts[k] || 0;
      propMap[k] = Math.round((baseCost / totalMonthCost) * weekBudget);
    });
    return propMap;
  }, [selectedWeekId, adCosts, totalMonthCost, weeklyAdCosts]);

  // Compute all campaign statistics based on active weekly filter
  const {
    campaignStats,
    platformDistribution,
    totalBudgetSpent,
    totalLeadsCount,
    totalVisited,
    totalProspect,
    totalWarm,
    totalCold,
    totalJunk,
    totalQualified,
    overallCpl,
    overallCpql,
    overallCostVisited,
    topContentRanked
  } = useMemo(() => {
    const totalLeads = activeLeads.length;
    
    // Group leads by standardized campaign source
    const groups: Record<string, {
      platform: string;
      contentName: string;
      leads: Lead[];
    }> = {};

    activeLeads.forEach((lead) => {
      const sourceMeta = parseCampaignSource(lead.adPlatform || lead.primaryChannel, lead.adSource || lead.campaignSource);
      const key = sourceMeta.fullName;

      if (!groups[key]) {
        groups[key] = {
          platform: sourceMeta.platform,
          contentName: sourceMeta.content,
          leads: [],
        };
      }
      groups[key].leads.push(lead);
    });

    // Also include any campaign configured in ad costs even if 0 leads
    Object.keys(campaignCostsForPeriod).forEach((key) => {
      if (!groups[key]) {
        const parts = key.split(' - ');
        groups[key] = {
          platform: parts[0] || 'Not Detected',
          contentName: parts.slice(1).join(' - ') || key,
          leads: [],
        };
      }
    });

    // Total ad spend for the selected period
    const totalSpend = periodTotalSpend;

    // Build CampaignSourceStat items
    const stats: CampaignSourceStat[] = Object.keys(groups).map((key) => {
      const g = groups[key];
      const campLeads = g.leads;
      const count = campLeads.length;
      
      const visitedCount = campLeads.filter(l => l.category === 'VISITED').length;
      const prospectCount = campLeads.filter(l => l.category === 'PROSPECT').length;
      const warmCount = campLeads.filter(l => l.category === 'WARM').length;
      const coldCount = campLeads.filter(l => l.category === 'COLD').length;
      const junkCount = campLeads.filter(l => l.category === 'JUNK').length;
      
      // Standard Formula: Qualified Leads (Valid) = Total Inbound - Junk = Cold + Warm + Prospect + Visited
      const qualifiedCount = count - junkCount;
      
      const manualCost = campaignCostsForPeriod[key] || 0;
      const costSharePercentage = totalSpend > 0 ? (manualCost / totalSpend) * 100 : 0;
      const percentageOfTotal = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      
      const cpl = count > 0 && manualCost > 0 ? Math.round(manualCost / count) : 0;
      const cpql = qualifiedCount > 0 && manualCost > 0 ? Math.round(manualCost / qualifiedCount) : 0;
      const costPerVisited = visitedCount > 0 && manualCost > 0 ? Math.round(manualCost / visitedCount) : 0;

      const totalRespMinutes = campLeads.reduce((acc, l) => acc + (l.firstResponseTimeMinutes || 0), 0);
      const avgResponseTime = count > 0 ? Math.round((totalRespMinutes / count) * 10) / 10 : 0;

      return {
        campaignKey: key,
        platform: g.platform,
        contentName: g.contentName,
        totalLeads: count,
        percentageOfTotal,
        visitedCount,
        prospectCount,
        warmCount,
        coldCount,
        junkCount,
        qualifiedCount,
        qualifiedRate: count > 0 ? (qualifiedCount / count) * 100 : 0,
        junkRate: count > 0 ? (junkCount / count) * 100 : 0,
        manualCost,
        costSharePercentage,
        cpl,
        cpql,
        costPerVisited,
        avgResponseTime,
        leads: campLeads,
      };
    });

    // Global totals matching Monthly Report formula:
    // Total Inbound - Junk = Qualified Leads (Valid)
    const vCount = activeLeads.filter(l => l.category === 'VISITED').length;
    const pCount = activeLeads.filter(l => l.category === 'PROSPECT').length;
    const wCount = activeLeads.filter(l => l.category === 'WARM').length;
    const cCount = activeLeads.filter(l => l.category === 'COLD').length;
    const jCount = activeLeads.filter(l => l.category === 'JUNK').length;
    const qCount = totalLeads - jCount; // Qualified (Valid) Leads

    const gCpl = totalLeads > 0 && totalSpend > 0 ? Math.round(totalSpend / totalLeads) : 0;
    const gCpql = qCount > 0 && totalSpend > 0 ? Math.round(totalSpend / qCount) : 0;
    const gCostVisited = vCount > 0 && totalSpend > 0 ? Math.round(totalSpend / vCount) : 0;

    // Platform Distribution (Instagram, Google, TikTok, Not Detected, and dynamic platforms)
    const basePlatforms = ['Instagram', 'Google', 'TikTok', 'Not Detected'];
    const allPlatforms = [...basePlatforms];
    activeLeads.forEach((l) => {
      const meta = parseCampaignSource(l.adPlatform || l.primaryChannel, l.adSource || l.campaignSource);
      if (meta.platform && !allPlatforms.includes(meta.platform)) {
        allPlatforms.push(meta.platform);
      }
    });

    const pDist = allPlatforms.map((p) => {
      const pLeads = activeLeads.filter((l) => {
        const meta = parseCampaignSource(l.adPlatform || l.primaryChannel, l.adSource || l.campaignSource);
        return meta.platform === p;
      });
      const pCount = pLeads.length;
      const pJunk = pLeads.filter(l => l.category === 'JUNK').length;
      const pQualified = pCount - pJunk; // Valid non-junk leads
      
      let pSpend = 0;
      Object.keys(campaignCostsForPeriod).forEach((k) => {
        if (k.startsWith(`${p} -`) || (p === 'Not Detected' && k === 'Not Detected')) {
          pSpend += campaignCostsForPeriod[k] || 0;
        }
      });

      return {
        platform: p,
        count: pCount,
        percentage: totalLeads > 0 ? (pCount / totalLeads) * 100 : 0,
        qualifiedCount: pQualified,
        qualifiedRate: pCount > 0 ? (pQualified / pCount) * 100 : 0,
        junkCount: pJunk,
        junkRate: pCount > 0 ? (pJunk / pCount) * 100 : 0,
        spend: pSpend,
        cpl: pCount > 0 && pSpend > 0 ? Math.round(pSpend / pCount) : 0,
        cpql: pQualified > 0 && pSpend > 0 ? Math.round(pSpend / pQualified) : 0,
      };
    });

    // Top Content Ranked (prioritizing qualified volume & total leads)
    const contentRanked = [...stats]
      .filter(s => s.campaignKey !== 'Not Detected' && s.totalLeads > 0)
      .sort((a, b) => {
        if (b.qualifiedCount !== a.qualifiedCount) return b.qualifiedCount - a.qualifiedCount;
        return b.totalLeads - a.totalLeads;
      });

    return {
      campaignStats: stats,
      platformDistribution: pDist,
      totalBudgetSpent: totalSpend,
      totalLeadsCount: totalLeads,
      totalVisited: vCount,
      totalProspect: pCount,
      totalWarm: wCount,
      totalCold: cCount,
      totalJunk: jCount,
      totalQualified: qCount,
      overallCpl: gCpl,
      overallCpql: gCpql,
      overallCostVisited: gCostVisited,
      topContentRanked: contentRanked,
    };
  }, [activeLeads, campaignCostsForPeriod, periodTotalSpend]);

  // Filtered & Sorted Campaign Table Data
  const displayedCampaigns = useMemo(() => {
    let list = [...campaignStats];

    // Filter by platform
    if (platformFilter !== 'ALL') {
      list = list.filter(c => c.platform === platformFilter);
    }

    // Filter by status presence
    if (statusFilter === 'QUALIFIED') {
      list = list.filter(c => c.qualifiedCount > 0);
    } else if (statusFilter === 'VISITED') {
      list = list.filter(c => c.visitedCount > 0);
    } else if (statusFilter === 'PROSPECT') {
      list = list.filter(c => c.prospectCount > 0);
    } else if (statusFilter === 'WARM') {
      list = list.filter(c => c.warmCount > 0);
    } else if (statusFilter === 'COLD') {
      list = list.filter(c => c.coldCount > 0);
    } else if (statusFilter === 'JUNK') {
      list = list.filter(c => c.junkCount > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.campaignKey.toLowerCase().includes(q) ||
        c.contentName.toLowerCase().includes(q) ||
        c.platform.toLowerCase().includes(q) ||
        c.leads.some(l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.remarksFu1.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'LEADS_DESC') return b.totalLeads - a.totalLeads;
      if (sortBy === 'QUALIFIED_DESC') return b.qualifiedCount - a.qualifiedCount;
      if (sortBy === 'COST_DESC') return b.manualCost - a.manualCost;
      if (sortBy === 'CPL_ASC') {
        if (a.cpl === 0) return 1;
        if (b.cpl === 0) return -1;
        return a.cpl - b.cpl;
      }
      if (sortBy === 'CPQL_ASC') {
        if (a.cpql === 0) return 1;
        if (b.cpql === 0) return -1;
        return a.cpql - b.cpql;
      }
      return b.totalLeads - a.totalLeads;
    });

    return list;
  }, [campaignStats, platformFilter, statusFilter, searchQuery, sortBy]);

  // Filtered leads inside drilldown modal
  const modalFilteredLeads = useMemo(() => {
    if (!drilldownCampaign) return [];
    let list = drilldownCampaign.leads;

    if (drilldownStatusFilter === 'QUALIFIED') {
      list = list.filter(l => l.category !== 'JUNK');
    } else if (drilldownStatusFilter !== 'ALL') {
      list = list.filter(l => l.category === drilldownStatusFilter);
    }

    if (drilldownSearch.trim()) {
      const q = drilldownSearch.toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.remarksFu1 || '').toLowerCase().includes(q) ||
        (l.assignedToName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [drilldownCampaign, drilldownStatusFilter, drilldownSearch]);

  // Handle Manual Cost Save
  const handleSaveCost = (campaignKey: string, numericVal: number) => {
    saveCampaignAdCost(campaignKey, numericVal);
    setEditingCampaignKey(null);
    setSavedAlert(`Biaya iklan untuk "${campaignKey}" berhasil diperbarui.`);
    setTimeout(() => setSavedAlert(null), 3000);
  };

  // Export Ads Source Summary to Excel
  const handleExportExcel = () => {
    const exportData = campaignStats.map((c, idx) => ({
      'No.': idx + 1,
      'Source / Campaign Iklan': c.campaignKey,
      'Platform': c.platform,
      'Nama Content / Ad Creative': c.contentName,
      'Input Biaya Iklan (IDR)': c.manualCost,
      'Komposisi Biaya (%)': `${c.costSharePercentage.toFixed(1)}%`,
      'Total Leads': c.totalLeads,
      'Persentase Leads (%)': `${c.percentageOfTotal.toFixed(1)}%`,
      'Visited (Show Unit)': c.visitedCount,
      'Prospect': c.prospectCount,
      'Warm': c.warmCount,
      'Cold': c.coldCount,
      'Junk': c.junkCount,
      'Total Qualified Leads (Valid)': c.qualifiedCount,
      'Qualified Conversion (%)': `${c.qualifiedRate.toFixed(1)}%`,
      'Junk Rate (%)': `${c.junkRate.toFixed(1)}%`,
      'CPL Gross (IDR)': c.cpl,
      'CPQL Qualified (IDR)': c.cpql,
      'Cost per Visited (IDR)': c.costPerVisited,
      'Rata-rata Respon (Menit)': `${c.avgResponseTime} min`,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rangkuman_Source_Iklan');
    XLSX.writeFile(wb, `UpperWest_Source_Leads_Iklan_${currentWeekMeta.shortLabel.replace(/[\s()]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div id="ads-source-report-dashboard" className="space-y-6 pb-12">
      
      {/* Toast Alert */}
      {savedAlert && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{savedAlert}</span>
          <button onClick={() => setSavedAlert(null)} className="ml-2 text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-amber-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black tracking-wider uppercase border border-amber-400/30">
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                Ads Source & Campaign Performance
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Database: {totalLeadsCount} Leads ({currentWeekMeta.shortLabel})
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              Rangkuman Result Source Leads Iklan
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Analisis mendalam asal sumber iklan (<span className="text-amber-300 font-semibold">Instagram - Content</span>, <span className="text-amber-300 font-semibold">Google - Content</span>, & <span className="text-slate-400 font-semibold">Not Detected</span>), komposisi biaya ads manual, konversi kualitas prospek (<span className="text-purple-300 font-semibold">Visited</span>, <span className="text-emerald-300 font-semibold">Prospect</span>, <span className="text-amber-300 font-semibold">Warm</span>, <span className="text-slate-300 font-semibold">Cold</span>, <span className="text-rose-300 font-semibold">Junk</span>), dan kalkulasi efisiensi CPL & CPQL.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (window.confirm('Kembalikan biaya input iklan masing-masing ads ke default?')) {
                  const def = resetCampaignAdCostsToDefault();
                  setAdCosts(def);
                  setSavedAlert('Biaya iklan dikembalikan ke default.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Cost Default</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md hover:shadow-amber-500/20 active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Export Laporan Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* PERIOD & DATE RANGE PICKER BAR */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              {totalLeadsCount} Leads
            </span>
          </div>
        </div>
      </div>

      {/* RUMUSAN RESMI PENILAIAN & WATERFALL CLASSIFICATION (IDENTICAL TO LAMPIRAN 2) */}
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
              {totalLeadsCount} <span className="text-xs font-normal text-slate-500">Leads (100%)</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Seluruh Inbound Terdata</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-rose-800 uppercase block">2. (-) Junk / Non-Prospek</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {totalJunk} <span className="text-xs font-normal text-rose-700">Leads ({totalLeadsCount > 0 ? ((totalJunk / totalLeadsCount) * 100).toFixed(1) : 0}%)</span>
            </div>
            <span className="text-[10px] text-rose-600/80 block mt-1">Cari Sewa, Strangers, Overbudget, Jualan</span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3.5 ring-1 ring-emerald-400">
            <span className="text-[11px] font-bold text-emerald-900 uppercase block">3. (=) Qualified Leads (Valid)</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {totalQualified} <span className="text-xs font-normal text-emerald-800">Leads ({totalLeadsCount > 0 ? ((totalQualified / totalLeadsCount) * 100).toFixed(1) : 0}%)</span>
            </div>
            <span className="text-[10px] text-emerald-800 block mt-1">Basis Pembagi Kategori Cold, Warm, Visited</span>
          </div>
        </div>

        {/* Breakdown of Qualified Leads */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Cold Leads</span>
            <div className="text-base font-black text-slate-800 mt-0.5">
              {totalCold} <span className="text-xs text-slate-500">({totalQualified > 0 ? ((totalCold / totalQualified) * 100).toFixed(1) : 0}%)</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">dari {totalQualified} Qualified Leads</span>
          </div>

          <div className="bg-amber-50/80 rounded-lg p-2.5 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Warm Leads</span>
            <div className="text-base font-black text-amber-700 mt-0.5">
              {totalWarm} <span className="text-xs text-amber-800">({totalQualified > 0 ? ((totalWarm / totalQualified) * 100).toFixed(1) : 0}%)</span>
            </div>
            <span className="text-[9px] text-amber-800/80 block mt-0.5">dari {totalQualified} Qualified Leads</span>
          </div>

          <div className="bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Prospect Leads</span>
            <div className="text-base font-black text-emerald-700 mt-0.5">
              {totalProspect} <span className="text-xs text-emerald-800">({totalQualified > 0 ? ((totalProspect / totalQualified) * 100).toFixed(1) : 0}%)</span>
            </div>
            <span className="text-[9px] text-emerald-800/80 block mt-0.5">dari {totalQualified} Qualified Leads</span>
          </div>

          <div className="bg-purple-50/80 rounded-lg p-2.5 border border-purple-200">
            <span className="text-[10px] uppercase font-bold text-purple-800 block">Visited / Show Unit</span>
            <div className="text-base font-black text-purple-700 mt-0.5">
              {totalVisited} <span className="text-xs text-purple-800">({totalQualified > 0 ? ((totalVisited / totalQualified) * 100).toFixed(1) : 0}%)</span>
            </div>
            <span className="text-[9px] text-purple-800/80 block mt-0.5">dari {totalQualified} Qualified Leads</span>
          </div>
        </div>
      </div>

      {/* ADS FINANCIAL KPI CARDS (Total Budget, CPL Gross, CPQL Qualified) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Budget Ads */}
        <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block">TOTAL BUDGET ADS</span>
          <div className="text-xl font-black text-amber-950 font-mono whitespace-nowrap mt-1">
            {formatRupiah(totalBudgetSpent)}
          </div>
          <span className="text-[10px] font-bold text-amber-800 mt-0.5">Akumulasi Input Manual Semua Ads</span>
        </div>

        {/* CPL Gross */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">CPL GROSS (TOTAL INBOUND)</span>
          <div className="text-xl font-black text-slate-900 font-mono whitespace-nowrap mt-1">
            {overallCpl > 0 ? formatRupiah(overallCpl) : '-'}
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-0.5">Total Budget / {totalLeadsCount} Leads</span>
        </div>

        {/* CPQL Qualified */}
        <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 block">CPQL (QUALIFIED LEADS)</span>
          <div className="text-xl font-black text-emerald-800 font-mono whitespace-nowrap mt-1">
            {overallCpql > 0 ? formatRupiah(overallCpql) : '-'}
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">Total Budget / {totalQualified} Qualified Leads</span>
        </div>

      </div>

      {/* Section: Percentage Asal Dari Mana Saja & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Origin Platform Breakdown (Percentage Asal Mana Saja) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Persentase Asal Source Leads Iklan (Platform Distribution)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Distribusi {totalLeadsCount} leads berdasarkan platform periklanan & organik
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              Total {totalLeadsCount} Leads
            </span>
          </div>

          {/* Visual Stacked Progress Bar */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex p-0.5 shadow-inner gap-0.5">
            {platformDistribution.map((p) => {
              const bgColor = p.platform === 'Instagram' 
                ? 'bg-pink-500' 
                : p.platform === 'Google' 
                ? 'bg-blue-500' 
                : p.platform === 'TikTok'
                ? 'bg-cyan-500'
                : 'bg-slate-400';
              return (
                <div
                  key={p.platform}
                  style={{ width: `${Math.max(2, p.percentage)}%` }}
                  className={`${bgColor} h-full rounded-xs transition-all`}
                  title={`${p.platform}: ${p.count} leads (${p.percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* Platform Detail Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {platformDistribution.map((p) => {
              const isInstagram = p.platform === 'Instagram';
              const isGoogle = p.platform === 'Google';
              const isTikTok = p.platform === 'TikTok';

              const borderClass = isInstagram 
                ? 'border-pink-200 bg-pink-50/30' 
                : isGoogle 
                ? 'border-blue-200 bg-blue-50/30' 
                : isTikTok
                ? 'border-cyan-200 bg-cyan-50/30'
                : 'border-slate-200 bg-slate-50/50';

              const badgeClass = isInstagram 
                ? 'bg-pink-100 text-pink-850 border-pink-200' 
                : isGoogle 
                ? 'bg-blue-100 text-blue-850 border-blue-200' 
                : isTikTok
                ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                : 'bg-slate-200 text-slate-800 border-slate-300';

              const dotColor = isInstagram 
                ? 'bg-pink-500' 
                : isGoogle 
                ? 'bg-blue-500' 
                : isTikTok
                ? 'bg-cyan-500'
                : 'bg-slate-500';

              return (
                <div key={p.platform} className={`rounded-xl p-3.5 border ${borderClass} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <span className="text-xs font-black text-slate-900">{p.platform}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {p.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1 mb-2">
                      <span className="text-2xl font-black text-slate-900 font-mono">{p.count}</span>
                      <span className="text-xs font-semibold text-slate-500">Leads ({p.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Qualified ({p.qualifiedCount})</span>
                      <span className="font-bold text-emerald-700">{p.qualifiedRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Junk ({p.junkCount})</span>
                      <span className="font-bold text-rose-600">{p.junkRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 pt-1 font-mono font-bold text-[10px]">
                      <span>Biaya Ads</span>
                      <span>{p.spend > 0 ? formatRupiah(p.spend) : 'Rp 0'}</span>
                    </div>
                    {p.spend > 0 && p.count > 0 && (
                      <div className="flex justify-between items-center text-amber-900 font-mono text-[10px] font-bold">
                        <span>CPL Platform</span>
                        <span>{formatRupiah(p.cpl)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5-Tier Status Composition (Visited, Prospect, Warm, Cold, Junk) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Komposisi Status Kualitas Leads
              </h3>
              <p className="text-[11px] text-slate-500">
                Breakdown dari total {totalLeadsCount} leads yang sales terima
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            
            {/* Visited */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span className="font-bold text-purple-950">Visited (Show Unit)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-purple-900">{totalVisited}</span>
                <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">
                  {totalLeadsCount > 0 ? ((totalVisited / totalLeadsCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Prospect */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-emerald-950">Prospect (Negosiasi / KPA)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-emerald-900">{totalProspect}</span>
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                  {totalLeadsCount > 0 ? ((totalProspect / totalLeadsCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Warm */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-bold text-amber-950">Warm (Tanya Unit / Pricelist)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-amber-900">{totalWarm}</span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                  {totalLeadsCount > 0 ? ((totalWarm / totalLeadsCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Cold */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="font-bold text-slate-800">Cold (On FU 1 - FU 3)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-800">{totalCold}</span>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {totalLeadsCount > 0 ? ((totalCold / totalLeadsCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Junk */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-bold text-rose-950">Junk (Salah Sambung / Sewa)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-rose-700">{totalJunk}</span>
                <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">
                  {totalLeadsCount > 0 ? ((totalJunk / totalLeadsCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Qualified Leads (Valid)</span>
            <span className="font-black text-emerald-700 text-xs">
              {totalLeadsCount > 0 ? ((totalQualified / totalLeadsCount) * 100).toFixed(1) : 0}% ({totalQualified} Prospek Valid)
            </span>
          </div>
        </div>

      </div>

      {/* Section: TOP CONTENT / HIGHEST CONVERTING CREATIVES */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-black">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Top Content & Best Performing Campaigns
              </h3>
              <p className="text-[11px] text-slate-500">
                Konten iklan dengan perolehan prospek qualified valid tertinggi
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 w-fit">
            🏆 Top 3 Ad Creatives
          </span>
        </div>

        {/* 3 Top Content Cards (Redesigned with proper columns & zero overlap) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {topContentRanked.slice(0, 3).map((item, index) => {
            const rankLabel = index === 0 ? '🥇 TOP #1 CONTENT' : index === 1 ? '🥈 TOP #2 CONTENT' : '🥉 TOP #3 CONTENT';
            const medalColor = index === 0 ? 'border-amber-400 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30' : index === 1 ? 'border-slate-300 bg-slate-50/40' : 'border-amber-200/60 bg-white';
            const badgeRank = index === 0 ? 'bg-amber-400 text-slate-950' : index === 1 ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900';
            const platformBadgeColor = item.platform === 'Instagram'
              ? 'bg-pink-100 text-pink-850 border-pink-200'
              : item.platform === 'Google'
              ? 'bg-blue-100 text-blue-850 border-blue-200'
              : item.platform === 'TikTok'
              ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
              : 'bg-slate-100 text-slate-800 border-slate-200';

            return (
              <div 
                key={item.campaignKey}
                className={`rounded-2xl p-4 sm:p-5 border-2 ${medalColor} shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div>
                  {/* Card Top Row: Badge Rank on Left, Platform on Right */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${badgeRank} whitespace-nowrap shadow-2xs`}>
                      {rankLabel}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono whitespace-nowrap ${platformBadgeColor}`}>
                      {item.platform}
                    </span>
                  </div>

                  {/* Campaign Title & Creative Subtitle */}
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {item.campaignKey}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Creative: <span className="font-bold text-slate-700">{item.contentName}</span>
                  </p>

                  {/* 3-Column Metrics Box with Fixed Equal Spacing */}
                  <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center my-3">
                    <div className="p-1">
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase">TOTAL LEADS</div>
                      <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{item.totalLeads}</div>
                      <div className="text-[10px] font-bold text-slate-500">{item.percentageOfTotal.toFixed(1)}% share</div>
                    </div>
                    <div className="p-1 border-x border-slate-200">
                      <div className="text-[10px] text-emerald-700 font-extrabold uppercase">QUALIFIED</div>
                      <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">{item.qualifiedCount}</div>
                      <div className="text-[10px] font-bold text-emerald-600">{item.qualifiedRate.toFixed(1)}% valid</div>
                    </div>
                    <div className="p-1">
                      <div className="text-[10px] text-rose-700 font-extrabold uppercase">JUNK</div>
                      <div className="text-lg font-black text-rose-600 font-mono mt-0.5">{item.junkCount}</div>
                      <div className="text-[10px] font-bold text-rose-500">{item.junkRate.toFixed(1)}% junk</div>
                    </div>
                  </div>

                  {/* Status Composition Breakdown for this Campaign */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold mb-3">
                    <span className="text-slate-400 text-[10px]">Status:</span>
                    {item.visitedCount > 0 && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">Visited: {item.visitedCount}</span>}
                    {item.warmCount > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">Warm: {item.warmCount}</span>}
                    {item.coldCount > 0 && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Cold: {item.coldCount}</span>}
                    {item.junkCount > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Junk: {item.junkCount}</span>}
                  </div>
                </div>

                {/* Bottom Financials & Action Button */}
                <div className="space-y-1.5 pt-2.5 border-t border-slate-200/80 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">Biaya Ads Terpasang:</span>
                    <span className="font-mono font-black text-slate-900">{formatRupiah(item.manualCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">CPL Gross:</span>
                    <span className="font-mono font-bold text-amber-900">{item.cpl > 0 ? formatRupiah(item.cpl) : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">CPQL Qualified:</span>
                    <span className="font-mono font-bold text-emerald-800">{item.cpql > 0 ? formatRupiah(item.cpql) : '-'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setDrilldownCampaign(item);
                      setDrilldownStatusFilter('ALL');
                      setDrilldownSearch('');
                    }}
                    className="w-full mt-2.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  >
                    <span>Lihat {item.totalLeads} Prospek</span>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Section: Interactive Campaign Table with 1-Bar Manual Cost Input */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                Daftar Lengkap Source Iklan & Pengaturan Biaya Ads
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap campaign dilengkapi bar input biaya iklan khusus untuk memantau komposisi budget & ROI CPL/CPQL
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                {displayedCampaigns.length} Campaign Terdaftar
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari campaign / content / nama..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Platform:</span>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-full cursor-pointer"
              >
                <option value="ALL">Semua Platform</option>
                <option value="Instagram">Instagram ({platformDistribution.find(p => p.platform === 'Instagram')?.count || 0})</option>
                <option value="Google">Google ({platformDistribution.find(p => p.platform === 'Google')?.count || 0})</option>
                <option value="TikTok">TikTok ({platformDistribution.find(p => p.platform === 'TikTok')?.count || 0})</option>
                <option value="Not Detected">Not Detected ({platformDistribution.find(p => p.platform === 'Not Detected')?.count || 0})</option>
              </select>
            </div>

            {/* Status Quality Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Kategori:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-full cursor-pointer"
              >
                <option value="ALL">Semua Status ({totalLeadsCount})</option>
                <option value="QUALIFIED">Qualified Valid ({totalQualified})</option>
                <option value="VISITED">Visited ({totalVisited})</option>
                <option value="PROSPECT">Prospect ({totalProspect})</option>
                <option value="WARM">Warm ({totalWarm})</option>
                <option value="COLD">Cold ({totalCold})</option>
                <option value="JUNK">Junk ({totalJunk})</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-full cursor-pointer"
              >
                <option value="LEADS_DESC">Leads Terbanyak</option>
                <option value="QUALIFIED_DESC">Qualified Terbanyak</option>
                <option value="COST_DESC">Biaya Ads Tertinggi</option>
                <option value="CPL_ASC">CPL Terendah</option>
                <option value="CPQL_ASC">CPQL Terendah</option>
              </select>
            </div>

          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 whitespace-nowrap">SOURCE & CONTENT IKLAN</th>
                <th className="py-3 px-4 whitespace-nowrap">INPUT BIAYA ADS (IDR) & KOMPOSISI</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">TOTAL LEADS</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">KOMPOSISI STATUS</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">QUALIFIED (VALID)</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">JUNK</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">CPL (GROSS)</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">CPQL (QUALIFIED)</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data source iklan yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                displayedCampaigns.map((row) => {
                  const isEditing = editingCampaignKey === row.campaignKey;
                  const platformBadgeColor = row.platform === 'Instagram' 
                    ? 'bg-pink-100 text-pink-850 border-pink-200' 
                    : row.platform === 'Google' 
                      ? 'bg-blue-100 text-blue-850 border-blue-200' 
                      : row.platform === 'TikTok'
                        ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={row.campaignKey} className="hover:bg-amber-50/20 transition-colors">
                      
                      {/* 1. Source & Content Iklan */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${platformBadgeColor}`}>
                              {row.platform}
                            </span>
                            <span className="font-black text-slate-900 text-xs">
                              {row.contentName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {row.campaignKey}
                          </span>
                        </div>
                      </td>

                      {/* 2. Manual Cost Input Bar & Progress Share */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="w-52 space-y-1.5">
                          
                          {/* Input Field */}
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white focus-within:border-amber-400 transition-all">
                            <span className="text-xs font-bold text-slate-400">Rp</span>
                            <input
                              type="text"
                              value={isEditing ? tempCostInput : (row.manualCost > 0 ? formatNumberWithDots(row.manualCost) : '')}
                              onFocus={() => {
                                setEditingCampaignKey(row.campaignKey);
                                setTempCostInput(row.manualCost > 0 ? formatNumberWithDots(row.manualCost) : '');
                              }}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = parseNumberFromDots(raw);
                                setTempCostInput(formatNumberWithDots(parsed));
                              }}
                              onBlur={() => {
                                const parsed = parseNumberFromDots(tempCostInput);
                                handleSaveCost(row.campaignKey, parsed);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const parsed = parseNumberFromDots(tempCostInput);
                                  handleSaveCost(row.campaignKey, parsed);
                                } else if (e.key === 'Escape') {
                                  setEditingCampaignKey(null);
                                }
                              }}
                              placeholder="0"
                              className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none"
                            />
                          </div>

                          {/* Visual Cost Composition Bar */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden mr-2">
                              <div
                                style={{ width: `${Math.min(100, Math.max(2, row.costSharePercentage))}%` }}
                                className="h-full bg-amber-500 rounded-full"
                              />
                            </div>
                            <span className="font-mono font-bold text-amber-900">
                              {row.costSharePercentage.toFixed(1)}% budget
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* 3. Total Leads */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm font-mono">
                          {row.totalLeads}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {row.percentageOfTotal.toFixed(1)}% total
                        </span>
                      </td>

                      {/* 4. Mini Status Pills */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {row.visitedCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px]" title={`Visited: ${row.visitedCount}`}>
                              V: {row.visitedCount}
                            </span>
                          )}
                          {row.prospectCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]" title={`Prospect: ${row.prospectCount}`}>
                              P: {row.prospectCount}
                            </span>
                          )}
                          {row.warmCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]" title={`Warm: ${row.warmCount}`}>
                              W: {row.warmCount}
                            </span>
                          )}
                          {row.coldCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]" title={`Cold: ${row.coldCount}`}>
                              C: {row.coldCount}
                            </span>
                          )}
                          {row.junkCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]" title={`Junk: ${row.junkCount}`}>
                              J: {row.junkCount}
                            </span>
                          )}
                          {row.totalLeads === 0 && (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* 5. Qualified Count & Rate */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-black text-emerald-700 text-sm font-mono">
                          {row.qualifiedCount}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {row.qualifiedRate.toFixed(1)}%
                        </span>
                      </td>

                      {/* 6. Junk Count & Rate */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-black text-rose-600 text-sm font-mono">
                          {row.junkCount}
                        </div>
                        <span className="text-[10px] font-bold text-rose-500">
                          {row.junkRate.toFixed(1)}%
                        </span>
                      </td>

                      {/* 7. CPL (Gross) */}
                      <td className="py-3.5 px-4 text-center font-black text-amber-800 text-sm whitespace-nowrap font-mono">
                        {row.cpl > 0 ? formatRupiah(row.cpl) : (row.manualCost === 0 ? 'Rp 0' : '-')}
                      </td>

                      {/* 8. CPQL (Qualified) */}
                      <td className="py-3.5 px-4 text-center font-black text-emerald-700 text-sm whitespace-nowrap font-mono">
                        {row.cpql > 0 ? formatRupiah(row.cpql) : (row.manualCost === 0 && row.qualifiedCount > 0 ? 'Rp 0' : '-')}
                      </td>

                      {/* 9. Action Drilldown */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setDrilldownCampaign(row);
                            setDrilldownStatusFilter('ALL');
                            setDrilldownSearch('');
                          }}
                          disabled={row.totalLeads === 0}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                            row.totalLeads > 0 
                              ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 shadow-xs' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{row.totalLeads} Prospek</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}

              {/* OVERALL ACCUMULATION ROW */}
              <tr className="bg-amber-50/90 text-slate-900 font-bold border-t-2 border-amber-400">
                <td className="py-4 px-4 font-black uppercase text-xs tracking-wider text-amber-950 whitespace-nowrap">
                  TOTAL AKUMULASI SEMUA ADS
                </td>
                <td className="py-4 px-4 font-black text-sm text-amber-950 font-mono whitespace-nowrap">
                  {formatRupiah(totalBudgetSpent)}
                </td>
                <td className="py-4 px-4 text-center font-black text-base text-slate-900 whitespace-nowrap">
                  {totalLeadsCount}
                </td>
                <td className="py-4 px-4 text-center text-xs font-mono whitespace-nowrap text-slate-700">
                  V:{totalVisited} | P:{totalProspect} | W:{totalWarm} | C:{totalCold}
                </td>
                <td className="py-4 px-4 text-center font-black text-base text-emerald-700 whitespace-nowrap">
                  {totalQualified}
                </td>
                <td className="py-4 px-4 text-center font-black text-base text-rose-600 whitespace-nowrap">
                  {totalJunk}
                </td>
                <td className="py-4 px-4 text-center font-black text-base text-amber-800 whitespace-nowrap font-mono">
                  {overallCpl > 0 ? formatRupiah(overallCpl) : (totalBudgetSpent === 0 ? 'Rp 0' : '-')}
                </td>
                <td className="py-4 px-4 text-center font-black text-base text-emerald-800 whitespace-nowrap font-mono">
                  {overallCpql > 0 ? formatRupiah(overallCpql) : (totalBudgetSpent === 0 ? 'Rp 0' : '-')}
                </td>
                <td className="py-4 px-4 text-center text-xs font-bold text-amber-900 whitespace-nowrap">
                  100% Leads
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL / DRAWER: DRILLDOWN LEADS IN SELECTED CAMPAIGN WITH STATUS FILTER TABS */}
      {drilldownCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {drilldownCampaign.platform}
                    </span>
                    <h3 className="text-base font-black text-white">
                      {drilldownCampaign.campaignKey}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Daftar {drilldownCampaign.totalLeads} prospek dari creative: <span className="text-amber-300 font-semibold">{drilldownCampaign.contentName}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrilldownCampaign(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campaign Quick Summary Bar */}
            <div className="bg-amber-50/80 p-3.5 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-600 font-medium">Biaya Iklan: </span>
                  <span className="font-mono font-black text-amber-950">{formatRupiah(drilldownCampaign.manualCost)}</span>
                </div>
                <div className="h-4 w-px bg-amber-300" />
                <div>
                  <span className="text-slate-600 font-medium">Qualified Leads (Valid): </span>
                  <span className="font-black text-emerald-800">{drilldownCampaign.qualifiedCount} ({drilldownCampaign.qualifiedRate.toFixed(1)}%)</span>
                </div>
                <div className="h-4 w-px bg-amber-300" />
                <div>
                  <span className="text-slate-600 font-medium">CPL Gross: </span>
                  <span className="font-mono font-black text-amber-900">{drilldownCampaign.cpl > 0 ? formatRupiah(drilldownCampaign.cpl) : '-'}</span>
                </div>
                <div className="h-4 w-px bg-amber-300" />
                <div>
                  <span className="text-slate-600 font-medium">CPQL Qualified: </span>
                  <span className="font-mono font-black text-emerald-800">{drilldownCampaign.cpql > 0 ? formatRupiah(drilldownCampaign.cpql) : '-'}</span>
                </div>
              </div>
            </div>

            {/* Interactive In-Modal Filter & Search Bar */}
            <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                <button
                  onClick={() => setDrilldownStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drilldownStatusFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Semua ({drilldownCampaign.totalLeads})
                </button>
                <button
                  onClick={() => setDrilldownStatusFilter('QUALIFIED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drilldownStatusFilter === 'QUALIFIED'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  Qualified Valid ({drilldownCampaign.qualifiedCount})
                </button>
                {drilldownCampaign.visitedCount > 0 && (
                  <button
                    onClick={() => setDrilldownStatusFilter('VISITED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      drilldownStatusFilter === 'VISITED'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white text-purple-900 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    Visited ({drilldownCampaign.visitedCount})
                  </button>
                )}
                {drilldownCampaign.warmCount > 0 && (
                  <button
                    onClick={() => setDrilldownStatusFilter('WARM')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      drilldownStatusFilter === 'WARM'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    Warm ({drilldownCampaign.warmCount})
                  </button>
                )}
                {drilldownCampaign.coldCount > 0 && (
                  <button
                    onClick={() => setDrilldownStatusFilter('COLD')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      drilldownStatusFilter === 'COLD'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    Cold ({drilldownCampaign.coldCount})
                  </button>
                )}
                {drilldownCampaign.junkCount > 0 && (
                  <button
                    onClick={() => setDrilldownStatusFilter('JUNK')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      drilldownStatusFilter === 'JUNK'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    Junk ({drilldownCampaign.junkCount})
                  </button>
                )}
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  placeholder="Cari prospek..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {drilldownSearch && (
                  <button onClick={() => setDrilldownSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Leads List Table */}
            <div className="overflow-y-auto p-4 flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3">NO.</th>
                    <th className="py-2.5 px-3">TANGGAL & WAKTU</th>
                    <th className="py-2.5 px-3">NAMA & NO. TELFON</th>
                    <th className="py-2.5 px-3">KATEGORI STATUS</th>
                    <th className="py-2.5 px-3">SALES ASSIGNED</th>
                    <th className="py-2.5 px-3">REMAKS FU 1</th>
                    <th className="py-2.5 px-3 text-center">RESPON</th>
                    <th className="py-2.5 px-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modalFilteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data prospek pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    modalFilteredLeads.map((l) => {
                      const catMeta = getCategoryMeta(l.category || 'COLD');
                      return (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                            #{l.leadNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                            {l.dateContact}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{l.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {l.phone}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${catMeta.badgeBg} ${catMeta.badgeText} border ${catMeta.badgeBorder}`}>
                              {catMeta.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                            {l.assignedToName || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate text-[11px]" title={l.remarksFu1}>
                            {l.remarksFu1 || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {l.firstResponseTimeFormatted || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setDrilldownCampaign(null);
                                onSelectLead(l);
                              }}
                              className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Buka Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Menampilkan {modalFilteredLeads.length} dari {drilldownCampaign.leads.length} prospek
              </span>
              <button
                onClick={() => setDrilldownCampaign(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
