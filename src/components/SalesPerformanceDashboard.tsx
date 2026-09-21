import React, { useState, useMemo, useEffect } from 'react';
import { 
  Lead, 
  SalesAgent, 
  LeadCategory, 
  FollowUpResolveStatus 
} from '../types';
import { 
  getSavedWeeklyAdCosts, 
  getTotalMonthAdCost, 
  WeekAdCostConfig,
  normalizeWeekKey 
} from '../services/adSpendService';
import { 
  AUGUST_2026_WEEKS, 
  JULY_2026_WEEKS,
  getWeeksForMonth,
  WeekRange, 
  filterLeadsByWeek, 
  parseLeadDate,
  formatDateIndonesian 
} from '../utils/dateUtils';
import { 
  formatRupiah, 
  getCategoryMeta, 
  getResolveStatusMeta 
} from '../services/leadScoring';
import { isLeadAssignedToAgent } from '../data/mockData';
import { DetailedDateRangePicker } from './DetailedDateRangePicker';
import { DigitalSalesPerformanceSummary } from './DigitalSalesPerformanceSummary';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Filter, 
  Search, 
  Download, 
  Award, 
  Zap, 
  Building2, 
  ChevronRight, 
  Eye, 
  PhoneCall, 
  Calendar, 
  Layers, 
  ArrowUpDown, 
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  X,
  Timer,
  Hourglass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { generateSalesPerformancePdfReport } from '../utils/exportToPdf';

interface SalesPerformanceDashboardProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead?: (lead: Lead) => void;
}

export interface AgentPerformanceMetric {
  agentId: string;
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  agentEmail: string;
  agentPhone: string;
  
  // Volume Metrics
  totalLeads: number;
  junkLeads: number;
  qualifiedLeads: number;
  coldLeads: number;
  warmLeads: number;
  prospectLeads: number;
  visitedLeads: number;
  
  // Percentages
  junkRate: number;        // (junkLeads / totalLeads) * 100
  qualifiedRate: number;   // (qualifiedLeads / totalLeads) * 100
  coldRate: number;        // from qualified
  warmRate: number;        // from qualified
  prospectRate: number;    // from qualified
  visitedRate: number;     // from qualified
  
  // SLA (< 2 Menit derived from firstResponseTimeMinutes)
  slaMetCount: number;      // firstResponseTimeMinutes <= 2
  slaBreachedCount: number; // firstResponseTimeMinutes > 2 or unresponded
  slaComplianceRate: number;// (slaMetCount / totalLeads) * 100

  // SOP Checklist (derived from SOP Status / Checklist ✅ and ❌)
  sopMetCount: number;      // sopStatus === 'SOP_MET' / Checklist ✅
  sopBreachedCount: number; // sopStatus === 'SOP_BREACHED' / Checklist ❌
  sopComplianceRate: number;// (sopMetCount / totalLeads) * 100

  // Average Response Time
  avgResponseTimeMinutes: number;
  avgResponseTimeFormatted: string;
  maxResponseTimeMinutes: number;
  maxResponseTimeFormatted: string;
  slowLeadsCount: number;         // Response > 2 minutes (SLA Breached)
  slowLeadsAbove5mCount: number;  // Response > 5 minutes (Very delayed)
  replySpeedCategory: 'FAST' | 'MODERATE' | 'SLOW' | 'VERY_SLOW'; // FAST <=2m, MODERATE 2-5m, SLOW 5-20m, VERY_SLOW >20m
  
  // Financial & Cost Allocation
  shareOfLeads: number;    // (totalLeads / overallTotalLeads)
  allocatedCost: number;   // shareOfLeads * overallCost
  cpl: number;             // allocatedCost / totalLeads
  cpql: number;            // allocatedCost / qualifiedLeads
  costPerVisited: number;  // allocatedCost / visitedLeads

  // Ended by Sales Tracking
  endedTotalLeads: number;
  endedQualifiedLeads: number;
  endedJunkLeads: number;
  endedFromQualifiedRate: number; // percentage of qualified leads
  endedTotalRate: number;

  // Lead List
  assignedLeadsList: Lead[];
}

