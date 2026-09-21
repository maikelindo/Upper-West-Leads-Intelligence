import React, { useState, useMemo } from 'react';
import { 
  ALL_VISITED_LEADS, 
  VISITED_MONTHS, 
  STATUS_COLORS,
  VisitedLeadRecord 
} from '../data/visitedLeadsData';
import { VisitedAnalyticsSummary } from './VisitedAnalyticsSummary';
import { 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  Bookmark, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Building2, 
  Calendar, 
  Download,
  Info,
  Layers,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface DetailVisitedDashboardProps {
  onSelectLeadName?: (leadName: string) => void;
}

export const DetailVisitedDashboard: React.FC<DetailVisitedDashboardProps> = ({
  onSelectLeadName
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedSales, setSelectedSales] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof VisitedLeadRecord>('no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [previewRecord, setPreviewRecord] = useState<VisitedLeadRecord | null>(null);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState<boolean>(false);

  // Month stats for selector dropdown
  const monthStats = useMemo(() => {
    return VISITED_MONTHS.map((m) => {
      const leadsInMonth = m.key === 'ALL' 
        ? ALL_VISITED_LEADS 
        : ALL_VISITED_LEADS.filter((l) => l.month === m.key);
      const closings = leadsInMonth
        .filter((l) => l.status === 'closing')
        .reduce((sum, l) => sum + (l.closingUnits || 1), 0);
      return {
        ...m,
        count: leadsInMonth.length,
        closings
      };
    });
  }, []);

  const selectedMonthObj = useMemo(() => {
    return monthStats.find((m) => m.key === selectedMonth) || monthStats[0];
  }, [monthStats, selectedMonth]);

  // List of unique sales agents in visited data
  const salesList = useMemo(() => {
    const set = new Set<string>();
    ALL_VISITED_LEADS.forEach((l) => {
      if (l.assignedTo) set.add(l.assignedTo);
    });
    return Array.from(set).sort();
  }, []);

  // List of unique sources in visited data
  const sourceList = useMemo(() => {
    const set = new Set<string>();
    ALL_VISITED_LEADS.forEach((l) => {
      if (l.source) set.add(l.source);
    });
    return Array.from(set).sort();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return ALL_VISITED_LEADS.filter((item) => {
      // Month filter
      if (selectedMonth !== 'ALL' && item.month !== selectedMonth) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

      // Team filter
      if (selectedTeam !== 'ALL' && item.teamUnder !== selectedTeam) return false;

      // Sales filter
      if (selectedSales !== 'ALL' && item.assignedTo !== selectedSales) return false;

      // Source filter
      if (selectedSource !== 'ALL' && item.source.toLowerCase() !== selectedSource.toLowerCase()) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = item.leadName.toLowerCase().includes(query);
        const matchRemarks = item.remarks.toLowerCase().includes(query);
        const matchAd = item.adSource.toLowerCase().includes(query);
        const matchAgent = item.assignedTo.toLowerCase().includes(query);
        const matchVisit = item.dateVisit.toLowerCase().includes(query);
        if (!matchName && !matchRemarks && !matchAd && !matchAgent && !matchVisit) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [selectedMonth, selectedStatus, selectedTeam, selectedSales, selectedSource, searchQuery, sortField, sortOrder]);

  // Overall & Filtered Metrics
  const metrics = useMemo(() => {
    const total = filteredLeads.length;
    const closingCount = filteredLeads
      .filter(l => l.status === 'closing')
      .reduce((sum, l) => sum + (l.closingUnits || 1), 0);
    const reservationCount = filteredLeads.filter(l => l.status === 'reservation').length;
    const cancelledCount = filteredLeads.filter(l => l.status === 'cancelled').length;
    const inProgressCount = filteredLeads.filter(l => l.status === 'in_progress').length;

    const maikelindoCount = filteredLeads.filter(l => l.teamUnder === 'Maikelindo').length;
    const evitaCount = filteredLeads.filter(l => l.teamUnder === 'Evita Bella').length;

    const closingRate = total > 0 ? ((closingCount / total) * 100).toFixed(1) : '0';

    return {
      total,
      closingCount,
      reservationCount,
      cancelledCount,
      inProgressCount,
      maikelindoCount,
      evitaCount,
      closingRate
    };
  }, [filteredLeads]);

  // Overall Global Counts for Badge Tabs
  const globalStatusCounts = useMemo(() => {
    return {
      all: ALL_VISITED_LEADS.length,
      closing: ALL_VISITED_LEADS
        .filter(l => l.status === 'closing')
        .reduce((sum, l) => sum + (l.closingUnits || 1), 0),
      reservation: ALL_VISITED_LEADS.filter(l => l.status === 'reservation').length,
      cancelled: ALL_VISITED_LEADS.filter(l => l.status === 'cancelled').length,
      inProgress: ALL_VISITED_LEADS.filter(l => l.status === 'in_progress').length,
    };
  }, []);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Leads',
      'Incoming Leads',
      'Year',
      'Month',
      'Source',
      'Iklan by',
      'Remaks',
      'Team under',
      'assigned_to',
      'first_response_time',
      'Date Visit',
      'SLA Visit',
      'SLA Closing',
      'Last Fu',
      'Next Fu',
      'Status'
    ];

    const rows = filteredLeads.map(l => [
      l.no,
      `"${l.leadName.replace(/"/g, '""')}"`,
      `"${l.incomingLeads}"`,
      l.year,
      l.month,
      `"${l.source}"`,
      `"${l.adSource}"`,
      `"${l.remarks.replace(/"/g, '""')}"`,
      `"${l.teamUnder}"`,
      `"${l.assignedTo}"`,
      `"${l.firstResponseTime}"`,
      `"${l.dateVisit}"`,
      `"${l.slaVisit}"`,
      `"${l.slaClosing || ''}"`,
      `"${l.lastFu || ''}"`,
      `"${l.nextFu || ''}"`,
      `"${l.status.toUpperCase()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UpperWest_Detail_Visited_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="detail-visited-view" className="space-y-5 animate-in fade-in duration-300">
      
      {/* 1. Header & Title Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <MapPin className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Detail Visited Leads</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {ALL_VISITED_LEADS.length} Data Log Kunjungan
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            Rekap lengkap riwayat prospek yang telah melakukan <strong>Site Visit / Show Unit Upper West BSD City</strong> (Januari – September 2026) beserta evaluasi SLA respon, timeline survei fisik, dan status akhir closing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-export-visited-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Color Legend Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-amber-400">
              Panduan Warna Status Excel / Log:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="font-bold text-emerald-300">Hijau: Closing ({globalStatusCounts.closing})</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/40">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shrink-0"></span>
              <span className="font-bold text-cyan-300">Biru Muda: Reservasi ({globalStatusCounts.reservation})</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/40">
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0"></span>
              <span className="font-bold text-rose-300">Merah: Batal ({globalStatusCounts.cancelled})</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0"></span>
              <span className="font-medium text-slate-300">Default: Follow Up ({globalStatusCounts.inProgress})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KPI Summary Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Visited */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">Total Visited</span>
            <Users className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{metrics.total}</div>
          <span className="text-[10px] text-slate-500">Tersaring di filter</span>
        </div>

        {/* Total Closing */}
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold">Closing (Hijau)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-900">{metrics.closingCount}</div>
          <span className="text-[10px] text-emerald-700 font-bold">Closing Rate: {metrics.closingRate}%</span>
        </div>

        {/* Reservasi */}
        <div className="bg-cyan-50/80 p-3.5 rounded-xl border border-cyan-200/80 shadow-xs">
          <div className="flex items-center justify-between text-cyan-700 mb-1">
            <span className="text-[11px] font-bold">Reservasi (Biru)</span>
            <Bookmark className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-black text-cyan-900">{metrics.reservationCount}</div>
          <span className="text-[10px] text-cyan-700 font-medium">Hold / Booking DP</span>
        </div>

        {/* Batal */}
        <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold">Batal (Merah)</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-900">{metrics.cancelledCount}</div>
          <span className="text-[10px] text-rose-700 font-medium">Nego tidak deal</span>
        </div>

        {/* Team Maikelindo */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">Team Maikelindo</span>
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{metrics.maikelindoCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">
            {metrics.total > 0 ? ((metrics.maikelindoCount / metrics.total) * 100).toFixed(0) : 0}% dari total
          </span>
        </div>

        {/* Team Evita Bella */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">Team Evita Bella</span>
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{metrics.evitaCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">
            {metrics.total > 0 ? ((metrics.evitaCount / metrics.total) * 100).toFixed(0) : 0}% dari total
          </span>
        </div>

      </div>

      {/* 4. Rangkuman & Analisa Pola Kunjungan (User Request: Hari Visit paling ramai, Hari Leads Masuk perbandingan, Analisa Minat Produk) */}
      <VisitedAnalyticsSummary 
        leads={filteredLeads}
        allLeads={ALL_VISITED_LEADS}
        selectedMonthLabel={selectedMonthObj.label}
      />

      {/* 5. Filter & Kontrol Tabel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        
        {/* Modern Compact Month Selector Bar (No horizontal stretch) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              Periode Bulan:
            </span>

            {/* Custom Month Dropdown Popover */}
            <div className="relative">
              <button
                id="btn-toggle-month-dropdown"
                onClick={() => setIsMonthDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/90 border border-purple-200 text-purple-950 text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
              >
                <span>{selectedMonthObj.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-700 text-white text-[10px] font-extrabold">
                  {selectedMonthObj.count} Leads
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-purple-600 transition-transform duration-200 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Popover */}
              {isMonthDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsMonthDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <span>Pilih Periode Kunjungan</span>
                      <span>Total Log</span>
                    </div>

                    {/* All Months Option */}
                    <button
                      onClick={() => {
                        setSelectedMonth('ALL');
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        selectedMonth === 'ALL'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Semua Bulan (Jan - Sep 2026)</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedMonth === 'ALL' ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ALL_VISITED_LEADS.length}
                      </span>
                    </button>

                    {/* Grouped by Quarters */}
                    <div className="space-y-1.5 pt-1">
                      {/* Q3 2026 */}
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase px-2">Q3 2026</div>
                      {monthStats.filter(m => ['Sept', 'Aug', 'Juli'].includes(m.key)).map(m => (
                        <button
                          key={m.key}
                          onClick={() => {
                            setSelectedMonth(m.key);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selectedMonth === m.key
                              ? 'bg-purple-600 text-white font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {m.label}
                            {m.closings > 0 && (
                              <span className={`text-[9px] px-1 rounded font-bold ${
                                selectedMonth === m.key ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {m.closings} deal
                              </span>
                            )}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            selectedMonth === m.key ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.count}
                          </span>
                        </button>
                      ))}

                      {/* Q2 2026 */}
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase px-2 pt-1">Q2 2026</div>
                      {monthStats.filter(m => ['Juni', 'Mei', 'April'].includes(m.key)).map(m => (
                        <button
                          key={m.key}
                          onClick={() => {
                            setSelectedMonth(m.key);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selectedMonth === m.key
                              ? 'bg-purple-600 text-white font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {m.label}
                            {m.closings > 0 && (
                              <span className={`text-[9px] px-1 rounded font-bold ${
                                selectedMonth === m.key ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {m.closings} deal
                              </span>
                            )}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            selectedMonth === m.key ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.count}
                          </span>
                        </button>
                      ))}

                      {/* Q1 2026 */}
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase px-2 pt-1">Q1 2026</div>
                      {monthStats.filter(m => ['Maret', 'Februari', 'Januari'].includes(m.key)).map(m => (
                        <button
                          key={m.key}
                          onClick={() => {
                            setSelectedMonth(m.key);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selectedMonth === m.key
                              ? 'bg-purple-600 text-white font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {m.label}
                            {m.closings > 0 && (
                              <span className={`text-[9px] px-1 rounded font-bold ${
                                selectedMonth === m.key ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {m.closings} deal
                              </span>
                            )}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            selectedMonth === m.key ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Toggle Shortcut Chips for Desktop/Tablet */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setSelectedMonth('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMonth === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Semua ({ALL_VISITED_LEADS.length})
              </button>
              {['Sept', 'Aug', 'Juli'].map(mKey => {
                const stat = monthStats.find(m => m.key === mKey);
                const label = mKey === 'Sept' ? 'Sept' : mKey === 'Aug' ? 'Agu' : 'Juli';
                const count = stat ? stat.count : 0;
                return (
                  <button
                    key={mKey}
                    onClick={() => setSelectedMonth(mKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedMonth === mKey
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Native Select Option for Mobile Devices */}
            <div className="sm:hidden">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                {monthStats.map(m => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500 self-end sm:self-auto">
            Menampilkan: <strong className="text-slate-900">{filteredLeads.length}</strong> dari {ALL_VISITED_LEADS.length} Leads
          </div>
        </div>

        {/* Secondary Filter Controls Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua ({globalStatusCounts.all})
            </button>
            <button
              onClick={() => setSelectedStatus('closing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'closing'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Closing ({globalStatusCounts.closing})</span>
            </button>
            <button
              onClick={() => setSelectedStatus('reservation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'reservation'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Reservasi ({globalStatusCounts.reservation})</span>
            </button>
            <button
              onClick={() => setSelectedStatus('cancelled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Batal ({globalStatusCounts.cancelled})</span>
            </button>
            <button
              onClick={() => setSelectedStatus('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'in_progress'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Visited ({globalStatusCounts.inProgress})
            </button>
          </div>

          {/* Dropdowns & Search */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            
            {/* Team Dropdown */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">Semua Tim</option>
              <option value="Maikelindo">Team Maikelindo</option>
              <option value="Evita Bella">Team Evita Bella</option>
            </select>

            {/* Sales Dropdown */}
            <select
              value={selectedSales}
              onChange={(e) => setSelectedSales(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[150px] truncate"
            >
              <option value="ALL">Semua Sales</option>
              {salesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Source Dropdown */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[130px] truncate"
            >
              <option value="ALL">Semua Source</option>
              {sourceList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 w-44"
              />
            </div>

            {(selectedStatus !== 'ALL' || selectedTeam !== 'ALL' || selectedSales !== 'ALL' || selectedSource !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSelectedTeam('ALL');
                  setSelectedSales('ALL');
                  setSelectedSource('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] text-purple-700 hover:underline font-bold whitespace-nowrap cursor-pointer"
              >
                Reset
              </button>
            )}

          </div>

        </div>

      </div>

      {/* 5. Main Visited Leads Table (14 Columns as in PDF) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Tabel Rekap Visited Leads ({filteredLeads.length} Baris)
            </h3>
          </div>
          <div className="text-[11px] text-slate-500">
            Klik baris untuk melihat ringkasan detail prospek
          </div>
        </div>

        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
            <thead className="bg-slate-100/90 text-slate-700 font-extrabold sticky top-0 z-10 border-b border-slate-200 select-none">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">
                  <button 
                    onClick={() => {
                      setSortField('no');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center justify-center gap-1 hover:text-purple-700 cursor-pointer"
                  >
                    <span>No.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-2.5 px-3 min-w-[180px]">
                  <button 
                    onClick={() => {
                      setSortField('leadName');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center gap-1 hover:text-purple-700 cursor-pointer"
                  >
                    <span>Nama Leads</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-2.5 px-3 min-w-[140px]">Incoming Leads</th>
                <th className="py-2.5 px-2 w-16 text-center">Bulan</th>
                <th className="py-2.5 px-3 min-w-[100px]">Source</th>
                <th className="py-2.5 px-3 min-w-[130px]">Iklan by</th>
                <th className="py-2.5 px-3 min-w-[280px]">Remaks (Kebutuhan / Minat)</th>
                <th className="py-2.5 px-3 min-w-[120px]">Team under</th>
                <th className="py-2.5 px-3 min-w-[150px]">assigned_to</th>
                <th className="py-2.5 px-2 text-center min-w-[90px]">Response</th>
                <th className="py-2.5 px-3 min-w-[130px] font-black text-purple-900 bg-purple-50/80">Date Visit</th>
                <th className="py-2.5 px-2 text-center min-w-[85px] bg-purple-50/80">SLA Visit</th>
                <th className="py-2.5 px-3 min-w-[130px] font-black text-slate-900">SLA Closing</th>
                <th className="py-2.5 px-3 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada leads yang cocok dengan kriteria filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((item) => {
                  const statusConf = STATUS_COLORS[item.status] || STATUS_COLORS.in_progress;
                  
                  return (
                    <tr
                      key={item.no}
                      id={`visited-row-${item.no}`}
                      onClick={() => setPreviewRecord(item)}
                      className={`transition-colors cursor-pointer ${statusConf.rowBg}`}
                    >
                      {/* 1. No. */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                        {item.no}
                      </td>

                      {/* 2. Nama Leads */}
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${statusConf.dot}`}></span>
                          <span className="truncate max-w-[170px]">{item.leadName}</span>
                        </div>
                      </td>

                      {/* 3. Incoming Leads */}
                      <td className="py-2 px-3 text-slate-600 text-[11px] font-mono whitespace-nowrap">
                        {item.incomingLeads}
                      </td>

                      {/* 4. Month */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.month}
                        </span>
                      </td>

                      {/* 5. Source */}
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        <span className="font-semibold">{item.source}</span>
                      </td>

                      {/* 6. Iklan by */}
                      <td className="py-2 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-800">
                          {item.adSource}
                        </span>
                      </td>

                      {/* 7. Remaks */}
                      <td className="py-2 px-3 text-slate-700 text-[11px] max-w-[300px]" title={item.remarks}>
                        <p className="line-clamp-2 leading-relaxed">
                          {item.remarks}
                        </p>
                      </td>

                      {/* 8. Team under */}
                      <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-800">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          item.teamUnder === 'Maikelindo' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}>
                          {item.teamUnder}
                        </span>
                      </td>

                      {/* 9. assigned_to */}
                      <td className="py-2 px-3 whitespace-nowrap font-bold text-slate-900">
                        {item.assignedTo}
                      </td>

                      {/* 10. first_response_time */}
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {item.firstResponseTime}
                      </td>

                      {/* 11. Date Visit */}
                      <td className="py-2 px-3 font-extrabold text-purple-900 bg-purple-50/40 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                          {item.dateVisit}
                        </span>
                      </td>

                      {/* 12. SLA Visit */}
                      <td className="py-2 px-2 text-center whitespace-nowrap font-mono text-[11px] text-purple-800 font-bold bg-purple-50/40">
                        {item.slaVisit}
                      </td>

                      {/* 13. SLA Closing */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {item.slaClosing ? (
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded ${
                            item.status === 'closing' 
                              ? 'bg-emerald-200 text-emerald-950 font-black' 
                              : item.status === 'reservation' 
                              ? 'bg-cyan-200 text-cyan-950 font-black'
                              : item.status === 'cancelled'
                              ? 'bg-rose-200 text-rose-950 font-black'
                              : 'bg-slate-200 text-slate-900'
                          }`}>
                            {item.slaClosing}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* 14. Status Badge */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusConf.badge}`}>
                          {item.status === 'closing' && (item.closingUnits && item.closingUnits > 1 ? `Closing (${item.closingUnits} Unit)` : 'Closing')}
                          {item.status === 'reservation' && 'Reservasi'}
                          {item.status === 'cancelled' && 'Batal'}
                          {item.status === 'in_progress' && 'Visited'}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Menampilkan <strong>{filteredLeads.length}</strong> record kunjungan fisik.</span>
          <span className="italic">Data diselaraskan secara akurat dengan dokumen Excel/PDF Visited Leads Upper West BSD City.</span>
        </div>
      </div>

      {/* 6. Preview / Detail Modal Drawer if Row Clicked */}
      {previewRecord && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Lead Visited No. #{previewRecord.no}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{previewRecord.leadName}</h3>
                <p className="text-xs text-slate-500">{previewRecord.incomingLeads} &bull; {previewRecord.month} {previewRecord.year}</p>
              </div>
              <button
                onClick={() => setPreviewRecord(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Status Outcome Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              previewRecord.status === 'closing' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : previewRecord.status === 'reservation'
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                : previewRecord.status === 'cancelled'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                {previewRecord.status === 'closing' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {previewRecord.status === 'reservation' && <Bookmark className="w-5 h-5 text-cyan-600" />}
                {previewRecord.status === 'cancelled' && <XCircle className="w-5 h-5 text-rose-600" />}
                {previewRecord.status === 'in_progress' && <Clock className="w-5 h-5 text-slate-500" />}
                <div>
                  <div className="text-xs font-bold">
                    {previewRecord.status === 'closing' && (previewRecord.closingUnits && previewRecord.closingUnits > 1 ? `Status: Closing (${previewRecord.closingUnits} Unit Deal)` : 'Status: Closing (Deal Sukses)')}
                    {previewRecord.status === 'reservation' && 'Status: Reservasi Unit'}
                    {previewRecord.status === 'cancelled' && 'Status: Batal / Cancelled'}
                    {previewRecord.status === 'in_progress' && 'Status: Visited / Dalam Follow Up'}
                  </div>
                  {previewRecord.slaClosing && (
                    <div className="text-[11px] font-mono mt-0.5">
                      SLA Closing: <strong>{previewRecord.slaClosing}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Key Visit Data Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal Visit:</span>
                <span className="font-extrabold text-purple-900 text-sm">{previewRecord.dateVisit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">SLA ke Visit:</span>
                <span className="font-bold text-slate-800">{previewRecord.slaVisit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Sales In Charge:</span>
                <span className="font-bold text-slate-900">{previewRecord.assignedTo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tim:</span>
                <span className="font-bold text-slate-800">{previewRecord.teamUnder}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Source / Channel:</span>
                <span className="font-bold text-slate-800">{previewRecord.source} ({previewRecord.adSource})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">First Response Time:</span>
                <span className="font-mono font-bold text-slate-800">{previewRecord.firstResponseTime}</span>
              </div>
              {previewRecord.lastFu && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Follow Up:</span>
                  <span className="font-bold text-slate-800">{previewRecord.lastFu}</span>
                </div>
              )}
              {previewRecord.nextFu && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Next Follow Up:</span>
                  <span className="font-bold text-slate-800">{previewRecord.nextFu}</span>
                </div>
              )}
            </div>

            {/* Remarks Full Content */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600 block">Catatan & Minat Prospek:</span>
              <p className="text-xs text-slate-800 bg-slate-100 p-3 rounded-lg border border-slate-200/80 leading-relaxed font-medium">
                "{previewRecord.remarks}"
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviewRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
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
