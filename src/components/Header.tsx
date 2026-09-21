import React from 'react';
import { 
  Building2, 
  Users,
  Crown,
  LogOut,
  Bell
} from 'lucide-react';
import { SalesAgent } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  salesAgents: SalesAgent[];
  onOpenAccessManagement?: () => void;
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
  onOpenAccessManagement,
}) => {
  const { currentUser, isOwner, pendingRequestsCount, logout } = useAuth();
  return (
    <header id="main-app-header" className="bg-[#0B1527] border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & App Title with Official Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Upper West Logo"
              className="h-8.5 w-8.5 rounded-full object-cover shadow-md ring-1 ring-amber-400/50 shrink-0 bg-amber-400"
              referrerPolicy="no-referrer"
            />
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
            
            {/* Sales Agent Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1">
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

            {/* Owner Access Control Button (ACC Izin Pengguna) */}
            {isOwner && onOpenAccessManagement && (
              <button
                id="btn-owner-access-manage"
                onClick={onOpenAccessManagement}
                className="relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-400/40 text-amber-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Kelola Permintaan Izin Akses Dashboard"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Izin Akses (ACC)</span>
                {pendingRequestsCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                    {pendingRequestsCount} Baru
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            )}

            {/* Current Logged In User Pill & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-full py-0.5 pl-0.5 pr-2.5">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full border border-amber-400/50 object-cover"
                  />
                  <div className="hidden lg:block text-left">
                    <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
                      <span>{currentUser.name}</span>
                      {currentUser.isOwner && (
                        <span className="text-[8px] bg-amber-400 text-slate-950 font-black uppercase px-1 rounded">Owner</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Keluar / Ganti Akun Gmail"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

