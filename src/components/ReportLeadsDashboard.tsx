import React, { useState } from 'react';
import { Lead, SalesAgent } from '../types';
import { WeeklyReportDashboard } from './WeeklyReportDashboard';
import { MonthlyReportDashboard } from './MonthlyReportDashboard';
import { 
  Calendar, 
  Layers, 
  BarChart2, 
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ReportLeadsDashboardProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead?: (lead: Lead) => void;
  onOpenScoringModal?: (lead?: Lead) => void;
}

export const ReportLeadsDashboard: React.FC<ReportLeadsDashboardProps> = ({
  leads,
  salesAgents,
  onSelectLead,
  onOpenScoringModal
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div id="report-leads-dashboard" className="space-y-4 pb-8">
      {/* Consolidated Top Navigation Tab Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            id="tab-report-weekly"
            onClick={() => setActiveReportTab('weekly')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeReportTab === 'weekly'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeReportTab === 'weekly' ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>Report Weekly (Senin - Minggu)</span>
          </button>

          <button
            id="tab-report-monthly"
            onClick={() => setActiveReportTab('monthly')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeReportTab === 'monthly'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeReportTab === 'monthly' ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>Report Monthly (Akumulasi Bulanan)</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Siklus Laporan Leads &amp; Biaya Upper West</span>
        </div>
      </div>

      {/* Tab 1: Weekly Report */}
      {activeReportTab === 'weekly' && (
        <WeeklyReportDashboard
          leads={leads}
          salesAgents={salesAgents}
          onSelectLead={onSelectLead}
          onOpenScoringModal={onOpenScoringModal}
        />
      )}

      {/* Tab 2: Monthly Report */}
      {activeReportTab === 'monthly' && (
        <MonthlyReportDashboard
          leads={leads}
          salesAgents={salesAgents}
          onSelectLead={onSelectLead}
        />
      )}
    </div>
  );
};
