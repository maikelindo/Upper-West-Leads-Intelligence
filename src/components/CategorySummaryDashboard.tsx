import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Lead, LeadCategory, CategorySummaryStat } from '../types';
import { 
  calculateCategorySummary, 
  getCategoryMeta, 
  formatRupiah 
} from '../services/leadScoring';
import { 
  getWeeksForMonth, 
  AUGUST_2026_WEEKS, 
  JULY_2026_WEEKS,
  WeekRange, 
  filterLeadsByWeek 
} from '../utils/dateUtils';
import { 
  FileSpreadsheet, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Flame, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { DetailedDateRangePicker } from './DetailedDateRangePicker';
import confetti from 'canvas-confetti';

interface CategorySummaryDashboardProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
  onFilterByCategory?: (category: LeadCategory | 'ALL') => void;
  onSelectCategoryFilter?: (category: LeadCategory | 'ALL') => void;
  activeCategoryFilter?: LeadCategory | 'ALL';
  selectedCategoryFilter?: LeadCategory | 'ALL';
  onOpenExcelImport: () => void;
  selectedMonth?: string;
  onMonthChange?: (m: string) => void;
  selectedWeekId?: string;
  onWeekChange?: (w: string) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
}

export const CategorySummaryDashboard: React.FC<CategorySummaryDashboardProps> = ({
  leads,
  onSelectLead,
  onFilterByCategory,
  onSelectCategoryFilter,
  activeCategoryFilter = 'ALL',
  selectedCategoryFilter,
  onOpenExcelImport,
  selectedMonth: propMonth,
  onMonthChange,
  selectedWeekId: propWeekId,
  onWeekChange,
  customStartDate: propCustomStart,
  customEndDate: propCustomEnd,
  onCustomDateChange,
}) => {
  const currentFilter = selectedCategoryFilter || activeCategoryFilter;
  const handleFilterClick = (category: LeadCategory | 'ALL') => {
    if (onFilterByCategory) {
      onFilterByCategory(category);
    } else if (onSelectCategoryFilter) {
      onSelectCategoryFilter(category);
    }
  };

  // Internal Month state if not passed from parent
  const [internalMonth, setInternalMonth] = useState<string>('2026-08');
  const [internalWeekId, setInternalWeekId] = useState<string>('ALL');
  const [internalStart, setInternalStart] = useState<string>('2026-08-01');
  const [internalEnd, setInternalEnd] = useState<string>('2026-08-16');

  const selectedMonth = propMonth !== undefined ? propMonth : internalMonth;
  const selectedWeekId = propWeekId !== undefined ? propWeekId : internalWeekId;
  const customStartDate = propCustomStart !== undefined ? propCustomStart : internalStart;
  const customEndDate = propCustomEnd !== undefined ? propCustomEnd : internalEnd;

  // Available Months
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add('2026-09');
    monthSet.add('2026-08');
    monthSet.add('2026-07');

    leads.forEach((l) => {
      if (l.dateContact) {
        const parts = l.dateContact.split('-');
        if (parts.length >= 3) {
          const monthStr = parts[1]?.toLowerCase();
          const yearStr = parts[2]?.slice(0, 2);
          const monthMap: Record<string, string> = {
            jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
            jun: '06', jul: '07', agt: '08', aug: '08', sep: '09', okt: '10', oct: '10',
            nov: '11', des: '12', dec: '12'
          };
          const mNum = monthMap[monthStr] || '08';
          const yNum = yearStr ? `20${yearStr}` : '2026';
          monthSet.add(`${yNum}-${mNum}`);
        }
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [leads]);

  const getMonthLabel = (mKey: string) => {
    if (mKey === 'ALL') return 'Semua Bulan (All-Time)';
    const [year, month] = mKey.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || 'Bulan'} ${year}`;
  };

  const activeWeeksList = useMemo(() => {
    return getWeeksForMonth(selectedMonth);
  }, [selectedMonth]);

  const handleMonthSelect = (m: string) => {
    if (onMonthChange) onMonthChange(m);
    else setInternalMonth(m);

    if (onWeekChange) onWeekChange('ALL');
    else setInternalWeekId('ALL');

    if (m === '2026-07') {
      if (onCustomDateChange) onCustomDateChange('2026-07-01', '2026-07-31');
      else { setInternalStart('2026-07-01'); setInternalEnd('2026-07-31'); }
    } else if (m === '2026-08') {
      if (onCustomDateChange) onCustomDateChange('2026-08-01', '2026-08-31');
      else { setInternalStart('2026-08-01'); setInternalEnd('2026-08-31'); }
    } else if (m === '2026-09') {
      if (onCustomDateChange) onCustomDateChange('2026-09-01', '2026-09-30');
      else { setInternalStart('2026-09-01'); setInternalEnd('2026-09-30'); }
    } else if (m === 'ALL') {
      if (onCustomDateChange) onCustomDateChange('2026-07-01', '2026-09-30');
      else { setInternalStart('2026-07-01'); setInternalEnd('2026-09-30'); }
    }
  };

  const handleDateRangeApply = (start: string, end: string, isAll?: boolean) => {
    if (isAll) {
      if (onMonthChange) onMonthChange('ALL');
      else setInternalMonth('ALL');

      if (onWeekChange) onWeekChange('ALL');
      else setInternalWeekId('ALL');

      if (onCustomDateChange) onCustomDateChange('2026-07-01', '2026-09-30');
      else {
        setInternalStart('2026-07-01');
        setInternalEnd('2026-09-30');
      }
    } else {
      const s = start <= end ? start : end;
      const e = start <= end ? end : start;

      if (onWeekChange) onWeekChange('CUSTOM');
      else setInternalWeekId('CUSTOM');

      if (onCustomDateChange) onCustomDateChange(s, e);
      else {
        setInternalStart(s);
        setInternalEnd(e);
      }

      const startM = s.slice(0, 7);
      const endM = e.slice(0, 7);
      if (startM === endM) {
        if (onMonthChange) onMonthChange(startM);
        else setInternalMonth(startM);
      } else {
        if (onMonthChange) onMonthChange('ALL');
        else setInternalMonth('ALL');
      }
    }
  };

  const handleWeekSelect = (w: string) => {
    if (onWeekChange) onWeekChange(w);
    else setInternalWeekId(w);
  };

  const handleStartDateSelect = (d: string) => {
    if (onCustomDateChange) onCustomDateChange(d, customEndDate);
    else setInternalStart(d);
  };

  const handleEndDateSelect = (d: string) => {
    if (onCustomDateChange) onCustomDateChange(customStartDate, d);
    else setInternalEnd(d);
  };

  const currentWeekMeta = useMemo(() => {
    if (selectedWeekId === 'CUSTOM') {
      return {
        id: 'CUSTOM',
        label: `Kustom: ${customStartDate} s/d ${customEndDate}`,
        shortLabel: 'Kustom',
        displayRange: `${customStartDate} s/d ${customEndDate}`,
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }
    const found = activeWeeksList.find((w) => w.id === selectedWeekId);
    return found || activeWeeksList[0] || AUGUST_2026_WEEKS[0];
  }, [selectedWeekId, customStartDate, customEndDate, activeWeeksList]);

  // Filter leads if not filtered from parent
  const timeFilteredLeads = useMemo(() => {
    // If parent passed already-filtered leads, we can check or apply filter
    return filterLeadsByWeek(leads, selectedWeekId, customStartDate, customEndDate, selectedMonth);
  }, [leads, selectedWeekId, customStartDate, customEndDate, selectedMonth]);

  const summaryStats = calculateCategorySummary(timeFilteredLeads);
  const totalLeadsCount = timeFilteredLeads.length;
  const totalPipeline = timeFilteredLeads.reduce((acc, l) => acc + (l.budgetEstimated || 0), 0);
  const averageScore = totalLeadsCount > 0 ? Math.round(timeFilteredLeads.reduce((acc, l) => acc + l.score, 0) / totalLeadsCount) : 0;

  // Export full CRM database to Excel
  const handleExportToExcel = () => {
    const exportData = timeFilteredLeads.map((l, index) => {
      const remarks = l.historyRemarks || l.notes?.join('. ') || '';
      return {
        'No': index + 1,
        'ID Lead': l.id,
        'Nama Prospek': l.name,
        'No Telepon / WhatsApp': l.phone,
        'Email': l.email,
        'Profesi / Perusahaan': `${l.occupation} - ${l.company || ''}`,
        'Kota': l.city || 'Tangerang Selatan',
        'Tipe Unit Diminati': l.preferredUnit,
        'Estimasi Budget (IDR)': l.budgetEstimated || 0,
        'Format Budget': formatRupiah(l.budgetEstimated || 0),
        'Skema Bayar': l.preferredPayment || 'In-House 36x',
        'Kategori Hasil Analisis': l.category || 'COLD',
        'Total Skor (0-100)': l.score,
        'Tier Kualitas': l.quality,
        'Omnichannel Source': l.primaryChannel,
        'History Remarks / Catatan': remarks,
        'Sinyal Terdeteksi': l.scoreBreakdown?.remarksEvaluation?.details.join(' | ') || '-',
        'Tanggal Aktivitas Terakhir': l.lastActivityAt ? new Date(l.lastActivityAt).toLocaleString('id-ID') : '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rangkuman Leads Upper West');

    // Auto fit column widths
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 25 },
      { wch: 20 },
      { wch: 28 },
      { wch: 30 },
      { wch: 20 },
      { wch: 30 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 50 },
      { wch: 35 },
      { wch: 25 },
    ];

    XLSX.writeFile(workbook, `Laporan_Rangkuman_Leads_Upper_West_${new Date().toISOString().slice(0, 10)}.xlsx`);
    confetti({ particleCount: 60, spread: 60 });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar: Month & Week Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-400">
                CRM DASHBOARD
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Dashboard Leads — {getMonthLabel(selectedMonth)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Detailed Calendar Date Range Picker */}
            <DetailedDateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              isAllTime={selectedMonth === 'ALL' && selectedWeekId === 'ALL'}
              currentMonthHint={selectedMonth !== 'ALL' ? selectedMonth : '2026-09'}
              onApply={handleDateRangeApply}
            />

            {/* Export Excel Button */}
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Active Period & Summary Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Rentang Tanggal Aktif:</span>
            </span>
            <span className="text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-mono">
              {selectedMonth === 'ALL' && selectedWeekId === 'ALL' 
                ? 'Semua Data (Juli - September 2026)' 
                : `${customStartDate} s/d ${customEndDate}`}
            </span>
          </div>

          <div className="text-xs text-amber-900 font-mono flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/80 px-2.5 py-1 rounded-lg shrink-0">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Total: <strong>{totalLeadsCount} Leads</strong></span>
          </div>
        </div>
      </div>

      {/* 5-Tier Category Interactive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryStats.map((stat) => {
          const isActive = currentFilter === stat.category;
          const meta = getCategoryMeta(stat.category);

          return (
            <div
              key={stat.category}
              onClick={() => handleFilterClick(isActive ? 'ALL' : stat.category)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isActive 
                  ? 'ring-2 ring-amber-500 bg-white shadow-md border-amber-400' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
              }`}
            >
              <div>
                {/* Badge & Filter status */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`}></span>
                    {stat.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{meta.scoreRange}</span>
                </div>

                {/* Count & Percentage */}
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">{stat.count}</span>
                  <span className="text-xs font-bold text-slate-500">{stat.percentage}% dari total</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-2">
                  <div 
                    className={`h-full ${meta.dotColor}`} 
                    style={{ width: `${Math.max(stat.percentage, 5)}%` }}
                  ></div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-500 leading-relaxed mb-1">
                  {meta.description}
                </p>
              </div>

              {/* Action Directive */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Rekomendasi Sales:</span>
                <span className="text-[10px] font-medium text-slate-700 line-clamp-2 mt-0.5">
                  {meta.recommendedAction}
                </span>
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 mt-2">
                  <span>{isActive ? '✓ Sedang Difilter' : 'Klik untuk filter tabel'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
