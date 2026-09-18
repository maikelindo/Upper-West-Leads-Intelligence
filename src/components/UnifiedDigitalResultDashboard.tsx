import React, { useState } from 'react';
import { Lead, SalesAgent } from '../types';
import { DigitalAdsResultDashboard } from './DigitalAdsResultDashboard';
import { AdsSourceReportDashboard } from './AdsSourceReportDashboard';
import { 
  TableProperties, 
  Megaphone, 
  Layers, 
  Info,
  CheckCircle2,
  BarChart3,
  Globe
} from 'lucide-react';

interface UnifiedDigitalResultDashboardProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead?: (lead: Lead) => void;
}

export const UnifiedDigitalResultDashboard: React.FC<UnifiedDigitalResultDashboardProps> = ({
  leads,
  salesAgents,
  onSelectLead
}) => {
  const [activeTab, setActiveTab] = useState<'rekap_bulanan' | 'source_leads'>('rekap_bulanan');

  return (
    <div id="unified-digital-result-dashboard" className="space-y-4 pb-8">
      {/* Unified Top Navigation Tab Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            id="tab-rekap-bulanan"
            onClick={() => setActiveTab('rekap_bulanan')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rekap_bulanan'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <TableProperties className={`w-4 h-4 ${activeTab === 'rekap_bulanan' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Tabel Result Digital 2026</span>
          </button>

          <button
            id="tab-source-leads"
            onClick={() => setActiveTab('source_leads')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'source_leads'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Megaphone className={`w-4 h-4 ${activeTab === 'source_leads' ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>Source Leads Iklan &amp; Campaign</span>
          </button>
        </div>

        {/* Informative minimal badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>Integrasi Data Iklan Digital Upper West</span>
        </div>
      </div>

      {/* Tab 1: Rekap Bulanan Result Digital */}
      {activeTab === 'rekap_bulanan' && (
        <DigitalAdsResultDashboard
          leads={leads}
        />
      )}

      {/* Tab 2: Source Leads Iklan & Campaign Performance */}
      {activeTab === 'source_leads' && (
        <AdsSourceReportDashboard
          leads={leads}
          salesAgents={salesAgents}
          onSelectLead={onSelectLead || (() => {})}
        />
      )}
    </div>
  );
};
