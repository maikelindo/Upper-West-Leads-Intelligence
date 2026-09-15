import React, { useState, useMemo } from 'react';
import { 
  Lead, 
  SalesAgent, 
  PipelineStage, 
  OmnichannelSource, 
  LeadCategory,
  FollowUpResolveStatus,
  SopComplianceStatus
} from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Flame, 
  TrendingUp, 
  Clock, 
  Building, 
  MessageCircle, 
  Instagram, 
  Globe, 
  Phone, 
  Mail, 
  ExternalLink,
  ArrowUpDown,
  CheckCircle2,
  CalendarCheck,
  FileSpreadsheet,
  Plus,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  ShieldCheck,
  Check,
  X,
  Tag,
  Sparkles,
  Pencil,
  Save
} from 'lucide-react';
import { 
  formatRupiah, 
  getCategoryMeta, 
  getResolveStatusMeta, 
  getSopStatusMeta 
} from '../services/leadScoring';
import { generateLeadsPdfReport } from '../utils/exportToPdf';
import { parseLeadDate } from '../utils/dateUtils';

interface LeadTableProps {
  leads: Lead[];
  salesAgents: SalesAgent[];
  onSelectLead: (lead: Lead) => void;
  onQuickWhatsApp: (lead: Lead) => void;
  onMoveStage: (leadId: string, nextStage: PipelineStage) => void;
  onUpdateResolveStatus?: (leadId: string, status: FollowUpResolveStatus) => void;
  onUpdateLeadPerformance?: (leadId: string, updatedFields: Partial<Lead>) => void;
  onOpenExcelImport?: () => void;
  onOpenAddLead?: () => void;
  onOpenScoringModal?: (lead?: Lead) => void;
  activeCategoryFilter?: LeadCategory | 'ALL';
  onFilterByCategory?: (category: LeadCategory | 'ALL') => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  salesAgents,
  onSelectLead,
  onQuickWhatsApp,
  onMoveStage,
  onUpdateResolveStatus,
  onUpdateLeadPerformance,
  onOpenExcelImport,
  onOpenAddLead,
  onOpenScoringModal,
  activeCategoryFilter = 'ALL',
  onFilterByCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(activeCategoryFilter);
  const [resolveFilter, setResolveFilter] = useState<string>('ALL');
  const [sopFilter, setSopFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [adSourceFilter, setAdSourceFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'no' | 'score' | 'date' | 'responseTime'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Inline remarks editing state
  const [editingRemarksLeadId, setEditingRemarksLeadId] = useState<string | null>(null);
  const [editingRemarksValue, setEditingRemarksValue] = useState<string>('');

  const handleStartEditRemarks = (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRemarksLeadId(lead.id);
    setEditingRemarksValue(lead.remarksFu1 || lead.historyRemarks || '');
  };

  const handleSaveRemarks = (leadId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (onUpdateLeadPerformance) {
      onUpdateLeadPerformance(leadId, {
        remarksFu1: editingRemarksValue,
        historyRemarks: editingRemarksValue,
      });
    }
    setEditingRemarksLeadId(null);
  };

  const handleCancelEditRemarks = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRemarksLeadId(null);
    setEditingRemarksValue('');
  };

  // Extract unique ad sources for filter dropdown
  const uniqueAdSources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.adSource) set.add(l.adSource);
    });
    return Array.from(set);
  }, [leads]);

  // Keep internal filter state synced with parent prop if provided
  React.useEffect(() => {
    if (activeCategoryFilter) {
      setCategoryFilter(activeCategoryFilter);
      setSortBy('date');
      setSortOrder('desc');
      setCurrentPage(1);
    }
  }, [activeCategoryFilter]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        // Search query across 12 variables
        const remarksText = lead.remarksFu1 || lead.historyRemarks || lead.notes?.join(' ') || '';
        const agentName = salesAgents.find((a) => a.id === lead.assignedAgentId)?.name || lead.assignedToName || '';
        const matchSearch =
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone.includes(searchQuery) ||
          (lead.adSource && lead.adSource.toLowerCase().includes(searchQuery.toLowerCase())) ||
          remarksText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          lead.preferredUnit.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchSearch) return false;

        // Category filter (5-Tier Status Leads)
        if (categoryFilter !== 'ALL' && lead.category !== categoryFilter) return false;

        // Resolve / Follow Up filter
        if (resolveFilter !== 'ALL' && lead.resolveStatus !== resolveFilter) return false;

        // SOP filter
        if (sopFilter !== 'ALL' && lead.sopStatus !== sopFilter) return false;

        // Assigned Agent filter
        if (agentFilter !== 'ALL' && lead.assignedAgentId !== agentFilter) return false;

        // Ad Source filter
        if (adSourceFilter !== 'ALL' && lead.adSource !== adSourceFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          const aParsed = parseLeadDate(a.dateContact || a.createdAt);
          const bParsed = parseLeadDate(b.dateContact || b.createdAt);
          const aTime = aParsed ? aParsed.getTime() : 0;
          const bTime = bParsed ? bParsed.getTime() : 0;
          diff = aTime - bTime;
          if (diff === 0) {
            diff = (a.leadNumber || 0) - (b.leadNumber || 0);
          }
        } else if (sortBy === 'no') {
          diff = (a.leadNumber || 0) - (b.leadNumber || 0);
        } else if (sortBy === 'score') {
          diff = a.score - b.score;
        } else if (sortBy === 'responseTime') {
          const aTime = a.firstResponseTimeMinutes ?? 999;
          const bTime = b.firstResponseTimeMinutes ?? 999;
          diff = aTime - bTime;
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [leads, searchQuery, categoryFilter, resolveFilter, sopFilter, agentFilter, adSourceFilter, sortBy, sortOrder, salesAgents]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export clean CSV with the exact 12 Performance Evaluation headers
  const handleExportCSV = () => {
    const headers = [
      'No.',
      'Date contact',
      'No Telfon',
      'Resolve / Follow Up',
      'Status Leads',
      'assigned_to',
      'answered_at',
      'first_response_time',
      'agent_first_reply_time',
      'Source Iklan by',
      'Remaks FU 1',
      'SOP',
      'Nama Prospek',
      'Tipe Unit',
      'Skor Kualitas (0-100)'
    ];

    const rows = filteredLeads.map((l, index) => {
      const agent = salesAgents.find((a) => a.id === l.assignedAgentId)?.name || l.assignedToName || 'Unassigned';
      const remarks = (l.remarksFu1 || l.historyRemarks || l.notes?.join('. ') || '').replace(/"/g, '""');
      const sopMeta = getSopStatusMeta(l.sopStatus);
      const resolveMeta = getResolveStatusMeta(l.resolveStatus);

      return [
        l.leadNumber || index + 1,
        `"${l.dateContact || l.createdAt.slice(0, 16)}"`,
        `"${l.phone}"`,
        `"${resolveMeta.label}"`,
        `"${l.category || 'COLD'}"`,
        `"${agent}"`,
        `"${l.answeredAt || '-'}"`,
        `"${l.firstResponseTimeFormatted || (l.firstResponseTimeMinutes ? `${l.firstResponseTimeMinutes} menit` : '-')}"`,
        `"${l.agentFirstReplyTime || '-'}"`,
        `"${(l.adSource || l.primaryChannel).replace(/"/g, '""')}"`,
        `"${remarks}"`,
        `"${sopMeta.label}"`,
        `"${l.name}"`,
        `"${l.preferredUnit}"`,
        l.score,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UpperWest_12_Variables_Lead_Performance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    generateLeadsPdfReport({
      title: 'LAPORAN ACTUAL LEADS & SALES RESPONSE AUDIT',
      subtitle: `Dokumen Rekapitulasi Data Leads & Remarks FU 1 (Total: ${filteredLeads.length} Baris)`,
      dateRangeLabel: `Data Actual Periode: 01 Agt 2026 - 16 Agt 2026`,
      leads: filteredLeads,
      includeSummary: true
    });
  };

  return (
    <div id="lead-performance-table-container" className="space-y-3">
      
      {/* Top Controls Toolbar: Search & Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left: Search input */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Telfon, Nama, Source Iklan, Remarks FU 1, PIC..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white transition-all font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
              showAdvancedFilters || resolveFilter !== 'ALL' || sopFilter !== 'ALL' || agentFilter !== 'ALL' || adSourceFilter !== 'ALL'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter 12 Variabel</span>
            {(resolveFilter !== 'ALL' || sopFilter !== 'ALL' || agentFilter !== 'ALL' || adSourceFilter !== 'ALL') && (
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            )}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onOpenScoringModal && (
            <button
              onClick={() => onOpenScoringModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-slate-900 text-amber-400 border border-amber-400/30 hover:bg-slate-800 transition-all shadow-xs cursor-pointer active:scale-98"
              title="Evaluasi & Scoring Percakapan AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Scoring AI</span>
            </button>
          )}

          {onOpenExcelImport && (
            <button
              onClick={onOpenExcelImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Download Dokumen PDF Laporan Actual Leads"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
            title="Download CSV 12 Variables"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {onOpenAddLead && (
            <button
              onClick={onOpenAddLead}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Expansion Bar */}
      {showAdvancedFilters && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 shadow-inner grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 animate-fadeIn">
          
          {/* Filter 1: Status Leads (5-Tier) */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
              5. Status Leads
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                if (onFilterByCategory) onFilterByCategory(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Kategori (5-Tier)</option>
              <option value="VISITED">🟣 Visited (Show Unit / SPK)</option>
              <option value="PROSPECT">🟢 Prospect (Negosiasi / KPA)</option>
              <option value="WARM">🟡 Warm (Inquiry Brosur)</option>
              <option value="COLD">⚪ Cold (Outreach Awal)</option>
              <option value="JUNK">🔴 Junk / Disqualified</option>
            </select>
          </div>

          {/* Filter 2: Resolve / Follow Up */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
              4. Resolve / Follow Up
            </label>
            <select
              value={resolveFilter}
              onChange={(e) => {
                setResolveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status Tindakan</option>
              <option value="FIRST_CONTACT">First Contact</option>
              <option value="FOLLOW_UP_CONTACT">Follow Up Contact</option>
              <option value="RESOLVED">Resolved / Solved</option>
              <option value="NEED_FOLLOW_UP">Need Follow Up</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending Response</option>
              <option value="ESCALATED">Escalated to SPV</option>
            </select>
          </div>

          {/* Filter 3: SOP Compliance */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
              12. SOP SLA Respon
            </label>
            <select
              value={sopFilter}
              onChange={(e) => {
                setSopFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status SOP</option>
              <option value="SOP_MET">🟢 SOP Met (&lt; 15 Menit)</option>
              <option value="SOP_WARNING">🟡 SOP Warning (15-30 Menit)</option>
              <option value="SOP_BREACHED">🔴 SOP Breached (&gt; 30 Menit)</option>
              <option value="PENDING">⚪ Pending Response</option>
            </select>
          </div>

          {/* Filter 4: assigned_to */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
              6. Assigned To (Sales PIC)
            </label>
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Sales Agent</option>
              {salesAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.role})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 5: Source Iklan */}
          {uniqueAdSources.length > 0 && (
            <div className="sm:col-span-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                10. Source Iklan by
              </label>
              <select
                value={adSourceFilter}
                onChange={(e) => {
                  setAdSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-md p-1.5 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Semua Campaign / Source Iklan</option>
                {uniqueAdSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          <div className="flex items-end sm:col-span-2">
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setResolveFilter('ALL');
                setSopFilter('ALL');
                setAgentFilter('ALL');
                setAdSourceFilter('ALL');
                setSearchQuery('');
                if (onFilterByCategory) onFilterByCategory('ALL');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline py-1.5 cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        </div>
      )}

      {/* Main 12 Variables Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 border-b border-slate-800 font-extrabold uppercase tracking-wider text-[10px] select-none whitespace-nowrap">
                
                {/* 1. No. */}
                <th className="py-2.5 px-3 w-10 text-center">
                  <button 
                    onClick={() => {
                      setSortBy('no');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center justify-center gap-1 hover:text-amber-400 cursor-pointer"
                  >
                    <span>No.</span>
                    {sortBy === 'no' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>

                {/* 2. Date contact */}
                <th className="py-2.5 px-3">
                  <button 
                    onClick={() => {
                      setSortBy('date');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-amber-400 cursor-pointer"
                  >
                    <span>Date Contact</span>
                    {sortBy === 'date' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>

                {/* Prospek & 3. No Telfon */}
                <th className="py-2.5 px-3">Prospek & No Telfon</th>

                {/* 4. Resolve / Follow Up */}
                <th className="py-2.5 px-3">Resolve / Follow Up</th>

                {/* 5. Status Leads (5-Tier) & Score */}
                <th className="py-2.5 px-3">
                  <button 
                    onClick={() => {
                      setSortBy('score');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-amber-400 cursor-pointer"
                  >
                    <span>Status Leads (Score)</span>
                    {sortBy === 'score' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>

                {/* 6. assigned_to */}
                <th className="py-2.5 px-3">Assigned To</th>

                {/* 7. answered_at */}
                <th className="py-2.5 px-3">Answered At</th>

                {/* 8. first_response_time */}
                <th className="py-2.5 px-3">
                  <button 
                    onClick={() => {
                      setSortBy('responseTime');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-amber-400 cursor-pointer"
                  >
                    <span>1st Response</span>
                    {sortBy === 'responseTime' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>

                {/* 9. agent_first_reply_time */}
                <th className="py-2.5 px-3">First Reply</th>

                {/* 10. Source Iklan by */}
                <th className="py-2.5 px-3">Source Iklan By</th>

                {/* 11. Remaks FU 1 */}
                <th className="py-2.5 px-3 min-w-[220px]">Remarks FU 1</th>

                {/* 12. SOP */}
                <th className="py-2.5 px-3 text-center">SOP</th>

                {/* Actions */}
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">Tidak ada prospek yang sesuai kriteria filter.</p>
                    <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau reset filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, idx) => {
                  const categoryMeta = getCategoryMeta(lead.category || 'COLD');
                  const resolveMeta = getResolveStatusMeta(lead.resolveStatus);
                  const sopMeta = getSopStatusMeta(lead.sopStatus);
                  const assignedAgent = salesAgents.find((a) => a.id === lead.assignedAgentId);
                  const isJunkOrIrrelevant = 
                    lead.category === 'JUNK' || 
                    lead.resolveStatus === 'Cari Sewa' || 
                    lead.resolveStatus === 'Strangers' || 
                    lead.resolveStatus === 'Jualan Product' || 
                    lead.resolveStatus === 'Over buget' || 
                    lead.resolveStatus === 'Cari Kerja';

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className={`transition-colors cursor-pointer group ${
                        isJunkOrIrrelevant 
                          ? 'bg-amber-100/70 hover:bg-amber-200/80 text-amber-950' 
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {/* 1. No. */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                        {lead.leadNumber || (currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* 2. Date contact */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-mono text-slate-900 font-semibold text-[11px]">
                          {lead.dateContact || lead.createdAt.slice(0, 16).replace('T', ' ')}
                        </div>
                      </td>

                      {/* Prospek & 3. No Telfon */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                          {lead.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                      </td>

                      {/* 4. Resolve / Follow Up */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.resolveStatus || 'FIRST_CONTACT'}
                          onChange={(e) => {
                            const newStatus = e.target.value as FollowUpResolveStatus;
                            if (onUpdateResolveStatus) {
                              onUpdateResolveStatus(lead.id, newStatus);
                            } else if (onUpdateLeadPerformance) {
                              onUpdateLeadPerformance(lead.id, { resolveStatus: newStatus });
                            }
                          }}
                          className={`text-[10px] font-extrabold px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${resolveMeta.badgeBg} ${resolveMeta.badgeBorder} ${resolveMeta.badgeText}`}
                        >
                          <option value="First Contact">First Contact</option>
                          <option value="Follow Up">Follow Up</option>
                          <option value="Cari Sewa">Cari Sewa</option>
                          <option value="Strangers">Strangers</option>
                          <option value="Jualan Product">Jualan Product</option>
                          <option value="Over buget">Over buget</option>
                          <option value="Cari Kerja">Cari Kerja</option>
                          <option value="FIRST_CONTACT">First Contact (Sys)</option>
                          <option value="FOLLOW_UP_CONTACT">Follow Up (Sys)</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </td>

                      {/* 5. Status Leads (5-Tier) & AI Behavior Score */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={lead.category || 'COLD'}
                              onChange={(e) => {
                                const newCategory = e.target.value as LeadCategory;
                                if (onUpdateLeadPerformance) {
                                  onUpdateLeadPerformance(lead.id, { category: newCategory });
                                }
                              }}
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}
                            >
                              <option value="VISITED">Visited</option>
                              <option value="PROSPECT">Prospect</option>
                              <option value="WARM">Warm</option>
                              <option value="COLD">Cold</option>
                              <option value="JUNK">Junk</option>
                            </select>
                            <span className="font-mono text-xs font-black text-slate-900" title="Skor CRM">
                              {lead.score}
                            </span>
                          </div>
                          {lead.behaviorScore !== undefined && (
                            <div className="text-[9px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded w-fit">
                              Behavior: {lead.behaviorScore}/170 pt
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. assigned_to (Interactive Selector) */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {assignedAgent?.avatar ? (
                            <img
                              src={assignedAgent.avatar}
                              alt={assignedAgent.name}
                              className="w-5 h-5 rounded-full object-cover border border-amber-400 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-[9px] font-bold flex items-center justify-center text-slate-600 shrink-0">
                              {(lead.assignedToName || 'A')[0]}
                            </div>
                          )}
                          <select
                            value={lead.assignedAgentId || ''}
                            onChange={(e) => {
                              const newAgentId = e.target.value;
                              const matched = salesAgents.find((a) => a.id === newAgentId);
                              if (onUpdateLeadPerformance) {
                                onUpdateLeadPerformance(lead.id, {
                                  assignedAgentId: newAgentId,
                                  assignedToName: matched?.name || lead.assignedToName,
                                });
                              }
                            }}
                            className="text-xs font-semibold text-slate-800 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none cursor-pointer py-0.5 max-w-[130px] truncate"
                          >
                            {salesAgents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name.split(' ')[0]} ({agent.name})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* 7. answered_at */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {lead.answeredAt || '-'}
                      </td>

                      {/* 8. first_response_time */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`font-mono text-[11px] font-bold ${
                          (lead.firstResponseTimeMinutes ?? 99) <= 15
                            ? 'text-emerald-700'
                            : (lead.firstResponseTimeMinutes ?? 99) <= 30
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}>
                          {lead.firstResponseTimeFormatted || (lead.firstResponseTimeMinutes ? `${lead.firstResponseTimeMinutes} mnt` : '-')}
                        </span>
                      </td>

                      {/* 9. agent_first_reply_time */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {lead.agentFirstReplyTime || '-'}
                      </td>

                      {/* 10. Source Iklan by */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span 
                          className={`inline-block max-w-[200px] truncate text-[11px] font-bold px-2 py-0.5 rounded border ${
                            (lead.adSource || '').startsWith('Instagram')
                              ? 'bg-pink-50 text-pink-900 border-pink-200'
                              : (lead.adSource || '').startsWith('Google')
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`} 
                          title={lead.adSource || lead.primaryChannel}
                        >
                          {lead.adSource || lead.primaryChannel}
                        </span>
                      </td>

                      {/* 11. Remaks FU 1 (Interactive Inline Edit) */}
                      <td className="py-2.5 px-3 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        {editingRemarksLeadId === lead.id ? (
                          <div className="space-y-1.5 p-1.5 bg-white rounded-lg border-2 border-amber-400 shadow-md animate-fadeIn">
                            <textarea
                              autoFocus
                              value={editingRemarksValue}
                              onChange={(e) => setEditingRemarksValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveRemarks(lead.id, e);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditRemarks();
                                }
                              }}
                              placeholder="Ketik catatan Follow Up 1..."
                              className="w-full text-xs text-slate-800 p-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[50px] resize-y"
                            />
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] text-slate-400 font-mono">
                                Enter = Simpan
                              </span>
                              <div className="flex items-center gap-1">
                                {onOpenScoringModal && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenScoringModal(lead)}
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded flex items-center gap-0.5 cursor-pointer"
                                    title="Evaluasi via AI"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                    <span>AI</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleCancelEditRemarks(e)}
                                  className="px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleSaveRemarks(lead.id, e)}
                                  className="px-2 py-0.5 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Simpan</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={(e) => handleStartEditRemarks(lead, e)}
                            className="group/remaks flex items-start justify-between gap-1 p-1 rounded hover:bg-amber-100/60 transition-colors cursor-text"
                            title="Klik untuk edit catatan FU 1 langsung"
                          >
                            <p className="line-clamp-2 text-xs text-slate-700 max-w-xs leading-snug">
                              {lead.remarksFu1 || lead.historyRemarks || (
                                <span className="text-slate-400 italic">Klik untuk tambah catatan FU 1...</span>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => handleStartEditRemarks(lead, e)}
                              className="opacity-0 group-hover/remaks:opacity-100 p-1 rounded hover:bg-amber-200 text-amber-800 transition-opacity shrink-0 cursor-pointer"
                              title="Edit Catatan"
                            >
                              <Pencil className="w-3 h-3 text-amber-700" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 12. SOP Status Badge (Clickable Toggle ✓ / ✗) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = lead.sopStatus === 'SOP_MET' ? 'SOP_BREACHED' : 'SOP_MET';
                            const newNotes = newStatus === 'SOP_MET'
                              ? 'SOP Sesuai: Respon cepat memenuhi SLA'
                              : 'SOP Tidak Sesuai: Respon melebihi SLA';
                            if (onUpdateLeadPerformance) {
                              onUpdateLeadPerformance(lead.id, {
                                sopStatus: newStatus,
                                sopNotes: newNotes,
                              });
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                            lead.sopStatus === 'SOP_MET'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                          }`}
                          title="Klik untuk ubah status SOP (Sesuai / Tidak Sesuai)"
                        >
                          {lead.sopStatus === 'SOP_MET' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                              <span>✓ Sesuai SOP</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                              <span>✗ Tidak Sesuai</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenScoringModal && (
                            <button
                              onClick={() => onOpenScoringModal(lead)}
                              className="p-1.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                              title="Scoring Percakapan AI"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                            </button>
                          )}

                          <button
                            onClick={() => onQuickWhatsApp(lead)}
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectLead(lead)}
                            className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                            title="Buka Detail Prospek"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredLeads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, filteredLeads.length)}</span> dari <span className="font-bold text-slate-900">{filteredLeads.length}</span> total prospek
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono font-bold text-slate-800 text-xs">
              Halaman {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
