import React from 'react';
import { 
  Lead, 
  SalesAgent, 
  PipelineStage,
  OmnichannelSource 
} from '../types';
import { 
  Flame, 
  Clock, 
  Sparkles, 
  MessageCircle, 
  Instagram, 
  Globe, 
  Phone, 
  Mail, 
  UserCheck, 
  ChevronRight, 
  TrendingUp, 
  MapPin, 
  CalendarCheck, 
  Building 
} from 'lucide-react';
import { formatRupiah } from '../services/leadScoring';

interface LeadCardProps {
  lead: Lead;
  agent?: SalesAgent;
  onSelectLead: (lead: Lead) => void;
  onQuickWhatsApp: (lead: Lead) => void;
  onMoveStage?: (leadId: string, nextStage: PipelineStage) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  agent,
  onSelectLead,
  onQuickWhatsApp,
  onMoveStage,
}) => {
  const getChannelIcon = (channel: OmnichannelSource) => {
    switch (channel) {
      case 'WHATSAPP':
        return <MessageCircle className="w-3 h-3 text-emerald-600" />;
      case 'INSTAGRAM':
        return <Instagram className="w-3 h-3 text-pink-600" />;
      case 'WEBSITE':
        return <Globe className="w-3 h-3 text-blue-600" />;
      case 'PHONE_CALL':
        return <Phone className="w-3 h-3 text-amber-600" />;
      case 'EMAIL':
        return <Mail className="w-3 h-3 text-indigo-600" />;
      default:
        return <UserCheck className="w-3 h-3 text-slate-500" />;
    }
  };

  const getScoreBadge = () => {
    if (lead.quality === 'HOT') {
      return {
        bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
        text: 'HOT',
        icon: <Flame className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600 animate-pulse" />,
      };
    }
    if (lead.quality === 'WARM') {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-800',
        text: 'WARM',
        icon: <TrendingUp className="w-2.5 h-2.5 text-amber-600" />,
      };
    }
    return {
      bg: 'bg-slate-100 border-slate-300 text-slate-600',
      text: 'COLD',
      icon: <Clock className="w-2.5 h-2.5 text-slate-500" />,
    };
  };

  const scoreBadge = getScoreBadge();

  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}h lalu`;
  };

  return (
    <div
      id={`lead-card-${lead.id}`}
      onClick={() => onSelectLead(lead)}
      className="group bg-white rounded-lg border border-slate-200/90 p-3 shadow-2xs hover:shadow-xs transition-all hover:border-amber-500/50 cursor-pointer relative flex flex-col justify-between"
    >
      {/* Top Header with Score Pill and Channel */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          {/* Quality Badge & Score */}
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded border ${scoreBadge.bg}`}>
              {scoreBadge.icon}
              <span>{scoreBadge.text}</span>
            </span>
            
            {/* Numeric Score */}
            <span className={`text-[11px] font-black px-1.5 py-0.2 rounded ${
              lead.score >= 75 ? 'bg-emerald-700 text-white' : 
              lead.score >= 45 ? 'bg-amber-500 text-slate-950 font-bold' : 
              'bg-slate-200 text-slate-700'
            }`}>
              {lead.score}
            </span>
          </div>

          {/* GoApp Channel Tag */}
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <div className="p-0.5 rounded bg-slate-100 flex items-center gap-1 border border-slate-200" title={`Sumber: GoApp ${lead.primaryChannel}`}>
              {getChannelIcon(lead.primaryChannel)}
              <span className="font-semibold text-[9px] uppercase">{lead.primaryChannel.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Lead Name & Occupation */}
        <div className="mb-1.5">
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
            {lead.name}
          </h4>
          <p className="text-[10px] text-slate-500 line-clamp-1">
            {lead.occupation} {lead.company ? `• ${lead.company}` : ''}
          </p>
        </div>

        {/* Property Unit Preference */}
        <div className="bg-slate-50 rounded p-1.5 mb-2 border border-slate-200/70">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800">
            <Building className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="truncate">{lead.preferredUnit}</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-600">
            <span className="font-bold text-slate-800">
              {formatRupiah(lead.budgetEstimated)}
            </span>
            <span className="text-slate-500">({lead.preferredPayment})</span>
          </div>
        </div>

        {/* Recent Activity Highlight */}
        {lead.activities && lead.activities.length > 0 && (
          <div className="text-[10px] text-slate-500 mb-2 flex items-start gap-1">
            <Clock className="w-2.5 h-2.5 text-slate-400 mt-0.5 shrink-0" />
            <span className="line-clamp-1">
              {lead.activities[lead.activities.length - 1].title} ({getRelativeTime(lead.lastActivityAt)})
            </span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Assigned Agent & Quick Actions */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
        {/* Agent Info */}
        <div className="flex items-center gap-1.5">
          {agent ? (
            <>
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-4 h-4 rounded-full object-cover border border-amber-500/40"
              />
              <span className="text-[10px] text-slate-700 font-medium truncate max-w-[85px]">
                {agent.name.split(' ')[0]}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-slate-400">Unassigned</span>
          )}
        </div>

        {/* Quick WhatsApp via GoApp Button */}
        <div className="flex items-center gap-1">
          <button
            id={`btn-wa-quick-${lead.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onQuickWhatsApp(lead);
            }}
            title="Kirim Pesan WhatsApp via GoApp"
            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
          </button>

          <button
            id={`btn-view-lead-${lead.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLead(lead);
            }}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
