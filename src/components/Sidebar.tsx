import React from 'react';
import { 
  LayoutDashboard, 
  Table2, 
  FileSpreadsheet, 
  PlusCircle, 
  Calendar, 
  Layers, 
  UserCheck, 
  Megaphone, 
  MapPin, 
  TableProperties
} from 'lucide-react';
import { LeadCategory } from '../types';

export type NavigationMenu = 
  | 'dashboard' 
  | 'result_digital'
  | 'report_leads'
  | 'sales_performance'
  | 'detail_visited'
  | 'digital_ads_result'
  | 'ads_source_report'
  | 'weekly_report'
  | 'monthly_report'
  | 'table';

interface SidebarProps {
  activeMenu: NavigationMenu;
  setActiveMenu: (menu: NavigationMenu) => void;
  onOpenAddLead: () => void;
  onOpenExcelImport: () => void;
  onOpenScoringRules: () => void;
  hotLeadsCount?: number;
  totalLeadsCount?: number;
  visitedCount?: number;
  prospectCount?: number;
  warmCount?: number;
  coldCount?: number;
  junkCount?: number;
  selectedCategoryFilter?: LeadCategory | 'ALL';
  onFilterByCategory?: (category: LeadCategory | 'ALL') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  setActiveMenu,
  onOpenAddLead,
  onOpenExcelImport,
  onOpenScoringRules,
  onFilterByCategory,
}) => {
  return (
    <aside 
      id="app-sidebar-nav" 
      className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full overflow-y-auto select-none"
    >
      <div className="p-4 space-y-6">
        
        {/* Navigation Group 1: Menu Utama */}
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block mb-2">
            Menu Utama
          </span>
          <nav className="space-y-1">
            <button
              id="sidebar-nav-dashboard"
              onClick={() => {
                setActiveMenu('dashboard');
                onFilterByCategory?.('ALL');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'dashboard'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${activeMenu === 'dashboard' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </button>

            <button
              id="sidebar-nav-result-digital"
              onClick={() => {
                setActiveMenu('result_digital');
                onFilterByCategory?.('ALL');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'result_digital' || activeMenu === 'digital_ads_result' || activeMenu === 'ads_source_report'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200/90 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TableProperties className={`w-4 h-4 shrink-0 ${activeMenu === 'result_digital' || activeMenu === 'digital_ads_result' || activeMenu === 'ads_source_report' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap text-xs font-bold">Result Digital</span>
            </button>

            <button
              id="sidebar-nav-report-leads"
              onClick={() => {
                setActiveMenu('report_leads');
                onFilterByCategory?.('ALL');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'report_leads' || activeMenu === 'weekly_report' || activeMenu === 'monthly_report'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className={`w-4 h-4 ${activeMenu === 'report_leads' || activeMenu === 'weekly_report' || activeMenu === 'monthly_report' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap text-xs font-bold">Report leads</span>
            </button>

            <button
              id="sidebar-nav-sales-perf"
              onClick={() => {
                setActiveMenu('sales_performance');
                onFilterByCategory?.('ALL');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'sales_performance'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${activeMenu === 'sales_performance' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Performa Sales</span>
            </button>

            <button
              id="sidebar-nav-detail-visited"
              onClick={() => {
                setActiveMenu('detail_visited');
                onFilterByCategory?.('ALL');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMenu === 'detail_visited'
                  ? 'bg-purple-50 text-purple-900 border border-purple-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MapPin className={`w-4 h-4 ${activeMenu === 'detail_visited' ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>Detail Visited</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Sidebar Footer Box: Quick Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2">
        <button
          id="sidebar-btn-excel-import"
          onClick={onOpenExcelImport}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Import Excel Leads</span>
        </button>

        <button
          id="sidebar-btn-add-lead"
          onClick={onOpenAddLead}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-3 rounded-lg transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Tambah Prospek</span>
        </button>

        <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            CRM Online
          </span>
          <button 
            onClick={onOpenScoringRules} 
            className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
          >
            Aturan Skor
          </button>
        </div>
      </div>
    </aside>
  );
};
