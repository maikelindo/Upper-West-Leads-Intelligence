import React from 'react';
import { Lead, PipelineStage, SalesAgent } from '../types';
import { LeadCard } from './LeadCard';
import { 
  Sparkles, 
  Flame, 
  CalendarCheck, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Plus
} from 'lucide-react';
import { formatRupiah } from '../services/leadScoring';

interface KanbanBoardProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead: (lead: Lead) => void;
  onQuickWhatsApp: (lead: Lead) => void;
  onMoveStage: (leadId: string, nextStage: PipelineStage) => void;
  onAddLeadInStage?: (stage: PipelineStage) => void;
}

interface ColumnConfig {
  stage: PipelineStage;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerColor: string;
  accentBorder: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  salesAgents,
  onSelectLead,
  onQuickWhatsApp,
  onMoveStage,
}) => {
  const columns: ColumnConfig[] = [
    {
      stage: 'NEW',
      title: 'Prospek Baru',
      subtitle: 'Masuk via GoApp / Web',
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" />,
      headerColor: 'bg-blue-50 text-blue-700 border-blue-200',
      accentBorder: 'border-t-2 border-blue-600',
    },
    {
      stage: 'CONTACTED',
      title: 'Diskusi & Edukasi',
      subtitle: 'Chat & Telepon Berlangsung',
      icon: <MessageSquare className="w-3.5 h-3.5 text-amber-600" />,
      headerColor: 'bg-amber-50 text-amber-700 border-amber-200',
      accentBorder: 'border-t-2 border-amber-600',
    },
    {
      stage: 'SITE_VISIT_SCHEDULED',
      title: 'Jadwal Show Unit',
      subtitle: 'VIP Survey Upper West',
      icon: <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />,
      headerColor: 'bg-purple-50 text-purple-700 border-purple-200',
      accentBorder: 'border-t-2 border-purple-600',
    },
    {
      stage: 'NEGOTIATION',
      title: 'Negosiasi & Proposal',
      subtitle: 'Draft Diskon & Unit Lock',
      icon: <FileText className="w-3.5 h-3.5 text-orange-600" />,
      headerColor: 'bg-orange-50 text-orange-700 border-orange-200',
      accentBorder: 'border-t-2 border-orange-600',
    },
    {
      stage: 'BOOKING_CLOSING',
      title: 'Booking & Closing',
      subtitle: 'Tanda Jadi / SPK Terbit',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      headerColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accentBorder: 'border-t-2 border-emerald-600',
    },
    {
      stage: 'LOST',
      title: 'Tertunda / Drop',
      subtitle: 'Re-nurturing Campaign',
      icon: <XCircle className="w-3.5 h-3.5 text-slate-500" />,
      headerColor: 'bg-slate-100 text-slate-600 border-slate-200',
      accentBorder: 'border-t-2 border-slate-400',
    },
  ];

  return (
    <div id="kanban-pipeline-container" className="h-full flex flex-col">
      {/* Kanban Stage Grid */}
      <div className="flex-1 overflow-x-auto pb-3">
        <div className="flex gap-3 min-w-[1240px] h-full">
          {columns.map((col) => {
            const columnLeads = leads
              .filter((l) => l.stage === col.stage)
              // Sort by score descending (Hot leads first!)
              .sort((a, b) => b.score - a.score);

            const totalValue = columnLeads.reduce((sum, l) => sum + (l.budgetEstimated || 0), 0);
            const hotCount = columnLeads.filter((l) => l.quality === 'HOT').length;

            return (
              <div
                key={col.stage}
                id={`kanban-col-${col.stage}`}
                className={`flex-1 min-w-[280px] max-w-[320px] bg-slate-100/70 rounded-lg border border-slate-200/90 flex flex-col shadow-2xs ${col.accentBorder}`}
              >
                {/* Column Header - Compact */}
                <div className="p-2.5 bg-white/90 rounded-t border-b border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 rounded border ${col.headerColor}`}>
                        {col.icon}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 tracking-tight leading-none">
                          {col.title}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
                          {col.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Count Pill */}
                    <div className="flex items-center gap-1">
                      {hotCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded" title={`${hotCount} Hot Leads`}>
                          <Flame className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                          {hotCount}
                        </span>
                      )}
                      <span className="text-[11px] font-bold bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded">
                        {columnLeads.length}
                      </span>
                    </div>
                  </div>

                  {/* Stage Value Metric */}
                  <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Estimasi Pipeline:</span>
                    <span className="font-bold text-amber-700">
                      {formatRupiah(totalValue)}
                    </span>
                  </div>
                </div>

                {/* Lead Cards List */}
                <div className="p-2 flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-300">
                  {columnLeads.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-300 rounded-lg text-slate-400">
                      <p className="text-[11px]">Belum ada prospek</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const agent = salesAgents.find((a) => a.id === lead.assignedAgentId);
                      return (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          agent={agent}
                          onSelectLead={onSelectLead}
                          onQuickWhatsApp={onQuickWhatsApp}
                          onMoveStage={onMoveStage}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
