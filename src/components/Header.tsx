import React from 'react';
import { 
  Building2, 
  Users
} from 'lucide-react';
import { SalesAgent } from '../types';

interface HeaderProps {
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  salesAgents: SalesAgent[];
  onOpenAddLead?: () => void;
  onOpenExcelImport?: () => void;
  onOpenScoringRules?: () => void;
  onTriggerSimulation?: () => void;
  hotLeadsCount?: number;
  totalLeadsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedAgentId,
  setSelectedAgentId,
  salesAgents,
}) => {
  return (
    <header id="main-app-header" className="bg-[#0B1527] border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & App Title matching screenshot */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white uppercase">
                UPPER WEST
              </span>
              <span className="font-bold text-base tracking-tight text-amber-400 uppercase">
                | LEAD INTELLIGENCE
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">
                BSD CITY
              </span>
            </div>
          </div>

          {/* Center: System Status Badge */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-semibold text-slate-200 shadow-inner">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>AI Lead Scoring Active</span>
              <span className="text-[10px] text-amber-400 font-mono">5-Tier</span>
            </div>
          </div>

          {/* Right Section: Sales Optimization Status & Quick Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Sales Lead Header Subtitle from screenshot */}
            <div className="hidden lg:block text-right">
              <span className="text-xs font-extrabold text-white block leading-tight">
                Sales Lead Portal
              </span>
              <span className="text-[9px] font-bold tracking-wider text-emerald-400 uppercase block">
                Optimization Mode Active
              </span>
            </div>

            {/* Sales Agent Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="agent-selector-dropdown"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Sales Representatives</option>
                {salesAgents.map((agent) => (
                  <option key={agent.id} value={agent.id} className="bg-slate-900 text-white">
                    {agent.name} ({agent.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
