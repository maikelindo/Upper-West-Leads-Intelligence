import React from 'react';
import { 
  Lead, 
  SalesAgent, 
  OmnichannelSource 
} from '../types';
import { isLeadAssignedToAgent } from '../data/mockData';
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Zap, 
  Users, 
  Building2, 
  DollarSign, 
  Clock, 
  MessageCircle, 
  Award,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { formatRupiah, getCategoryMeta, getResolveStatusMeta, getSopStatusMeta } from '../services/leadScoring';

interface AnalyticsViewProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  leads,
  salesAgents,
}) => {
  const totalLeads = leads.length;
  const visitedLeads = leads.filter((l) => l.category === 'VISITED');
  const prospectLeads = leads.filter((l) => l.category === 'PROSPECT');
  const warmLeads = leads.filter((l) => l.category === 'WARM');
  const coldLeads = leads.filter((l) => l.category === 'COLD');
  const junkLeads = leads.filter((l) => l.category === 'JUNK');

  const qualifiedLeads = leads.filter((l) => l.category !== 'JUNK');

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.budgetEstimated || 0), 0);
  const highTierPipelineValue = [...visitedLeads, ...prospectLeads].reduce((sum, l) => sum + (l.budgetEstimated || 0), 0);

  const avgLeadScore = qualifiedLeads.length > 0 
    ? Math.round(qualifiedLeads.reduce((sum, l) => sum + l.score, 0) / qualifiedLeads.length) 
    : 0;

  // SOP Compliance calculations (based on qualified leads)
  const sopMetCount = qualifiedLeads.filter((l) => l.sopStatus === 'SOP_MET').length;
  const sopWarningCount = qualifiedLeads.filter((l) => l.sopStatus === 'SOP_WARNING').length;
  const sopBreachedCount = qualifiedLeads.filter((l) => l.sopStatus === 'SOP_BREACHED').length;
  const sopComplianceRate = qualifiedLeads.length > 0 ? Math.round((sopMetCount / qualifiedLeads.length) * 100) : 0;

  // Resolve status calculations
  const resolvedCount = leads.filter((l) => l.resolveStatus === 'RESOLVED').length;
  const needFuCount = leads.filter((l) => l.resolveStatus === 'NEED_FOLLOW_UP').length;
  const inProgressCount = leads.filter((l) => l.resolveStatus === 'IN_PROGRESS').length;
  const escalatedCount = leads.filter((l) => l.resolveStatus === 'ESCALATED').length;

  // Source Iklan Breakdown
  const adSourceCounts: Record<string, { count: number; highTier: number; totalValue: number }> = {};
  leads.forEach((l) => {
    const src = l.adSource || l.primaryChannel || 'Direct Inbound';
    if (!adSourceCounts[src]) {
      adSourceCounts[src] = { count: 0, highTier: 0, totalValue: 0 };
    }
    adSourceCounts[src].count += 1;
    if (l.category === 'VISITED' || l.category === 'PROSPECT') {
      adSourceCounts[src].highTier += 1;
    }
    adSourceCounts[src].totalValue += l.budgetEstimated || 0;
  });

  return (
    <div id="sales-analytics-container" className="space-y-4">
      
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* KPI 1: Total Pipeline Value */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Total Nilai Pipeline</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900 leading-tight">
            {formatRupiah(totalPipelineValue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
            <span>Visited & Prospect:</span>
            <span className="font-bold text-amber-700">{formatRupiah(highTierPipelineValue)}</span>
          </div>
        </div>

        {/* KPI 2: SOP SLA Compliance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Kepatuhan SOP SLA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-black text-emerald-700 leading-tight">
              {sopComplianceRate}%
            </p>
            <span className="text-[11px] text-slate-500">({sopMetCount} dari {qualifiedLeads.length} valid SLA dipenuhi)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
            <span>Target Respon:</span>
            <span className="font-bold text-slate-800">&lt; 15 Menit</span>
          </div>
        </div>

        {/* KPI 3: Average Lead Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Rata-Rata Skor CRM</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900 leading-tight">
            {avgLeadScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
            <span>Distribusi 5-Tier:</span>
            <span className="font-semibold text-amber-900">{visitedCountOrProspect(visitedLeads.length, prospectLeads.length)}</span>
          </div>
        </div>

        {/* KPI 4: Resolve / Follow-Up Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Status Follow Up (FU)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-blue-700 leading-tight">
            {resolvedCount} <span className="text-xs text-slate-400 font-normal">Resolved</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
            <span>Need FU / Active:</span>
            <span className="font-bold text-emerald-700">{needFuCount + inProgressCount} Leads</span>
          </div>
        </div>
      </div>

      {/* Row 2: 12-Variable Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Source Iklan By Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              Performa Source Iklan (Campaign Attribution)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">10. Source Iklan By</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {Object.entries(adSourceCounts).map(([src, data]) => {
              const share = totalLeads > 0 ? Math.round((data.count / totalLeads) * 100) : 0;
              return (
                <div key={src} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[240px]">{src}</span>
                    <span className="text-slate-900 font-bold text-xs">{formatRupiah(data.totalValue)}</span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(share, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span>{data.count} Leads ({share}% share)</span>
                    <span className="text-amber-800 font-bold">{data.highTier} Visited/Prospect</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Rep Leaderboard & SOP Compliance (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Leaderboard Kinerja Tim Sales Upper West
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">6. assigned_to</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {salesAgents.map((agent, rank) => {
              const agentLeads = leads.filter((l) => isLeadAssignedToAgent(l, agent));
              const agentQualified = agentLeads.filter((l) => l.category !== 'JUNK');
              const agentVisited = agentLeads.filter((l) => l.category === 'VISITED' || l.category === 'PROSPECT').length;
              const agentSopMet = agentQualified.filter((l) => l.sopStatus === 'SOP_MET').length;
              const sopRate = agentQualified.length > 0 ? Math.round((agentSopMet / agentQualified.length) * 100) : 0;
              const agentSlaMet = agentQualified.filter((l) => l.firstResponseTimeMinutes !== undefined && l.firstResponseTimeMinutes <= 2).length;
              const slaRate = agentQualified.length > 0 ? Math.round((agentSlaMet / agentQualified.length) * 100) : 0;

              return (
                <div
                  key={agent.id}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 text-center font-black text-xs text-amber-800">
                      #{rank + 1}
                    </div>
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-9 h-9 rounded-full object-cover border border-amber-500/50"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{agent.name}</h4>
                      <p className="text-[10px] text-slate-500">{agent.role} • SLA: {slaRate}% • SOP: {sopRate}%</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-700">
                      {agentQualified.length} Valid Leads
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {agentLeads.length} Total ({agentVisited} Visited)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

function visitedCountOrProspect(visited: number, prospect: number) {
  return `${visited} Visited • ${prospect} Prospect`;
}
