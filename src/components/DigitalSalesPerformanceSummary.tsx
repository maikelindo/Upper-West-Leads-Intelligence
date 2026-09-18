import React, { useState, useMemo } from 'react';
import { 
  DIGITAL_SALES_TRANSACTIONS, 
  getDigitalSalesSummary, 
  DigitalSalesTransaction 
} from '../data/digitalSalesRevenueData';
import { formatRupiah } from '../services/leadScoring';
import { 
  Award, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Filter, 
  Sparkles,
  ChevronRight,
  CreditCard,
  Globe,
  Share2,
  Download,
  Search,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Flame
} from 'lucide-react';

export const DigitalSalesPerformanceSummary: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'closing' | 'reservation' | 'cancelled'>('ALL');
  const [salesFilter, setSalesFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [displayStyle, setDisplayStyle] = useState<'executive' | 'classic'>('executive');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const summary = useMemo(() => getDigitalSalesSummary(), []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return DIGITAL_SALES_TRANSACTIONS.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (salesFilter !== 'ALL' && t.namaSales !== salesFilter) return false;
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesSales = t.namaSales.toLowerCase().includes(query) || t.salesFullName.toLowerCase().includes(query);
        const matchesUnit = t.unitInfo.toLowerCase().includes(query);
        const matchesSource = t.sourceAds.toLowerCase().includes(query);
        const matchesCaraBayar = t.caraBayar.toLowerCase().includes(query);
        if (!matchesSales && !matchesUnit && !matchesSource && !matchesCaraBayar) return false;
      }
      return true;
    });
  }, [statusFilter, salesFilter, searchTerm]);

  const uniqueSalesNames = useMemo(() => {
    return Array.from(new Set(DIGITAL_SALES_TRANSACTIONS.map(t => t.namaSales)));
  }, []);

  const totalFilteredRevenue = useMemo(() => {
    return filteredTransactions
      .filter(t => t.status === 'closing')
      .reduce((sum, t) => sum + t.hargaExclPPN, 0);
  }, [filteredTransactions]);

  const handleExportCsv = () => {
    const headers = ['No', 'Harga Pengikatan (Excl PPN)', 'Nilai Numerik', 'Nama Sales', 'Nama Lengkap', 'Cara Bayar', 'Source Ads', 'Status', 'Ref Unit'];
    const rows = filteredTransactions.map(t => [
      t.no,
      `"${t.hargaFormatted}"`,
      t.hargaExclPPN,
      `"${t.namaSales}"`,
      `"${t.salesFullName}"`,
      `"${t.caraBayar}"`,
      `"${t.sourceAds}"`,
      `"${t.status.toUpperCase()}"`,
      `"${t.unitInfo}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Penjualan_Source_Digital_UpperWest_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('📥 Data penjualan digital berhasil diexport!');
  };

  const triggerToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  // Average price per closing unit
  const avgClosingTicket = summary.totalClosingUnits > 0 
    ? Math.round(summary.totalNetRevenue / summary.totalClosingUnits) 
    : 0;

  return (
    <div id="penjualan-source-digital" className="space-y-6">
      
      {/* Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-400/40 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* 1. Main Luxury Executive Header Card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-white">
        <div className="bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900 text-white p-6 sm:p-7 relative">
          {/* Subtle ambient lighting accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-6">
            {/* Top Bar: Badges + Title + Quick Status Pills */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-xs">
                    <Award className="w-3.5 h-3.5" /> REVENUE EXCL. PPN
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/10">
                    Proyek Upper West BSD City
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  Penjualan Source Digital &amp; Top Sales
                </h1>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{summary.totalClosingUnits} Closing Sah</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{summary.totalReservationUnits} Reservasi</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-300 font-bold">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{summary.totalCancelledUnits} Batal</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-semibold font-mono">
                  12 Deals Inbound
                </div>
              </div>
            </div>

            {/* 4 Clean Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              {/* Card 1: Total Omset Closing */}
              <div className="bg-white/5 hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Total Closing Sah
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-2 tracking-tight">
                  {formatRupiah(summary.totalNetRevenue)}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <span>9 Unit Pengikatan · Excl. PPN</span>
                </div>
              </div>

              {/* Card 2: Rata-rata Nilai Unit */}
              <div className="bg-white/5 hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Rata-rata Harga Unit
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-200 mt-2 tracking-tight">
                  {formatRupiah(avgClosingTicket)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Excl. PPN per Unit Closing
                </div>
              </div>

              {/* Card 3: Status Reservasi */}
              <div className="bg-white/5 hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Pipeline Reservasi
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-2 tracking-tight flex items-baseline gap-2">
                  <span>{summary.totalReservationUnits} Unit</span>
                  <span className="text-xs text-amber-400 font-bold font-sans">Kuning</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Potensi Pengikatan Berjalan
                </div>
              </div>

              {/* Card 4: Status Batal */}
              <div className="bg-white/5 hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Transaksi Batal
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <XCircle className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-2 tracking-tight flex items-baseline gap-2">
                  <span>{summary.totalCancelledUnits} Unit</span>
                  <span className="text-xs text-rose-400 font-bold font-sans">Merah</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Status Drop / Canvassing
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top Sales Podium - Ranked by Omset Excl PPN */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Top Sales Advisor Penjualan Source Digital</span>
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
              5 Sales Representative
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {summary.salesRankings.map((sales, idx) => {
              const rank = idx + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              const medalBg = isFirst 
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs' 
                : isSecond 
                ? 'bg-slate-300 text-slate-900 font-bold' 
                : isThird 
                ? 'bg-amber-700 text-white font-bold' 
                : 'bg-slate-100 text-slate-600 font-bold';

              const cardStyle = isFirst
                ? 'bg-gradient-to-b from-amber-500/10 via-amber-50/40 to-white border-amber-300/90 ring-1 ring-amber-400/40 shadow-sm'
                : isSecond
                ? 'bg-gradient-to-b from-slate-100/70 to-white border-slate-300 shadow-2xs'
                : isThird
                ? 'bg-gradient-to-b from-amber-50/30 to-white border-amber-200 shadow-2xs'
                : 'bg-white border-slate-200 shadow-2xs';

              return (
                <div 
                  key={sales.salesKey}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md ${cardStyle}`}
                >
                  <div>
                    {/* Header with Rank & Share */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${medalBg}`}>
                        {isFirst && <Award className="w-3 h-3" />}
                        Juara #{rank}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {sales.shareOfRevenuePct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Sales Profile */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={sales.avatar} 
                          alt={sales.salesFullName}
                          className="w-12 h-12 rounded-full border-2 border-white shadow-xs object-cover" 
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center border border-white">
                          #{rank}
                        </span>
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-black text-slate-900 truncate">
                          {sales.salesName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate font-medium">
                          {sales.salesFullName}
                        </p>
                      </div>
                    </div>

                    {/* Omset Display */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Total Omset Closing
                      </span>
                      <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                        {sales.totalRevenueExclPPN > 0 ? formatRupiah(sales.totalRevenueExclPPN) : 'Rp 0'}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Excl PPN
                      </span>
                    </div>
                  </div>

                  {/* Units Count Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-semibold">Closing Sah:</span>
                      <span className="font-mono font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                        {sales.closingUnits} Unit
                      </span>
                    </div>

                    {(sales.reservationUnits > 0 || sales.cancelledUnits > 0) && (
                      <div className="flex flex-wrap gap-1 text-[10px] font-semibold pt-1">
                        {sales.reservationUnits > 0 && (
                          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                            +{sales.reservationUnits} Reservasi
                          </span>
                        )}
                        {sales.cancelledUnits > 0 && (
                          <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded">
                            {sales.cancelledUnits} Batal ({formatRupiah(sales.grossRevenueExclPPN - sales.totalRevenueExclPPN)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Channels Contribution Card */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Kontribusi Penjualan per Kanal Iklan Digital (Closing Excl PPN)</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              3 Saluran Iklan Utama
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.sourceAdsBreakdown.map(src => {
              const sharePct = summary.totalNetRevenue > 0 ? (src.revenue / summary.totalNetRevenue) * 100 : 0;
              return (
                <div key={src.name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <span className="text-xs font-black text-slate-900">{src.name}</span>
                    </div>
                    <span className="text-xs font-black font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {sharePct.toFixed(1)}% Share
                    </span>
                  </div>

                  <div className="text-lg font-black font-mono text-slate-900 mt-1">
                    {formatRupiah(src.revenue)}
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${sharePct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
                    <span>{src.units} Unit Closing Sah</span>
                    <span>Excl PPN</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Interactive Transaction Table with Luxury Layout */}
        <div className="p-6 space-y-4">
          
          {/* Table Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Rincian Transaksi Penjualan Digital
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {filteredTransactions.length} Transaksi
              </span>
            </div>

            {/* Filter & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Cari sales, unit, cara bayar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white w-48 sm:w-56"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua (12)
                </button>
                <button
                  onClick={() => setStatusFilter('closing')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    statusFilter === 'closing'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Closing (9)
                </button>
                <button
                  onClick={() => setStatusFilter('reservation')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    statusFilter === 'reservation'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  Reservasi (2)
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    statusFilter === 'cancelled'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Batal (1)
                </button>
              </div>

              {/* Sales Filter */}
              <select
                value={salesFilter}
                onChange={(e) => setSalesFilter(e.target.value)}
                className="text-xs font-bold bg-white text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Sales</option>
                {uniqueSalesNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* Style Toggle (Executive vs Raw Excel Highlighter) */}
              <button
                onClick={() => setDisplayStyle(prev => prev === 'executive' ? 'classic' : 'executive')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Ganti gaya tampilan: Modern Eksekutif vs Highlight Warna Spreadsheet"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>{displayStyle === 'executive' ? 'Mode Modern' : 'Mode Excel'}</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider select-none">
                    <th className="py-3 px-3 text-center w-12 border-r border-slate-800">No</th>
                    <th className="py-3 px-4 border-r border-slate-800">Harga Pengikatan (Excl PPN)</th>
                    <th className="py-3 px-4 border-r border-slate-800">Sales Advisor</th>
                    <th className="py-3 px-4 border-r border-slate-800">Cara Bayar</th>
                    <th className="py-3 px-4 border-r border-slate-800">Source Ads</th>
                    <th className="py-3 px-4 text-center">Status &amp; Referensi Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const isRed = tx.rowHighlight === 'red';
                    const isYellow = tx.rowHighlight === 'yellow';
                    const isClosing = tx.status === 'closing';

                    // Mode 1: Executive styling (Soft, crisp, luxury borders)
                    // Mode 2: Classic styling (Exact bright colors from spreadsheet)
                    let rowClasses = '';
                    if (displayStyle === 'classic') {
                      if (isRed) {
                        rowClasses = 'bg-rose-500 text-white font-bold hover:bg-rose-600';
                      } else if (isYellow) {
                        rowClasses = 'bg-yellow-300 text-slate-950 font-bold hover:bg-yellow-400';
                      } else {
                        rowClasses = 'bg-white hover:bg-slate-50 text-slate-800';
                      }
                    } else {
                      // Executive modern style
                      if (isRed) {
                        rowClasses = 'bg-rose-50/60 hover:bg-rose-50 border-l-4 border-l-rose-500';
                      } else if (isYellow) {
                        rowClasses = 'bg-amber-50/70 hover:bg-amber-100/60 border-l-4 border-l-amber-500';
                      } else {
                        rowClasses = 'bg-white hover:bg-slate-50/80 border-l-4 border-l-emerald-500';
                      }
                    }

                    return (
                      <tr key={tx.id} className={`${rowClasses} transition-colors`}>
                        {/* No */}
                        <td className={`py-3 px-3 text-center font-bold ${
                          displayStyle === 'classic' && isRed ? 'text-white' : 'text-slate-500'
                        }`}>
                          {tx.no}
                        </td>

                        {/* Harga Pengikatan (Excl PPN) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black text-xs ${
                              displayStyle === 'classic' 
                                ? (isRed ? 'text-white' : 'text-slate-950') 
                                : (isRed ? 'text-rose-900 line-through opacity-80' : isYellow ? 'text-amber-950' : 'text-slate-950 font-extrabold')
                            }`}>
                              {tx.hargaFormatted}
                            </span>
                            {displayStyle === 'executive' && isClosing && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                                Sah
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Nama Sales */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              displayStyle === 'classic' && isRed
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}>
                              {tx.namaSales.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className={`font-black text-xs ${
                                displayStyle === 'classic' && isRed ? 'text-white' : 'text-slate-900'
                              }`}>
                                {tx.namaSales}
                              </div>
                              <div className={`text-[10px] ${
                                displayStyle === 'classic' && isRed ? 'text-rose-100' : 'text-slate-400'
                              }`}>
                                {tx.salesFullName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cara Bayar */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            displayStyle === 'classic' && isRed
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-800 border border-slate-200/80'
                          }`}>
                            {tx.caraBayar}
                          </span>
                        </td>

                        {/* Source Ads */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                            <span className={`text-xs font-semibold ${
                              displayStyle === 'classic' && isRed ? 'text-white' : 'text-slate-700'
                            }`}>
                              {tx.sourceAds}
                            </span>
                          </div>
                        </td>

                        {/* Status / Ref Unit */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isRed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black bg-rose-600 text-white px-2.5 py-1 rounded-md shadow-xs">
                                <XCircle className="w-3 h-3" /> Batal
                              </span>
                            ) : isYellow ? (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black bg-amber-500 text-slate-950 px-2.5 py-1 rounded-md shadow-xs">
                                <AlertCircle className="w-3 h-3" /> Reservasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black bg-emerald-600 text-white px-2.5 py-1 rounded-md shadow-xs">
                                <CheckCircle2 className="w-3 h-3" /> Closing Sah
                              </span>
                            )}

                            {tx.unitInfo && (
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                displayStyle === 'classic' && isRed 
                                  ? 'bg-rose-700 text-white' 
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {tx.unitInfo}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary Numbers */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-slate-600 text-xs">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0" />
                  <span>Closing Sah: <strong className="text-slate-900">{summary.totalClosingUnits} Unit ({formatRupiah(summary.totalNetRevenue)})</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                  <span>Reservasi: <strong className="text-slate-900">{summary.totalReservationUnits} Unit ({formatRupiah(summary.totalReservationRevenue)})</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded-md bg-rose-600 shrink-0" />
                  <span>Batal: <strong className="text-slate-900">{summary.totalCancelledUnits} Unit ({formatRupiah(summary.grossRevenueExclPPN - summary.totalNetRevenue - summary.totalReservationRevenue)})</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-black text-slate-900 text-xs sm:text-sm self-end sm:self-auto">
                <span>Total Net Omset Closing:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {formatRupiah(summary.totalNetRevenue)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