export const SalesPerformanceDashboard: React.FC<SalesPerformanceDashboardProps> = ({
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

  // Helper to identify ended leads
  const isLeadEnded = (l: Lead) =>
    Boolean(
      l.isEnded ||
      l.notes?.some((n) => {
        const lower = n.toLowerCase();
        return lower.includes('ended by sales') || lower.includes('ditutup sales');
      })
    );

  // Period & Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [selectedWeekId, setSelectedWeekId] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-30');
  const [categoryFilter, setCategoryFilter] = useState<LeadCategory | 'QUALIFIED_ONLY' | 'ALL'>('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'MET' | 'BREACHED'>('ALL');
  const [sopFilter, setSopFilter] = useState<'ALL' | 'MET' | 'BREACHED'>('ALL');
  const [replySpeedFilter, setReplySpeedFilter] = useState<'ALL' | 'FAST' | 'MODERATE' | 'SLOW' | 'ABOVE_AVERAGE'>('ALL');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Summary Tab State: 'OVERVIEW' | 'SLA' | 'SOP' | 'REPLY_TIME'
  const [summaryTab, setSummaryTab] = useState<'OVERVIEW' | 'SLA' | 'SOP' | 'REPLY_TIME'>('OVERVIEW');

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

  // Dynamic weeks list for current selected month
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
  
  // Sorting State
  const [sortField, setSortField] = useState<keyof AgentPerformanceMetric>('qualifiedLeads');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Selected Agent for Inspector Modal
  const [inspectingAgent, setInspectingAgent] = useState<AgentPerformanceMetric | null>(null);

  // Synchronized Ad Costs from Service
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
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('upperwest_ad_costs_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [selectedMonth]);

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

  // 1. Filter Leads by Month & Week
  const timeFilteredLeads = useMemo(() => {
    return filterLeadsByWeek(leads, selectedWeekId, customStartDate, customEndDate, selectedMonth);
  }, [leads, selectedWeekId, customStartDate, customEndDate, selectedMonth]);

  // Determine Overall Cost for the selected period
  const currentPeriodOverallCost = useMemo(() => {
    if (selectedWeekId !== 'ALL') {
      return weeklyAdCosts[selectedWeekId] || weeklyAdCosts[normalizeWeekKey(selectedWeekId)] || 0;
    }
    // If all weeks selected, sum costs of all weeks in month
    return getTotalMonthAdCost(selectedMonth);
  }, [weeklyAdCosts, selectedWeekId, selectedMonth]);

  // 2. Discover all Sales Agents (both mock + dynamically found in leads)
  const allAgentsList = useMemo(() => {
    const agentMap = new Map<string, { id: string; name: string; role: string; avatar: string; email: string; phone: string }>();

    // Add predefined mock agents
    salesAgents.forEach((sa) => {
      agentMap.set(sa.name.toLowerCase().trim(), {
        id: sa.id,
        name: sa.name,
        role: sa.role,
        avatar: sa.avatar,
        email: sa.email,
        phone: sa.phone,
      });
    });

    // Scan leads for any additional agent names
    leads.forEach((l) => {
      if (l.assignedToName && l.assignedToName.trim() !== '') {
        const cleanName = l.assignedToName.trim();
        const key = cleanName.toLowerCase();
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            id: l.assignedAgentId || `agent-${key.replace(/\s+/g, '-')}`,
            name: cleanName,
            role: 'Property Consultant',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0F172A&color=F59E0B&bold=true`,
            email: `${key.replace(/\s+/g, '.')}@upperwest-bsd.com`,
            phone: '+62 812-0000-0000',
          });
        }
      }
    });

    return Array.from(agentMap.values());
  }, [salesAgents, leads]);

  // 3. Aggregate Performance Metrics for Each Agent
  const overallTotalLeadsInPeriod = timeFilteredLeads.length;

  const agentMetrics: AgentPerformanceMetric[] = useMemo(() => {
    return allAgentsList.map((agent) => {
      // Find leads assigned to this agent in the time window (using exact token-based matching)
      const agentLeads = timeFilteredLeads.filter((l) => isLeadAssignedToAgent(l, agent));

      const totalLeads = agentLeads.length;
      const junkLeads = agentLeads.filter((l) => l.category === 'JUNK').length;
      const qualifiedLeads = totalLeads - junkLeads;
      const coldLeads = agentLeads.filter((l) => l.category === 'COLD').length;
      const warmLeads = agentLeads.filter((l) => l.category === 'WARM').length;
      const prospectLeads = agentLeads.filter((l) => l.category === 'PROSPECT').length;
      const visitedLeads = agentLeads.filter((l) => l.category === 'VISITED').length;

      const junkRate = totalLeads > 0 ? (junkLeads / totalLeads) * 100 : 0;
      const qualifiedRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
      const coldRate = qualifiedLeads > 0 ? (coldLeads / qualifiedLeads) * 100 : 0;
      const warmRate = qualifiedLeads > 0 ? (warmLeads / qualifiedLeads) * 100 : 0;
      const prospectRate = qualifiedLeads > 0 ? (prospectLeads / qualifiedLeads) * 100 : 0;
      const visitedRate = qualifiedLeads > 0 ? (visitedLeads / qualifiedLeads) * 100 : 0;

      // Filter Qualified / Valid leads only for Sales SOP & SLA evaluations (excluding JUNK)
      const agentQualifiedLeads = agentLeads.filter((l) => l.category !== 'JUNK');

      // SLA Compliance (< 2 Minutes derived from first response time on Qualified Leads)
      const slaMetCount = agentQualifiedLeads.filter((l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes <= 2).length;
      const slaBreachedCount = qualifiedLeads - slaMetCount;
      const slaComplianceRate = qualifiedLeads > 0 ? (slaMetCount / qualifiedLeads) * 100 : 0;

      // SOP Checklist (derived from SOP Status / Checklist ✅ and ❌ on Qualified Leads)
      const sopMetCount = agentQualifiedLeads.filter((l) => l.sopStatus === 'SOP_MET' || String(l.sopStatus || '').toLowerCase().includes('met')).length;
      const sopBreachedCount = qualifiedLeads - sopMetCount;
      const sopComplianceRate = qualifiedLeads > 0 ? (sopMetCount / qualifiedLeads) * 100 : 0;

      // Average Response Time on Qualified Leads
      const validRespLeads = agentQualifiedLeads.filter((l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes > 0);
      const avgResponseTimeMinutes = validRespLeads.length > 0
        ? validRespLeads.reduce((sum, l) => sum + (l.firstResponseTimeMinutes || 0), 0) / validRespLeads.length
        : 0;

      const mins = Math.floor(avgResponseTimeMinutes);
      const secs = Math.round((avgResponseTimeMinutes - mins) * 60);
      const avgResponseTimeFormatted = totalLeads > 0 && validRespLeads.length > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : '-';

      // Max Response Time for this agent
      const maxResponseTimeMinutes = validRespLeads.length > 0
        ? Math.max(...validRespLeads.map((l) => l.firstResponseTimeMinutes || 0))
        : 0;
      const maxMins = Math.floor(maxResponseTimeMinutes);
      const maxSecs = Math.round((maxResponseTimeMinutes - maxMins) * 60);
      const maxResponseTimeFormatted = maxResponseTimeMinutes > 0
        ? (maxResponseTimeMinutes >= 60
            ? `${Math.floor(maxResponseTimeMinutes / 60)}j ${Math.floor(maxResponseTimeMinutes % 60)}m`
            : `${maxMins}m ${maxSecs.toString().padStart(2, '0')}s`)
        : '-';

      // Leads with delayed responses
      const slowLeadsCount = agentQualifiedLeads.filter(
        (l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes > 2
      ).length;
      const slowLeadsAbove5mCount = agentQualifiedLeads.filter(
        (l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes > 5
      ).length;

      // Speed Category: FAST (<=2m), MODERATE (2-5m), SLOW (5-20m), VERY_SLOW (>20m)
      let replySpeedCategory: 'FAST' | 'MODERATE' | 'SLOW' | 'VERY_SLOW' = 'FAST';
      if (avgResponseTimeMinutes > 20) {
        replySpeedCategory = 'VERY_SLOW';
      } else if (avgResponseTimeMinutes > 5) {
        replySpeedCategory = 'SLOW';
      } else if (avgResponseTimeMinutes > 2) {
        replySpeedCategory = 'MODERATE';
      }

      // Cost Allocation
      const shareOfLeads = overallTotalLeadsInPeriod > 0 ? totalLeads / overallTotalLeadsInPeriod : 0;
      const allocatedCost = Math.round(shareOfLeads * currentPeriodOverallCost);
      const cpl = totalLeads > 0 && allocatedCost > 0 ? Math.round(allocatedCost / totalLeads) : 0;
      const cpql = qualifiedLeads > 0 && allocatedCost > 0 ? Math.round(allocatedCost / qualifiedLeads) : 0;
      const costPerVisited = visitedLeads > 0 && allocatedCost > 0 ? Math.round(allocatedCost / visitedLeads) : 0;

      // Ended leads by this agent
      const endedLeadsList = agentLeads.filter(isLeadEnded);
      const endedTotalLeads = endedLeadsList.length;
      const endedQualifiedLeads = endedLeadsList.filter((l) => l.category !== 'JUNK').length;
      const endedJunkLeads = endedLeadsList.filter((l) => l.category === 'JUNK').length;
      const endedFromQualifiedRate = qualifiedLeads > 0 ? (endedQualifiedLeads / qualifiedLeads) * 100 : 0;
      const endedTotalRate = totalLeads > 0 ? (endedTotalLeads / totalLeads) * 100 : 0;

      return {
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        agentAvatar: agent.avatar,
        agentEmail: agent.email,
        agentPhone: agent.phone,
        totalLeads,
        junkLeads,
        qualifiedLeads,
        coldLeads,
        warmLeads,
        prospectLeads,
        visitedLeads,
        junkRate,
        qualifiedRate,
        coldRate,
        warmRate,
        prospectRate,
        visitedRate,
        slaMetCount,
        slaBreachedCount,
        slaComplianceRate,
        sopMetCount,
        sopBreachedCount,
        sopComplianceRate,
        avgResponseTimeMinutes,
        avgResponseTimeFormatted,
        maxResponseTimeMinutes,
        maxResponseTimeFormatted,
        slowLeadsCount,
        slowLeadsAbove5mCount,
        replySpeedCategory,
        shareOfLeads,
        allocatedCost,
        cpl,
        cpql,
        costPerVisited,
        endedTotalLeads,
        endedQualifiedLeads,
        endedJunkLeads,
        endedFromQualifiedRate,
        endedTotalRate,
        assignedLeadsList: agentLeads,
      };
    });
  }, [allAgentsList, timeFilteredLeads, overallTotalLeadsInPeriod, currentPeriodOverallCost]);

  // Team-wide Average First Response Time on Qualified / Valid Leads
  const validTeamRespLeads = timeFilteredLeads.filter(
    (l) => l.category !== 'JUNK' && l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes > 0
  );
  const teamAvgResponseMinutes = validTeamRespLeads.length > 0
    ? validTeamRespLeads.reduce((sum, l) => sum + (l.firstResponseTimeMinutes || 0), 0) / validTeamRespLeads.length
    : 0;
  const teamAvgMins = Math.floor(teamAvgResponseMinutes);
  const teamAvgSecs = Math.round((teamAvgResponseMinutes - teamAvgMins) * 60);
  const teamAvgResponseFormatted = validTeamRespLeads.length > 0 ? `${teamAvgMins}m ${teamAvgSecs.toString().padStart(2, '0')}s` : '-';
  const isAvgResponseWithinSla = teamAvgResponseMinutes > 0 && teamAvgResponseMinutes <= 2.0;

  // 4. Filtered & Sorted Agent Metrics
  const processedAgentMetrics = useMemo(() => {
    let result = [...agentMetrics];

    // Filter by Specific Sales PIC
    if (selectedAgentFilter !== 'ALL') {
      result = result.filter(
        (a) =>
          a.agentName.toLowerCase().trim() === selectedAgentFilter.toLowerCase().trim() ||
          a.agentId === selectedAgentFilter
      );
    }

    // Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => a.agentName.toLowerCase().includes(q) || a.agentRole.toLowerCase().includes(q));
    }

    // Category Filter on Agent Level
    if (categoryFilter === 'QUALIFIED_ONLY') {
      result = result.filter((a) => a.qualifiedLeads > 0);
    } else if (categoryFilter === 'JUNK') {
      result = result.filter((a) => a.junkLeads > 0);
    } else if (categoryFilter === 'VISITED') {
      result = result.filter((a) => a.visitedLeads > 0);
    } else if (categoryFilter === 'PROSPECT') {
      result = result.filter((a) => a.prospectLeads > 0);
    } else if (categoryFilter === 'WARM') {
      result = result.filter((a) => a.warmLeads > 0);
    } else if (categoryFilter === 'COLD') {
      result = result.filter((a) => a.coldLeads > 0);
    }

    // SLA Filter
    if (slaFilter === 'MET') {
      result = result.filter((a) => a.slaComplianceRate >= 80);
    } else if (slaFilter === 'BREACHED') {
      result = result.filter((a) => a.slaComplianceRate < 80);
    }

    // SOP Filter
    if (sopFilter === 'MET') {
      result = result.filter((a) => a.sopComplianceRate >= 80);
    } else if (sopFilter === 'BREACHED') {
      result = result.filter((a) => a.sopComplianceRate < 80);
    }

    // Reply Speed Filter (Kategori Average Reply Time)
    if (replySpeedFilter === 'FAST') {
      result = result.filter((a) => a.avgResponseTimeMinutes > 0 && a.avgResponseTimeMinutes <= 2);
    } else if (replySpeedFilter === 'MODERATE') {
      result = result.filter((a) => a.avgResponseTimeMinutes > 2 && a.avgResponseTimeMinutes <= 5);
    } else if (replySpeedFilter === 'SLOW') {
      // Menampilkan sales yang rata-rata reply customer lambat (> 5m)
      result = result.filter((a) => a.avgResponseTimeMinutes > 5);
    } else if (replySpeedFilter === 'ABOVE_AVERAGE') {
      result = result.filter((a) => a.avgResponseTimeMinutes > teamAvgResponseMinutes);
    }

    // Sorting
    result.sort((a, b) => {
      const valA = a[sortField] as number;
      const valB = b[sortField] as number;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [agentMetrics, selectedAgentFilter, searchQuery, categoryFilter, slaFilter, sopFilter, replySpeedFilter, teamAvgResponseMinutes, sortField, sortAsc]);

  // 4.5 Filtered Individual Leads for SOP Audit & Verification
  const filteredLeadsForAudit = useMemo(() => {
    return timeFilteredLeads.filter((lead) => {
      // Sales PIC filter
      if (selectedAgentFilter !== 'ALL') {
        const targetAgent = allAgentsList.find(
          (a) => a.name.toLowerCase().trim() === selectedAgentFilter.toLowerCase().trim() || a.id === selectedAgentFilter
        );
        const matchesAgent = targetAgent
          ? isLeadAssignedToAgent(lead, targetAgent)
          : (lead.assignedToName || '').toLowerCase().trim() === selectedAgentFilter.toLowerCase().trim();
        if (!matchesAgent) return false;
      }

      // Category filter
      if (categoryFilter === 'QUALIFIED_ONLY' && lead.category === 'JUNK') return false;
      if (categoryFilter === 'JUNK' && lead.category !== 'JUNK') return false;
      if (['COLD', 'WARM', 'PROSPECT', 'VISITED'].includes(categoryFilter) && lead.category !== categoryFilter) return false;

      // SLA filter
      if (slaFilter === 'MET') {
        if (lead.category === 'JUNK' || lead.firstResponseTimeMinutes === undefined || lead.firstResponseTimeMinutes > 2) return false;
      } else if (slaFilter === 'BREACHED') {
        if (lead.category === 'JUNK' || (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes <= 2)) return false;
      }

      // SOP filter
      const isSopMet = lead.sopStatus === 'SOP_MET' || String(lead.sopStatus || '').toLowerCase().includes('met');
      if (sopFilter === 'MET') {
        if (lead.category === 'JUNK' || !isSopMet) return false;
      } else if (sopFilter === 'BREACHED') {
        if (lead.category === 'JUNK' || isSopMet) return false;
      }

      // Reply Speed Filter (Waktu Respon)
      if (replySpeedFilter === 'FAST') {
        if (lead.category === 'JUNK' || lead.firstResponseTimeMinutes === undefined || lead.firstResponseTimeMinutes > 2) return false;
      } else if (replySpeedFilter === 'MODERATE') {
        if (lead.category === 'JUNK' || lead.firstResponseTimeMinutes === undefined || lead.firstResponseTimeMinutes <= 2 || lead.firstResponseTimeMinutes > 5) return false;
      } else if (replySpeedFilter === 'SLOW') {
        if (lead.category === 'JUNK' || lead.firstResponseTimeMinutes === undefined || lead.firstResponseTimeMinutes <= 5) return false;
      } else if (replySpeedFilter === 'ABOVE_AVERAGE') {
        if (lead.category === 'JUNK' || lead.firstResponseTimeMinutes === undefined || lead.firstResponseTimeMinutes <= teamAvgResponseMinutes) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (lead.name || '').toLowerCase().includes(q) || (lead.customerName || '').toLowerCase().includes(q);
        const matchPhone = (lead.phone || '').toLowerCase().includes(q);
        const matchRemarks = (lead.remarksFu1 || lead.historyRemarks || '').toLowerCase().includes(q);
        const matchSales = (lead.assignedToName || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchRemarks && !matchSales) return false;
      }

      return true;
    });
  }, [timeFilteredLeads, selectedAgentFilter, categoryFilter, slaFilter, sopFilter, replySpeedFilter, teamAvgResponseMinutes, searchQuery]);

  // Overall Team Aggregates for Selected Period
  const teamTotalLeads = agentMetrics.reduce((sum, a) => sum + a.totalLeads, 0);
  const teamJunkLeads = agentMetrics.reduce((sum, a) => sum + a.junkLeads, 0);
  const teamQualifiedLeads = agentMetrics.reduce((sum, a) => sum + a.qualifiedLeads, 0);
  const teamColdLeads = agentMetrics.reduce((sum, a) => sum + a.coldLeads, 0);
  const teamWarmLeads = agentMetrics.reduce((sum, a) => sum + a.warmLeads, 0);
  const teamVisitedLeads = agentMetrics.reduce((sum, a) => sum + a.visitedLeads, 0);
  const teamProspectLeads = agentMetrics.reduce((sum, a) => sum + a.prospectLeads, 0);

  // Ended by Sales Team Aggregates
  const teamEndedTotalLeads = agentMetrics.reduce((sum, a) => sum + a.endedTotalLeads, 0);
  const teamEndedQualifiedLeads = agentMetrics.reduce((sum, a) => sum + a.endedQualifiedLeads, 0);
  const teamEndedJunkLeads = agentMetrics.reduce((sum, a) => sum + a.endedJunkLeads, 0);
  const teamEndedFromQualifiedRate = teamQualifiedLeads > 0 
    ? ((teamEndedQualifiedLeads / teamQualifiedLeads) * 100).toFixed(1) 
    : '0';
  const teamEndedTotalRate = teamTotalLeads > 0 
    ? ((teamEndedTotalLeads / teamTotalLeads) * 100).toFixed(1) 
    : '0';

  // SLA Aggregates (< 2 Menit from First Response Time on Qualified / Valid Leads)
  const teamSlaMet = agentMetrics.reduce((sum, a) => sum + a.slaMetCount, 0);
  const teamSlaBreached = agentMetrics.reduce((sum, a) => sum + a.slaBreachedCount, 0);
  const teamSlaRate = teamQualifiedLeads > 0 ? Math.round((teamSlaMet / teamQualifiedLeads) * 100) : 0;
  const teamSlaMetPct = teamQualifiedLeads > 0 ? ((teamSlaMet / teamQualifiedLeads) * 100).toFixed(1) : '0';
  const teamSlaBreachedPct = teamQualifiedLeads > 0 ? ((teamSlaBreached / teamQualifiedLeads) * 100).toFixed(1) : '0';

  // SOP Aggregates (from SOP Checklist ✅ and ❌ on Qualified / Valid Leads)
  const teamSopMet = agentMetrics.reduce((sum, a) => sum + a.sopMetCount, 0);
  const teamSopBreached = agentMetrics.reduce((sum, a) => sum + a.sopBreachedCount, 0);
  const teamSopRate = teamQualifiedLeads > 0 ? Math.round((teamSopMet / teamQualifiedLeads) * 100) : 0;
  const teamSopMetPct = teamQualifiedLeads > 0 ? ((teamSopMet / teamQualifiedLeads) * 100).toFixed(1) : '0';
  const teamSopBreachedPct = teamQualifiedLeads > 0 ? ((teamSopBreached / teamQualifiedLeads) * 100).toFixed(1) : '0';
  
  const activeAgentsCount = agentMetrics.filter((a) => a.totalLeads > 0).length || 1;
  const avgLeadsPerAgent = Math.round(teamTotalLeads / activeAgentsCount);
  const avgQualifiedPerAgent = Math.round(teamQualifiedLeads / activeAgentsCount);
  const avgAllocatedCostPerAgent = Math.round(currentPeriodOverallCost / activeAgentsCount);

  // Overall Team CPL & CPQL
  const teamCpl = teamTotalLeads > 0 && currentPeriodOverallCost > 0 ? Math.round(currentPeriodOverallCost / teamTotalLeads) : 0;
  const teamCpql = teamQualifiedLeads > 0 && currentPeriodOverallCost > 0 ? Math.round(currentPeriodOverallCost / teamQualifiedLeads) : 0;
  const teamCostPerVisited = teamVisitedLeads > 0 && currentPeriodOverallCost > 0 ? Math.round(currentPeriodOverallCost / teamVisitedLeads) : 0;

  // Best Performers & Slowest Responder Highlights
  const topIncomingAgent = useMemo(() => {
    return [...agentMetrics].sort((a, b) => b.totalLeads - a.totalLeads)[0] || agentMetrics[0];
  }, [agentMetrics]);

  const topSlaFastestAgent = useMemo(() => {
    return [...agentMetrics]
      .filter((a) => a.totalLeads > 0 && a.avgResponseTimeMinutes > 0)
      .sort((a, b) => a.avgResponseTimeMinutes - b.avgResponseTimeMinutes)[0] || agentMetrics[0];
  }, [agentMetrics]);

  // Sales PIC dengan Rata-rata Waktu Balas Paling Lama (Perlu Evaluasi)
  const topSlowestReplyAgent = useMemo(() => {
    return [...agentMetrics]
      .filter((a) => a.totalLeads > 0 && a.avgResponseTimeMinutes > 0)
      .sort((a, b) => b.avgResponseTimeMinutes - a.avgResponseTimeMinutes)[0] || null;
  }, [agentMetrics]);

  const topSopAgent = useMemo(() => {
    return [...agentMetrics]
      .filter((a) => a.totalLeads >= 5)
      .sort((a, b) => b.sopComplianceRate - a.sopComplianceRate || b.sopMetCount - a.sopMetCount)[0] || agentMetrics[0];
  }, [agentMetrics]);

  const topVisitedAgent = useMemo(() => {
    return [...agentMetrics].sort((a, b) => b.visitedLeads - a.visitedLeads || b.prospectLeads - a.prospectLeads)[0] || agentMetrics[0];
  }, [agentMetrics]);

  // Peringkat Seluruh Sales dari Waktu Balas Terlama ke Tercepat (Slowest to Fastest)
  const slowReplyRankedAgents = useMemo(() => {
    return [...agentMetrics]
      .filter((a) => a.totalLeads > 0 && a.avgResponseTimeMinutes > 0)
      .sort((a, b) => b.avgResponseTimeMinutes - a.avgResponseTimeMinutes);
  }, [agentMetrics]);

  // Chart Data for Bar Chart
  const comparisonChartData = useMemo(() => {
    return agentMetrics
      .filter((a) => a.totalLeads > 0)
      .map((a) => ({
        name: a.agentName.split(' ')[0],
        fullName: a.agentName,
        'Total Leads': a.totalLeads,
        'Qualified Leads': a.qualifiedLeads,
        'Junk Leads': a.junkLeads,
        'SOP Met': a.sopMetCount,
        'Biaya Iklan (Ribu Rp)': Math.round(a.allocatedCost / 1000),
      }));
  }, [agentMetrics]);

  // Sorting helper
  const handleSort = (field: keyof AgentPerformanceMetric) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortIcon = (field: keyof AgentPerformanceMetric) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />;
    return <ArrowUpDown className={`w-3 h-3 ${sortAsc ? 'text-amber-600 rotate-180' : 'text-amber-600'} transition-transform`} />;
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. Header & Period Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-400">
                PERFORMA SALES
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Evaluasi Kinerja Sales, SLA Respon &amp; Alokasi Biaya Iklan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Evaluasi &amp; Matriks Performa Tim Sales
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis rata-rata performa total leads, distribusi kualitas (Qualified vs Junk), kepatuhan SOP respon &lt; 2 menit, serta alokasi biaya iklan masing-masing sales agent.
            </p>
          </div>

          {/* Controls: Detailed Calendar Date Range Picker & Export PDF */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Detailed Calendar Date Range Picker matching user's exact specification */}
            <DetailedDateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              isAllTime={selectedMonth === 'ALL' && selectedWeekId === 'ALL'}
              currentMonthHint={selectedMonth !== 'ALL' ? selectedMonth : '2026-09'}
              onApply={handleDateRangeApply}
            />

            {/* Active Period Info Badge */}
            <div className="text-xs text-amber-900 font-mono flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-3 py-2 rounded-xl shrink-0">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{selectedMonth === 'ALL' && selectedWeekId === 'ALL' ? 'Semua Data' : `${customStartDate} s/d ${customEndDate}`}</span>
              <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[11px] font-bold">
                {timeFilteredLeads.length} Leads
              </span>
            </div>

            {/* PDF Export Button */}
            <button
              onClick={() => {
                const periodText = selectedWeekId === 'ALL' 
                  ? `${getMonthLabel(selectedMonth)} (Semua Minggu)` 
                  : `${currentWeekMeta.shortLabel} (${currentWeekMeta.displayRange})`;
                generateSalesPerformancePdfReport({
                  periodLabel: periodText,
                  totalPeriodCost: currentPeriodOverallCost,
                  metrics: agentMetrics.map((a) => ({
                    agentName: a.agentName,
                    agentRole: a.agentRole,
                    totalLeads: a.totalLeads,
                    shareOfLeadsPct: a.shareOfLeads * 100,
                    qualifiedLeads: a.qualifiedLeads,
                    qualifiedRate: a.qualifiedRate,
                    junkLeads: a.junkLeads,
                    junkRate: a.junkRate,
                    coldLeads: a.coldLeads,
                    warmLeads: a.warmLeads,
                    prospectLeads: a.prospectLeads,
                    visitedLeads: a.visitedLeads,
                    slaMetCount: a.slaMetCount,
                    slaBreachedCount: a.slaBreachedCount,
                    slaComplianceRate: a.slaComplianceRate,
                    sopMetCount: a.sopMetCount,
                    sopBreachedCount: a.sopBreachedCount,
                    sopComplianceRate: a.sopComplianceRate,
                    avgResponseTimeFormatted: a.avgResponseTimeFormatted,
                    allocatedCost: a.allocatedCost,
                    cpl: a.cpl,
                    cpql: a.cpql,
                    costPerVisited: a.costPerVisited,
                  })),
                  teamTotalLeads,
                  teamQualifiedLeads,
                  teamJunkLeads,
                  teamSlaMet,
                  teamSlaBreached,
                  teamSlaRate,
                  teamSlaMetPct,
                  teamSlaBreachedPct,
                  teamSopMet,
                  teamSopBreached,
                  teamSopRate,
                  teamSopMetPct,
                  teamSopBreachedPct,
                  teamAvgResponseFormatted,
                  teamAvgResponseMinutes,
                  teamCold: teamColdLeads,
                  teamWarm: teamWarmLeads,
                  teamProspect: teamProspectLeads,
                  teamVisited: teamVisitedLeads,
                  teamCpl,
                  teamCpql,
                  teamCostPerVisited,
                  leads: timeFilteredLeads,
                });
              }}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Bar (Rata-rata & Akumulasi Keseluruhan Performa) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Total Inbound Leads & Avg per Agent */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Total Leads Tim Sales</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {teamTotalLeads}
            </p>
            <span className="text-xs text-slate-500">Leads Terdistribusi</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 font-semibold">
            <span className="text-emerald-700">
              {teamQualifiedLeads} Valid ({teamTotalLeads > 0 ? ((teamQualifiedLeads / teamTotalLeads) * 100).toFixed(1) : 0}%)
            </span>
            <span className="text-slate-500">
              Avg: ~{avgLeadsPerAgent} leads/PIC
            </span>
          </div>
        </div>

        {/* SLA First Response (< 2 Menit) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">SLA Respon (&lt; 2 Menit)</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-700 leading-tight">
              {teamSlaRate}%
            </p>
            <span className="text-xs text-slate-500">({teamSlaMetPct}% dari {teamQualifiedLeads} Valid)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-600">
            <span className="text-emerald-700 font-bold">&le;2m: {teamSlaMet} Leads</span>
            <span className="text-rose-600 font-bold">&gt;2m: {teamSlaBreached} Leads</span>
          </div>
        </div>

        {/* Kepatuhan SOP (Checklist) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Kepatuhan SOP (Checklist)</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-teal-700 leading-tight">
              {teamSopRate}%
            </p>
            <span className="text-xs text-slate-500">({teamSopMetPct}% dari {teamQualifiedLeads} Valid)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-600">
            <span className="text-teal-700 font-bold">✅ {teamSopMet} Sesuai</span>
            <span className="text-rose-600 font-bold">❌ {teamSopBreached} Tidak</span>
          </div>
        </div>

        {/* Leads Di-Ended oleh Sales */}
        <div className="bg-indigo-50/70 rounded-xl border border-indigo-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-indigo-950 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Leads Di-Ended Sales</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-indigo-700 leading-tight">
              {teamEndedQualifiedLeads}
            </p>
            <span className="text-xs text-indigo-950 font-bold">({teamEndedFromQualifiedRate}% dari Valid)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-indigo-200/80 text-indigo-900 font-semibold">
            <span>Total Ended:</span>
            <span className="font-bold text-slate-900">{teamEndedTotalLeads} Leads ({teamEndedTotalRate}%)</span>
          </div>
        </div>

        {/* Overall CPL & CPQL Efficiency */}
        <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">CPL &amp; CPQL Tim</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-800 leading-tight font-mono">
              {teamCpl > 0 ? formatRupiah(teamCpl) : (currentPeriodOverallCost === 0 ? 'Rp 0' : '-')}
            </p>
            <span className="text-xs text-amber-700">/lead</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-200/80 text-amber-900 font-semibold">
            <span>CPQL (Valid):</span>
            <span className="font-bold text-emerald-800 font-mono">{teamCpql > 0 ? formatRupiah(teamCpql) : (currentPeriodOverallCost === 0 ? 'Rp 0' : '-')}</span>
          </div>
        </div>

      </div>

      {/* 3. Leaderboard & Highlights (5 Kategori Highlight Sales Termasuk Respon Lambat) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* 1. Top Incoming Leads */}
        {topIncomingAgent && (
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-xl p-3.5 border border-slate-700 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <Award className="w-3 h-3" /> Top Incoming Leads
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {teamTotalLeads > 0 ? ((topIncomingAgent.totalLeads / teamTotalLeads) * 100).toFixed(1) : 0}% Tim
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <img src={topIncomingAgent.agentAvatar} alt={topIncomingAgent.agentName} className="w-9 h-9 rounded-full border border-amber-400 object-cover" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-white truncate">{topIncomingAgent.agentName}</h4>
                  <p className="text-[10px] text-slate-400">{topIncomingAgent.agentRole}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-300">Total Leads:</span>
              <span className="font-black text-amber-400 text-sm">{topIncomingAgent.totalLeads} Leads ({topIncomingAgent.qualifiedLeads} Valid)</span>
            </div>
          </div>
        )}

        {/* 2. Top SLA Tercepat */}
        {topSlaFastestAgent && (
          <div className="bg-white rounded-xl p-3.5 border border-blue-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-600" /> Top SLA Tercepat
                </span>
                <span className="text-[10px] font-black text-blue-700 font-mono">
                  {topSlaFastestAgent.slaComplianceRate.toFixed(0)}% SLA Met
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <img src={topSlaFastestAgent.agentAvatar} alt={topSlaFastestAgent.agentName} className="w-9 h-9 rounded-full border border-blue-400 object-cover" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{topSlaFastestAgent.agentName}</h4>
                  <p className="text-[10px] text-slate-500">Avg Respon: {topSlaFastestAgent.avgResponseTimeFormatted}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Sesuai SLA (&le;2m):</span>
              <span className="font-black text-blue-700">{topSlaFastestAgent.slaMetCount} dari {topSlaFastestAgent.qualifiedLeads} Leads Valid</span>
            </div>
          </div>
        )}

        {/* 3. Highlight Waktu Balas Paling Lama (Perlu Evaluasi) */}
        {topSlowestReplyAgent && (
          <div className="bg-rose-50/60 rounded-xl p-3.5 border-2 border-rose-300 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <Hourglass className="w-3 h-3" /> Reply Terlama
                </span>
                <span className="text-[10px] font-bold text-rose-700 font-mono">
                  Perlu Evaluasi
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <img src={topSlowestReplyAgent.agentAvatar} alt={topSlowestReplyAgent.agentName} className="w-9 h-9 rounded-full border-2 border-rose-400 object-cover" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{topSlowestReplyAgent.agentName}</h4>
                  <p className="text-[10px] text-rose-600 font-semibold font-mono">Avg Reply: {topSlowestReplyAgent.avgResponseTimeFormatted}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Respon Maksimal:</span>
              <span className="font-black text-rose-700 font-mono">{topSlowestReplyAgent.maxResponseTimeFormatted}</span>
            </div>
          </div>
        )}

        {/* 4. Top SOP */}
        {topSopAgent && (
          <div className="bg-white rounded-xl p-3.5 border border-teal-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" /> Top SOP
                </span>
                <span className="text-[10px] font-black text-teal-700 font-mono">
                  {topSopAgent.sopComplianceRate.toFixed(0)}% SOP Met
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <img src={topSopAgent.agentAvatar} alt={topSopAgent.agentName} className="w-9 h-9 rounded-full border border-teal-400 object-cover" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{topSopAgent.agentName}</h4>
                  <p className="text-[10px] text-slate-500">Checklist SOP: {topSopAgent.sopMetCount} Leads ✅</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Sesuai SOP (✅):</span>
              <span className="font-black text-teal-700">{topSopAgent.sopMetCount} dari {topSopAgent.qualifiedLeads} Leads Valid</span>
            </div>
          </div>
        )}

        {/* 5. Top Visited */}
        {topVisitedAgent && (
          <div className="bg-white rounded-xl p-3.5 border border-purple-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-600" /> Top Visited
                </span>
                <span className="text-[10px] font-black text-purple-700 font-mono">
                  {topVisitedAgent.visitedLeads} Visited Deals
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <img src={topVisitedAgent.agentAvatar} alt={topVisitedAgent.agentName} className="w-9 h-9 rounded-full border border-purple-400 object-cover" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{topVisitedAgent.agentName}</h4>
                  <p className="text-[10px] text-slate-500">{topVisitedAgent.visitedLeads} Show Unit Visited</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Prospek Panas:</span>
              <span className="font-black text-purple-700">{topVisitedAgent.visitedLeads + topVisitedAgent.warmLeads} Leads (V+W)</span>
            </div>
          </div>
        )}

      </div>

      {/* Rangkuman Penjualan Source Digital (Top Sales & Omset Excl PPN) */}
      <DigitalSalesPerformanceSummary />

      {/* 4. Filter & Search Bar for Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama sales PIC..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Filter:</span>
          
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-amber-400 shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({agentMetrics.length})
          </button>

          <button
            onClick={() => setCategoryFilter('QUALIFIED_ONLY')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'QUALIFIED_ONLY'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Qualified Leads
          </button>

          <button
            onClick={() => setCategoryFilter('JUNK')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'JUNK'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Junk Leads
          </button>

          {/* Sales PIC Filter Dropdown */}
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="text-xs font-bold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Sales PIC: Semua ({allAgentsList.length})</option>
            {allAgentsList.map((agent) => (
              <option key={agent.id} value={agent.name}>
                Sales: {agent.name}
              </option>
            ))}
          </select>

          {/* SLA Filter Toggle */}
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value as any)}
            className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">SLA: Semua</option>
            <option value="MET">SLA: &ge; 80% (&le;2m)</option>
            <option value="BREACHED">SLA: &lt; 80% (&gt;2m)</option>
          </select>

          {/* SOP Filter Toggle */}
          <select
            value={sopFilter}
            onChange={(e) => setSopFilter(e.target.value as any)}
            className="text-xs font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">SOP: Semua</option>
            <option value="MET">SOP: &ge; 80% (✅)</option>
            <option value="BREACHED">SOP: &lt; 80% (❌)</option>
          </select>

          {/* Reply Speed Filter Toggle */}
          <select
            value={replySpeedFilter}
            onChange={(e) => setReplySpeedFilter(e.target.value as any)}
            className="text-xs font-bold bg-rose-50 text-rose-900 px-2.5 py-1 rounded-lg border border-rose-300 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Waktu Balas: Semua</option>
            <option value="SLOW">⏳ Rata-rata Lambat (&gt;5m)</option>
            <option value="ABOVE_AVERAGE">⚠️ &gt; Rata-rata Tim ({teamAvgResponseFormatted})</option>
            <option value="MODERATE">⏱️ Sedang (2 - 5m)</option>
            <option value="FAST">⚡ Cepat (&le;2m)</option>
          </select>
        </div>

      </div>

      {/* 5. Tabel Matriks & Rincian Performa Sales Lengkap */}
      <div id="sales-metrics-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs scroll-mt-20">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Matriks Evaluasi Kinerja &amp; Alokasi Biaya Iklan Tim Sales</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Klik kolom header untuk mengurutkan (sort), atau klik baris sales untuk melihat daftar leads yang ditugaskan.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-900">{processedAgentMetrics.length}</span> Sales PIC
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200 select-none">
                <th className="py-3 px-3 text-center">NO</th>
                <th className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('agentName')}>
                  <div className="flex items-center gap-1">
                    <span>SALES PIC</span>
                    {getSortIcon('agentName')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('totalLeads')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>TOTAL LEADS</span>
                    {getSortIcon('totalLeads')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('qualifiedLeads')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>QUALIFIED</span>
                    {getSortIcon('qualifiedLeads')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('endedQualifiedLeads')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>ENDED QUALIFIED</span>
                    {getSortIcon('endedQualifiedLeads')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('junkLeads')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>JUNK</span>
                    {getSortIcon('junkLeads')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('endedTotalLeads')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>TOTAL ENDED</span>
                    {getSortIcon('endedTotalLeads')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center">
                  <span>COLD / WARM / PROSPECT / VISIT</span>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('slaComplianceRate')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>SLA (&le; 2M)</span>
                    {getSortIcon('slaComplianceRate')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('sopComplianceRate')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>SOP (✅ / ❌)</span>
                    {getSortIcon('sopComplianceRate')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('avgResponseTimeMinutes')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>AVG RESPON</span>
                    {getSortIcon('avgResponseTimeMinutes')}
                  </div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('allocatedCost')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>BIAYA IKLAN</span>
                    {getSortIcon('allocatedCost')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/70" onClick={() => handleSort('cpql')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>CPQL (VALID)</span>
                    {getSortIcon('cpql')}
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedAgentMetrics.map((agent, index) => (
                <tr 
                  key={agent.agentId} 
                  onClick={() => setInspectingAgent(agent)}
                  className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                >
                  {/* Rank No */}
                  <td className="py-3 px-3 text-center font-bold text-slate-400 text-xs">
                    {index + 1}
                  </td>

                  {/* Sales Agent Info */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <img 
                        src={agent.agentAvatar} 
                        alt={agent.agentName} 
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" 
                      />
                      <div className="truncate">
                        <div className="font-black text-slate-900 text-xs truncate group-hover:text-amber-800 transition-colors">
                          {agent.agentName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                          {agent.agentRole}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Total Leads */}
                  <td className="py-3 px-2.5 text-center">
                    <span className="font-black text-slate-900 text-sm">
                      {agent.totalLeads}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-semibold">
                      {teamTotalLeads > 0 ? ((agent.totalLeads / teamTotalLeads) * 100).toFixed(1) : 0}% tim
                    </span>
                  </td>

                  {/* Qualified Leads */}
                  <td className="py-3 px-2.5 text-center">
                    <span className="font-black text-emerald-700 text-sm">
                      {agent.qualifiedLeads}
                    </span>
                    <span className="block text-[9px] text-emerald-600 font-semibold">
                      {agent.qualifiedRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Ended Qualified Leads */}
                  <td className="py-3 px-2.5 text-center">
                    <span className="font-black text-indigo-700 text-sm">
                      {agent.endedQualifiedLeads}
                    </span>
                    <span className="block text-[9px] text-indigo-600 font-semibold">
                      {agent.endedFromQualifiedRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Junk Leads */}
                  <td className="py-3 px-2.5 text-center">
                    <span className="font-black text-rose-600 text-sm">
                      {agent.junkLeads}
                    </span>
                    <span className="block text-[9px] text-rose-400 font-semibold">
                      {agent.junkRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Total Leads Ended by Sales */}
                  <td className="py-3 px-2.5 text-center">
                    <span className="font-black text-indigo-900 text-sm">
                      {agent.endedTotalLeads}
                    </span>
                    <span className="block text-[9px] text-indigo-600 font-semibold">
                      {agent.endedTotalRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* 4-Tier Breakdown (Cold / Warm / Prospect / Visit) */}
                  <td className="py-3 px-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[9px] font-bold" title="Cold Leads">
                        C:{agent.coldLeads}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 text-[9px] font-bold" title="Warm Leads">
                        W:{agent.warmLeads}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 text-[9px] font-bold" title="Prospect Leads">
                        P:{agent.prospectLeads}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 text-[9px] font-bold" title="Visited Leads">
                        V:{agent.visitedLeads}
                      </span>
                    </div>
                  </td>

                  {/* SLA (< 2m from First Response Time) - 1 Line Format */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        agent.slaComplianceRate >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {agent.slaComplianceRate.toFixed(0)}% SLA
                      </span>
                      <span className="text-[10px] text-slate-600 font-semibold">
                        &le;2m: <b className="text-emerald-700">{agent.slaMetCount}</b> | &gt;2m: <b className="text-rose-700">{agent.slaBreachedCount}</b>
                      </span>
                    </div>
                  </td>

                  {/* SOP (Checklist ✅ / ❌) - 1 Line Format */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        agent.sopComplianceRate >= 80
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {agent.sopComplianceRate.toFixed(0)}% SOP
                      </span>
                      <span className="text-[10px] text-slate-600 font-semibold">
                        ✅ <b className="text-teal-700">{agent.sopMetCount}</b> | ❌ <b className="text-rose-700">{agent.sopBreachedCount}</b>
                      </span>
                    </div>
                  </td>

                  {/* Avg Response Time */}
                  <td className="py-3 px-2.5 text-center font-mono text-[11px] text-slate-700 font-bold">
                    <span className={agent.avgResponseTimeMinutes <= 2 ? 'text-emerald-700 font-black' : 'text-rose-600'}>
                      {agent.avgResponseTimeFormatted}
                    </span>
                  </td>

                  {/* Biaya Iklan Sales (Allocated Cost) */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-black text-xs text-slate-900">
                      {agent.allocatedCost > 0 ? formatRupiah(agent.allocatedCost) : (currentPeriodOverallCost === 0 ? 'Rp 0' : '-')}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-mono">
                      {currentPeriodOverallCost > 0 ? ((agent.allocatedCost / currentPeriodOverallCost) * 100).toFixed(1) : 0}% budget
                    </span>
                  </td>

                  {/* CPQL (Cost per Qualified Lead) */}
                  <td className="py-3 px-2.5 text-center">
                    <span className="font-mono font-bold text-xs text-emerald-800">
                      {agent.cpql > 0 ? formatRupiah(agent.cpql) : (currentPeriodOverallCost === 0 && agent.qualifiedLeads > 0 ? 'Rp 0' : '-')}
                    </span>
                    <span className="block text-[9px] text-slate-400">
                      CPL: {agent.cpl > 0 ? formatRupiah(agent.cpl) : '-'}
                    </span>
                  </td>

                  {/* Action Button */}
                  <td className="py-3 px-2.5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingAgent(agent);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Lihat Rincian Leads Sales"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* OVERALL TEAM SUMMARY ROW */}
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-amber-400">
                <td colSpan={2} className="py-3.5 px-3.5 font-black uppercase text-xs tracking-wider text-amber-400">
                  TOTAL / RATA-RATA TIM SALES
                </td>
                <td className="py-3.5 px-2.5 text-center font-black text-sm text-white">
                  {teamTotalLeads}
                </td>
                <td className="py-3.5 px-2.5 text-center font-black text-sm text-emerald-400">
                  {teamQualifiedLeads}
                </td>
                <td className="py-3.5 px-2.5 text-center font-black text-sm text-indigo-300">
                  {teamEndedQualifiedLeads}
                  <span className="block text-[9px] text-indigo-400 font-mono">
                    {teamEndedFromQualifiedRate}%
                  </span>
                </td>
                <td className="py-3.5 px-2.5 text-center font-black text-sm text-rose-400">
                  {teamJunkLeads}
                </td>
                <td className="py-3.5 px-2.5 text-center font-black text-sm text-indigo-300">
                  {teamEndedTotalLeads}
                  <span className="block text-[9px] text-indigo-400 font-mono">
                    {teamTotalLeads > 0 ? ((teamEndedTotalLeads / teamTotalLeads) * 100).toFixed(1) : 0}%
                  </span>
                </td>
                <td className="py-3.5 px-2.5 text-center font-mono text-[9px] text-slate-300">
                  {agentMetrics.reduce((s, a) => s + a.coldLeads, 0)}C / {agentMetrics.reduce((s, a) => s + a.warmLeads, 0)}W / {teamProspectLeads}P / {teamVisitedLeads}V
                </td>
                <td className="py-3.5 px-3 text-center font-black text-xs text-emerald-400 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-center">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                      {teamSlaMetPct}% SLA
                    </span>
                    <span className="text-[10px] text-slate-300 font-normal">
                      &le;2m: <b className="text-emerald-400">{teamSlaMet}</b> | &gt;2m: <b className="text-rose-400">{teamSlaBreached}</b>
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center font-black text-xs text-teal-400 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-center">
                    <span className="px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 text-[10px] font-black border border-teal-500/30">
                      {teamSopMetPct}% SOP
                    </span>
                    <span className="text-[10px] text-slate-300 font-normal">
                      ✅ <b className="text-teal-300">{teamSopMet}</b> | ❌ <b className="text-rose-400">{teamSopBreached}</b>
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-2.5 text-center font-mono text-xs text-slate-200 font-bold">
                  {teamAvgResponseFormatted}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-black text-xs text-white">
                  {formatRupiah(currentPeriodOverallCost)}
                </td>
                <td className="py-3.5 px-2.5 text-center font-mono font-black text-xs text-amber-300">
                  {teamCpql > 0 ? formatRupiah(teamCpql) : (currentPeriodOverallCost === 0 ? 'Rp 0' : '-')}
                </td>
                <td className="py-3.5 px-2.5"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6.5. Tabel Audit Checklist SOP Sales (Berdasarkan PIC & Prospek) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-sm bg-teal-900 text-teal-300 text-[10px] font-black uppercase tracking-wider">
                AUDIT SOP SALES
              </span>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Daftar Detail Leads &amp; Verifikasi Checklist SOP Sales</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rincian status kepatuhan SOP per prospek (✅ Sesuai / ❌ Tidak Sesuai). Dapat difilter per nama sales agent di bawah ini.
            </p>
          </div>

          {/* Quick Filters for SOP Audit Table */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sales PIC Filter Select */}
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-300 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Sales PIC ({allAgentsList.length})</option>
              {allAgentsList.map((agent) => (
                <option key={agent.id} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>

            {/* SOP Filter Select */}
            <select
              value={sopFilter}
              onChange={(e) => setSopFilter(e.target.value as any)}
              className="text-xs font-bold bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg border border-teal-300 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">SOP: Semua</option>
              <option value="MET">✅ Hanya Sesuai SOP</option>
              <option value="BREACHED">❌ Hanya Tidak Sesuai SOP</option>
            </select>

            {/* Reply Speed Filter Select */}
            <select
              value={replySpeedFilter}
              onChange={(e) => setReplySpeedFilter(e.target.value as any)}
              className="text-xs font-bold bg-rose-50 text-rose-900 px-3 py-1.5 rounded-lg border border-rose-300 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Waktu Balas: Semua</option>
              <option value="SLOW">⏳ Respon Lambat (&gt; 5m)</option>
              <option value="ABOVE_AVERAGE">⚠️ &gt; Rata-rata Tim ({teamAvgResponseFormatted})</option>
              <option value="MODERATE">⏱️ Sedang (2 - 5m)</option>
              <option value="FAST">⚡ Cepat (&le; 2m)</option>
            </select>

            <span className="text-xs text-slate-500 font-medium ml-1">
              Menampilkan <span className="font-bold text-slate-900">{filteredLeadsForAudit.length}</span> data
            </span>
          </div>
        </div>

        {/* Mini Audit Summary Bar */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600 flex-wrap">
            <span>
              Total Prospek: <strong className="text-slate-900">{filteredLeadsForAudit.length}</strong>
            </span>
            <span>
              Qualified: <strong className="text-emerald-700">{filteredLeadsForAudit.filter(l => l.category !== 'JUNK').length}</strong>
            </span>
            <span>
              ✅ Sesuai SOP: <strong className="text-teal-700">{filteredLeadsForAudit.filter(l => l.category !== 'JUNK' && (l.sopStatus === 'SOP_MET' || String(l.sopStatus || '').toLowerCase().includes('met'))).length}</strong>
            </span>
            <span>
              ❌ Tidak Sesuai SOP: <strong className="text-rose-700">{filteredLeadsForAudit.filter(l => l.category !== 'JUNK' && l.sopStatus !== 'SOP_MET' && !String(l.sopStatus || '').toLowerCase().includes('met')).length}</strong>
            </span>
            <span>
              Junk / Non-Evaluasi: <strong className="text-slate-500">{filteredLeadsForAudit.filter(l => l.category === 'JUNK').length}</strong>
            </span>
            {replySpeedFilter !== 'ALL' && (
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold flex items-center gap-1">
                Filter: {replySpeedFilter === 'SLOW' ? '⏳ Lambat (>5m)' : replySpeedFilter === 'ABOVE_AVERAGE' ? `⚠️ > Tim (${teamAvgResponseFormatted})` : replySpeedFilter === 'MODERATE' ? '⏱️ Sedang (2-5m)' : '⚡ Cepat (≤2m)'}
                <button onClick={() => setReplySpeedFilter('ALL')} className="text-rose-400 hover:text-rose-700 font-black ml-1 cursor-pointer">×</button>
              </span>
            )}
          </div>

          {selectedAgentFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedAgentFilter('ALL')}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
            >
              Reset Filter Sales PIC
            </button>
          )}
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200 shadow-2xs">
              <tr>
                <th className="py-2.5 px-3 text-center">NO</th>
                <th className="py-2.5 px-3">TANGGAL &amp; WAKTU</th>
                <th className="py-2.5 px-3">PROSPEK &amp; WA</th>
                <th className="py-2.5 px-3">SALES PIC</th>
                <th className="py-2.5 px-3 text-center">KATEGORI</th>
                <th className="py-2.5 px-3 text-center">STATUS RESOLVE</th>
                <th className="py-2.5 px-3 text-center">1ST RESPON</th>
                <th className="py-2.5 px-3 text-center">SLA (&le;2M)</th>
                <th className="py-2.5 px-3 text-center">SOP SALES (PDF/EXCEL)</th>
                <th className="py-2.5 px-3">SOURCE IKLAN</th>
                <th className="py-2.5 px-3">REMARKS FU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeadsForAudit.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data leads yang sesuai dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLeadsForAudit.map((l, index) => {
                  const isSlaMet = l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes <= 2;
                  const isSopMet = l.sopStatus === 'SOP_MET' || String(l.sopStatus || '').toLowerCase().includes('met');
                  return (
                    <tr
                      key={l.id}
                      onClick={() => onSelectLead?.(l)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400 text-[11px]">
                        {l.leadNumber || index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {l.dateContact}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">{l.customerName || l.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{l.phone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 text-xs">
                          {l.assignedToName || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${
                          l.category === 'VISITED' ? 'bg-purple-100 text-purple-800' :
                          l.category === 'PROSPECT' ? 'bg-emerald-100 text-emerald-800' :
                          l.category === 'WARM' ? 'bg-amber-100 text-amber-800' :
                          l.category === 'COLD' ? 'bg-slate-100 text-slate-700' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {l.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[11px] font-semibold text-slate-700">
                        {l.resolveStatus}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-slate-700">
                        {l.firstResponseTimeFormatted || (l.firstResponseTimeMinutes !== undefined ? `${l.firstResponseTimeMinutes}m` : '-')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.category === 'JUNK' ? (
                          <span className="text-slate-400 font-mono text-[10px]">-</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            isSlaMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isSlaMet ? '≤2m' : '>2m'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.category === 'JUNK' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                            - Non Evaluasi
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-flex items-center gap-1 ${
                            isSopMet ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            <span>{isSopMet ? '✅ Sesuai' : '❌ Tidak'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 font-medium whitespace-nowrap">
                        {l.adSource || l.primaryChannel}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-700 max-w-xs truncate" title={l.remarksFu1 || l.historyRemarks}>
                        {l.remarksFu1 || l.historyRemarks || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Klik baris mana saja untuk membuka detail data prospek &amp; log chat WhatsApp.</span>
          <span>Menampilkan total {filteredLeadsForAudit.length} data</span>
        </div>
      </div>

      {/* 7. Inspector Modal: Detailed Leads List for Selected Agent */}
      {inspectingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={inspectingAgent.agentAvatar} 
                  alt={inspectingAgent.agentName} 
                  className="w-11 h-11 rounded-full border-2 border-amber-400 object-cover" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{inspectingAgent.agentName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                      {inspectingAgent.agentRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Total: {inspectingAgent.totalLeads} Leads ({inspectingAgent.qualifiedLeads} Qualified, {inspectingAgent.junkLeads} Junk) | Ended: {inspectingAgent.endedQualifiedLeads} Qualified ({inspectingAgent.endedFromQualifiedRate.toFixed(1)}%) | SOP Met: {inspectingAgent.sopComplianceRate.toFixed(0)}%
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setInspectingAgent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Metrics Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Alokasi Biaya Iklan</span>
                <span className="font-mono font-black text-amber-900 text-xs">{formatRupiah(inspectingAgent.allocatedCost)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">CPL / CPQL</span>
                <span className="font-mono font-black text-slate-900 text-xs">
                  {inspectingAgent.cpl > 0 ? formatRupiah(inspectingAgent.cpl) : '-'} / <span className="text-emerald-700">{inspectingAgent.cpql > 0 ? formatRupiah(inspectingAgent.cpql) : '-'}</span>
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Ended Sales</span>
                <span className="font-mono font-black text-indigo-700 text-xs">
                  {inspectingAgent.endedQualifiedLeads} <span className="text-[10px] text-indigo-600 font-semibold">({inspectingAgent.endedFromQualifiedRate.toFixed(1)}%)</span>
                </span>
                <span className="text-[9px] text-slate-400 block">Total Ended: {inspectingAgent.endedTotalLeads}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Reply Time</span>
                <span className={`font-mono font-black text-xs ${inspectingAgent.avgResponseTimeMinutes > 5 ? 'text-rose-700' : inspectingAgent.avgResponseTimeMinutes > 2 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {inspectingAgent.avgResponseTimeFormatted}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Respon Terlama</span>
                <span className="font-mono font-black text-rose-700 text-xs">{inspectingAgent.maxResponseTimeFormatted}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Lead Respon Lambat</span>
                <span className="font-mono font-black text-xs text-slate-800">
                  &gt;2m: <b className="text-amber-700">{inspectingAgent.slowLeadsCount}</b> | &gt;5m: <b className="text-rose-700">{inspectingAgent.slowLeadsAbove5mCount}</b>
                </span>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-y-auto p-4 flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center">NO</th>
                    <th className="py-2.5 px-3">TANGGAL &amp; WAKTU</th>
                    <th className="py-2.5 px-3">PROSPEK &amp; WA</th>
                    <th className="py-2.5 px-3 text-center">KATEGORI</th>
                    <th className="py-2.5 px-3 text-center">STATUS RESOLVE</th>
                    <th className="py-2.5 px-3 text-center">1ST RESPON</th>
                    <th className="py-2.5 px-3 text-center">SLA (&le;2M)</th>
                    <th className="py-2.5 px-3 text-center">SOP CHECKLIST</th>
                    <th className="py-2.5 px-3">SOURCE IKLAN</th>
                    <th className="py-2.5 px-3">REMARKS FU 1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...inspectingAgent.assignedLeadsList]
                    .sort((a, b) => {
                      const timeA = parseLeadDate(a.dateContact)?.getTime() || 0;
                      const timeB = parseLeadDate(b.dateContact)?.getTime() || 0;
                      return timeB - timeA;
                    })
                    .map((l, i) => {
                      const isSlaMet = l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes <= 2;
                      const isSopMet = l.sopStatus === 'SOP_MET' || String(l.sopStatus || '').toLowerCase().includes('met');
                      return (
                        <tr 
                          key={l.id} 
                          onClick={() => onSelectLead?.(l)}
                          className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400 text-[11px]">
                            {i + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {l.dateContact}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 text-xs">{l.customerName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{l.phone}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${
                              l.category === 'VISITED' ? 'bg-purple-100 text-purple-800' :
                              l.category === 'PROSPECT' ? 'bg-emerald-100 text-emerald-800' :
                              l.category === 'WARM' ? 'bg-amber-100 text-amber-800' :
                              l.category === 'COLD' ? 'bg-slate-100 text-slate-700' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {l.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-[11px] font-semibold text-slate-700">
                            <div>{l.resolveStatus}</div>
                            {isLeadEnded(l) && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                                ENDED
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-slate-700">
                            {l.firstResponseTimeFormatted || (l.firstResponseTimeMinutes !== undefined ? `${l.firstResponseTimeMinutes}m` : '-')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {l.category === 'JUNK' ? (
                              <span className="text-slate-400 font-mono text-[10px]">-</span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                isSlaMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isSlaMet ? '≤2m (Met)' : '>2m (Breach)'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {l.category === 'JUNK' ? (
                              <span className="text-slate-400 font-mono text-[10px]">-</span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                isSopMet ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isSopMet ? '✅ Sesuai' : '❌ Tidak'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 font-medium">
                            {l.adSource || l.primaryChannel}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-700 max-w-xs truncate" title={l.remarksFu1 || l.historyRemarks}>
                            {l.remarksFu1 || l.historyRemarks || '-'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Klik baris lead untuk membuka detail profil &amp; percakapan prospek.
              </span>
              <button
                onClick={() => setInspectingAgent(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
