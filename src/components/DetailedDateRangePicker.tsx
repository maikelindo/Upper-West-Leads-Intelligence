import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  RotateCcw,
  Check,
  X,
  Clock,
  Sparkles
} from 'lucide-react';

export interface DateRangeValue {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label?: string;
  isAllTime?: boolean;
}

interface DetailedDateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isAllTime?: boolean;
  onApply: (start: string, end: string, isAllTime?: boolean, customLabel?: string) => void;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  currentMonthHint?: string; // e.g. "2026-09"
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Helper to format YYYY-MM-DD
function formatIso(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// Helper to parse YYYY-MM-DD
function parseIso(isoStr?: string): { year: number; month: number; day: number } | null {
  if (!isoStr || isoStr === 'ALL') return null;
  const parts = isoStr.split('-');
  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }
  return null;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, ...
}

export function formatDisplayDate(isoStr?: string): string {
  if (!isoStr || isoStr === 'ALL') return '';
  const parsed = parseIso(isoStr);
  if (!parsed) return isoStr;
  return `${String(parsed.day).padStart(2, '0')} ${MONTH_NAMES_SHORT[parsed.month]} ${parsed.year}`;
}

export const DetailedDateRangePicker: React.FC<DetailedDateRangePickerProps> = ({
  startDate,
  endDate,
  isAllTime = false,
  onApply,
  className = '',
  buttonClassName = '',
  align = 'left',
  currentMonthHint = '2026-09'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal selection state
  const [selectedStart, setSelectedStart] = useState<string>(startDate || '2026-09-01');
  const [selectedEnd, setSelectedEnd] = useState<string>(endDate || '2026-09-30');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [isPickingEnd, setIsPickingEnd] = useState<boolean>(false);
  const [internalAllTime, setInternalAllTime] = useState<boolean>(isAllTime);

  // Synchronize state with props immediately when props change
  useEffect(() => {
    setSelectedStart(startDate || '2026-09-01');
    setSelectedEnd(endDate || '2026-09-30');
    setInternalAllTime(isAllTime);
  }, [startDate, endDate, isAllTime]);

  // Active view months for Left and Right calendars
  const initialLeft = useMemo(() => {
    const parsed = parseIso(startDate) || parseIso(currentMonthHint ? `${currentMonthHint}-01` : '2026-09-01');
    if (parsed) {
      return { year: parsed.year, month: parsed.month };
    }
    return { year: 2026, month: 8 }; // September (0-indexed 8)
  }, [startDate, currentMonthHint]);

  const [leftYear, setLeftYear] = useState<number>(initialLeft.year);
  const [leftMonth, setLeftMonth] = useState<number>(initialLeft.month);

  // When opening modal, ensure view month aligns with current start date
  useEffect(() => {
    if (isOpen) {
      const parsed = parseIso(startDate) || parseIso(currentMonthHint ? `${currentMonthHint}-01` : '2026-09-01');
      if (parsed) {
        setLeftYear(parsed.year);
        setLeftMonth(parsed.month);
      }
      setIsPickingEnd(false);
      setHoveredDate(null);
    }
  }, [isOpen, startDate, currentMonthHint]);

  // Right calendar is always 1 month after Left calendar
  const rightDate = useMemo(() => {
    let m = leftMonth + 1;
    let y = leftYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    return { year: y, month: m };
  }, [leftYear, leftMonth]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear(leftYear - 1);
    } else {
      setLeftMonth(leftMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear(leftYear + 1);
    } else {
      setLeftMonth(leftMonth + 1);
    }
  };

  const handleLeftMonthSelect = (mIndex: number) => {
    setLeftMonth(mIndex);
  };

  const handleLeftYearSelect = (y: number) => {
    setLeftYear(y);
  };

  const handleRightMonthSelect = (mIndex: number) => {
    let prevM = mIndex - 1;
    let prevY = rightDate.year;
    if (prevM < 0) {
      prevM = 11;
      prevY -= 1;
    }
    setLeftYear(prevY);
    setLeftMonth(prevM);
  };

  const handleRightYearSelect = (y: number) => {
    let prevM = rightDate.month - 1;
    let prevY = y;
    if (prevM < 0) {
      prevM = 11;
      prevY -= 1;
    }
    setLeftYear(prevY);
    setLeftMonth(prevM);
  };

  // Date selection logic
  const handleDayClick = (isoString: string) => {
    setInternalAllTime(false);
    if (!isPickingEnd) {
      // First click: sets start date
      setSelectedStart(isoString);
      setSelectedEnd(isoString);
      setIsPickingEnd(true);
    } else {
      // Second click: sets end date
      let finalStart = selectedStart;
      let finalEnd = isoString;
      if (isoString < selectedStart) {
        finalStart = isoString;
        finalEnd = selectedStart;
      }
      setSelectedStart(finalStart);
      setSelectedEnd(finalEnd);
      setIsPickingEnd(false);
    }
  };

  // Presets - IMMEDIATELY APPLY AND CLOSE for instant responsiveness
  const applyPreset = (presetKey: string) => {
    const nowYear = 2026;
    let s = '2026-09-01';
    let e = '2026-09-30';
    let isAll = false;
    let label = '';

    if (presetKey === 'TODAY') {
      s = '2026-09-14';
      e = '2026-09-14';
      label = 'Hari Ini (14 Sep 2026)';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'YESTERDAY') {
      s = '2026-09-13';
      e = '2026-09-13';
      label = 'Kemarin (13 Sep 2026)';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'LAST_7_DAYS') {
      s = '2026-09-08';
      e = '2026-09-14';
      label = '7 Hari Terakhir (08 - 14 Sep)';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'LAST_14_DAYS') {
      s = '2026-09-01';
      e = '2026-09-14';
      label = '14 Hari Terakhir (01 - 14 Sep)';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'SEP_2026') {
      s = '2026-09-01';
      e = '2026-09-30';
      label = 'September 2026';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'AUG_2026') {
      s = '2026-08-01';
      e = '2026-08-31';
      label = 'Agustus 2026';
      setLeftYear(nowYear);
      setLeftMonth(7);
    } else if (presetKey === 'JUL_2026') {
      s = '2026-07-01';
      e = '2026-07-31';
      label = 'Juli 2026';
      setLeftYear(nowYear);
      setLeftMonth(6);
    } else if (presetKey === 'W1_SEP') {
      s = '2026-09-01';
      e = '2026-09-06';
      label = 'W1 Sep (01 - 06 Sep)';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'W2_SEP') {
      s = '2026-09-07';
      e = '2026-09-13';
      label = 'W2 Sep (07 - 13 Sep)';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'W3_SEP') {
      s = '2026-09-14';
      e = '2026-09-20';
      label = 'W3 Sep (14 - 20 Sep)';
      setLeftYear(nowYear);
      setLeftMonth(8);
    } else if (presetKey === 'ALL_TIME') {
      s = '2026-07-01';
      e = '2026-09-30';
      isAll = true;
      label = 'Semua Data (All-Time)';
    }

    setSelectedStart(s);
    setSelectedEnd(e);
    setInternalAllTime(isAll);
    setIsPickingEnd(false);
    setHoveredDate(null);

    // Instant notification & application to parent
    onApply(s, e, isAll, label);
    setIsOpen(false);
  };

  // Manual Confirmation Click
  const handleApply = () => {
    if (internalAllTime) {
      onApply('2026-07-01', '2026-09-30', true, 'Semua Data');
    } else {
      let finalStart = selectedStart;
      let finalEnd = selectedEnd;
      if (finalStart > finalEnd) {
        const temp = finalStart;
        finalStart = finalEnd;
        finalEnd = temp;
      }
      onApply(finalStart, finalEnd, false);
    }
    setIsOpen(false);
  };

  // Reset filter to All Time
  const handleReset = () => {
    setInternalAllTime(true);
    setSelectedStart('2026-07-01');
    setSelectedEnd('2026-09-30');
    onApply('2026-07-01', '2026-09-30', true, 'Semua Data');
    setIsOpen(false);
  };

  // Determine current active range for highlighting
  const effectiveRange = useMemo(() => {
    if (internalAllTime) return { start: '', end: '' };
    let start = selectedStart;
    let end = selectedEnd;

    if (isPickingEnd && hoveredDate) {
      if (hoveredDate < start) {
        end = start;
        start = hoveredDate;
      } else {
        end = hoveredDate;
      }
    } else if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }
    return { start, end };
  }, [selectedStart, selectedEnd, isPickingEnd, hoveredDate, internalAllTime]);

  // Calculate day count in selected range
  const daysSelectedCount = useMemo(() => {
    if (internalAllTime || !effectiveRange.start || !effectiveRange.end) return null;
    const d1 = new Date(effectiveRange.start);
    const d2 = new Date(effectiveRange.end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [effectiveRange, internalAllTime]);

  // Render days cells for a specific month
  const renderMonthDays = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);
    const cells: React.ReactNode[] = [];

    // Empty spaces before first day of month
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="h-9 w-9" />
      );
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = formatIso(year, month, day);
      const isStart = !internalAllTime && (iso === effectiveRange.start);
      const isEnd = !internalAllTime && (iso === effectiveRange.end);
      const isInRange = !internalAllTime && (iso > effectiveRange.start && iso < effectiveRange.end);

      let cellBgClasses = 'bg-transparent';
      let buttonClasses = 'h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer';

      if (isStart && isEnd) {
        buttonClasses += ' bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400 shadow-sm';
      } else if (isStart) {
        cellBgClasses = 'bg-amber-100 rounded-l-lg';
        buttonClasses += ' bg-amber-500 text-slate-950 font-black shadow-sm';
      } else if (isEnd) {
        cellBgClasses = 'bg-amber-100 rounded-r-lg';
        buttonClasses += ' bg-amber-500 text-slate-950 font-black shadow-sm';
      } else if (isInRange) {
        cellBgClasses = 'bg-amber-100/70';
        buttonClasses += ' text-amber-950 font-bold hover:bg-amber-200/80';
      } else {
        buttonClasses += ' text-slate-700 hover:bg-slate-100 hover:text-slate-950';
      }

      cells.push(
        <div 
          key={iso} 
          className={`h-9 w-9 flex items-center justify-center p-0.5 ${cellBgClasses}`}
          onMouseEnter={() => {
            if (isPickingEnd) setHoveredDate(iso);
          }}
        >
          <button
            type="button"
            onClick={() => handleDayClick(iso)}
            className={buttonClasses}
          >
            {day}
          </button>
        </div>
      );
    }

    return cells;
  };

  // Display label on trigger button
  const displayButtonLabel = useMemo(() => {
    if (isAllTime) {
      return 'Semua Data (All-Time)';
    }
    if (!startDate || !endDate) {
      return 'Pilih Tanggal';
    }
    const startStr = formatDisplayDate(startDate);
    const endStr = formatDisplayDate(endDate);
    if (startDate === endDate) {
      return startStr;
    }
    return `${startStr} — ${endStr}`;
  }, [startDate, endDate, isAllTime]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="detailed-date-picker-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-300 rounded-xl shadow-2xs text-xs font-black text-slate-800 transition-all cursor-pointer ${
          isOpen ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20' : ''
        } ${buttonClassName}`}
        title="Buka Kalender Filter Tanggal Detail"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">{displayButtonLabel}</span>
          {!isAllTime && daysSelectedCount && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-extrabold">
              {daysSelectedCount} hari
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
      </button>

      {/* Popover Calendar Modal */}
      {isOpen && (
        <div 
          className={`absolute top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ minWidth: '340px', maxWidth: '95vw' }}
        >
          {/* Quick Date Inputs Bar */}
          <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="text-slate-500">Dari:</span>
              <input
                type="date"
                value={selectedStart}
                onChange={(e) => {
                  setInternalAllTime(false);
                  setSelectedStart(e.target.value);
                  const p = parseIso(e.target.value);
                  if (p) {
                    setLeftYear(p.year);
                    setLeftMonth(p.month);
                  }
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
              />
              <span className="text-slate-500">s/d</span>
              <input
                type="date"
                value={selectedEnd}
                onChange={(e) => {
                  setInternalAllTime(false);
                  setSelectedEnd(e.target.value);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Terapkan
            </button>
          </div>

          {/* Main Dual Calendar Flexbox */}
          <div className="flex flex-col lg:flex-row gap-5">
            
            {/* Quick Presets Sidebar */}
            <div className="w-full lg:w-44 border-b lg:border-b-0 lg:border-r border-slate-100 pb-3 lg:pb-0 lg:pr-4 flex lg:flex-col flex-wrap gap-1">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1 block w-full">
                Rentang Cepat
              </span>

              <button
                type="button"
                onClick={() => applyPreset('TODAY')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  !internalAllTime && selectedStart === '2026-09-14' && selectedEnd === '2026-09-14'
                    ? 'bg-amber-100 text-amber-900 font-black'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                ⚡ Hari Ini (14 Sep)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('YESTERDAY')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  !internalAllTime && selectedStart === '2026-09-13' && selectedEnd === '2026-09-13'
                    ? 'bg-amber-100 text-amber-900 font-black'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Kemarin (13 Sep)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('LAST_7_DAYS')}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyPreset('LAST_14_DAYS')}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                14 Hari Terakhir
              </button>

              <div className="my-1 border-t border-slate-100 w-full" />
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1 block w-full">
                Bulan & Minggu
              </span>

              <button
                type="button"
                onClick={() => applyPreset('SEP_2026')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  !internalAllTime && selectedStart === '2026-09-01' && selectedEnd === '2026-09-30'
                    ? 'bg-amber-100 text-amber-900 font-black'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                September 2026
              </button>

              <button
                type="button"
                onClick={() => applyPreset('AUG_2026')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  !internalAllTime && selectedStart === '2026-08-01' && selectedEnd === '2026-08-31'
                    ? 'bg-amber-100 text-amber-900 font-black'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Agustus 2026
              </button>

              <button
                type="button"
                onClick={() => applyPreset('JUL_2026')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  !internalAllTime && selectedStart === '2026-07-01' && selectedEnd === '2026-07-31'
                    ? 'bg-amber-100 text-amber-900 font-black'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Juli 2026
              </button>

              <div className="my-1 border-t border-slate-100 w-full" />
              <button
                type="button"
                onClick={() => applyPreset('W1_SEP')}
                className="text-left px-2.5 py-1 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                W1 (01 - 06 Sep)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('W2_SEP')}
                className="text-left px-2.5 py-1 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                W2 (07 - 13 Sep)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('W3_SEP')}
                className="text-left px-2.5 py-1 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                W3 (14 - 20 Sep)
              </button>

              <div className="my-1 border-t border-slate-100 w-full" />
              <button
                type="button"
                id="btn-preset-all-time"
                onClick={() => applyPreset('ALL_TIME')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  internalAllTime ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                ⭐ Semua Data (All-Time)
              </button>
            </div>

            {/* Calendar Grids Section */}
            <div className="flex-1">
              {/* Dual Month Columns */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Left Calendar (e.g. Sep 2026) */}
                <div className="w-[260px] select-none">
                  {/* Left Header with < Chevron */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Month Dropdown */}
                      <div className="relative inline-flex items-center">
                        <select
                          value={leftMonth}
                          onChange={(e) => handleLeftMonthSelect(parseInt(e.target.value, 10))}
                          className="appearance-none text-sm font-black text-slate-900 pr-5 pl-1.5 py-1 bg-transparent hover:bg-slate-100 rounded-md cursor-pointer focus:outline-none"
                        >
                          {MONTH_NAMES_SHORT.map((name, idx) => (
                            <option key={name} value={idx}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none -ml-4" />
                      </div>

                      {/* Year Dropdown */}
                      <div className="relative inline-flex items-center">
                        <select
                          value={leftYear}
                          onChange={(e) => handleLeftYearSelect(parseInt(e.target.value, 10))}
                          className="appearance-none text-sm font-black text-slate-900 pr-5 pl-1.5 py-1 bg-transparent hover:bg-slate-100 rounded-md cursor-pointer focus:outline-none"
                        >
                          {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none -ml-4" />
                      </div>
                    </div>

                    <div className="w-6" /> {/* spacer */}
                  </div>

                  {/* Weekday Names Row: Min, Sen, Sel, Rab, Kam, Jum, Sab */}
                  <div className="grid grid-cols-7 mb-1 text-center">
                    {DAY_NAMES.map((name) => (
                      <div key={name} className="h-7 flex items-center justify-center text-[11px] font-semibold text-slate-500">
                        {name}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-y-0.5 text-center">
                    {renderMonthDays(leftYear, leftMonth)}
                  </div>
                </div>

                {/* Right Calendar (e.g. Okt 2026) */}
                <div className="w-[260px] select-none">
                  {/* Right Header with > Chevron */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="w-6" /> {/* spacer */}

                    <div className="flex items-center gap-1">
                      {/* Month Dropdown */}
                      <div className="relative inline-flex items-center">
                        <select
                          value={rightDate.month}
                          onChange={(e) => handleRightMonthSelect(parseInt(e.target.value, 10))}
                          className="appearance-none text-sm font-black text-slate-900 pr-5 pl-1.5 py-1 bg-transparent hover:bg-slate-100 rounded-md cursor-pointer focus:outline-none"
                        >
                          {MONTH_NAMES_SHORT.map((name, idx) => (
                            <option key={name} value={idx}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none -ml-4" />
                      </div>

                      {/* Year Dropdown */}
                      <div className="relative inline-flex items-center">
                        <select
                          value={rightDate.year}
                          onChange={(e) => handleRightYearSelect(parseInt(e.target.value, 10))}
                          className="appearance-none text-sm font-black text-slate-900 pr-5 pl-1.5 py-1 bg-transparent hover:bg-slate-100 rounded-md cursor-pointer focus:outline-none"
                        >
                          {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none -ml-4" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      title="Bulan Selanjutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday Names Row: Min, Sen, Sel, Rab, Kam, Jum, Sab */}
                  <div className="grid grid-cols-7 mb-1 text-center">
                    {DAY_NAMES.map((name) => (
                      <div key={name} className="h-7 flex items-center justify-center text-[11px] font-semibold text-slate-500">
                        {name}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-y-0.5 text-center">
                    {renderMonthDays(rightDate.year, rightDate.month)}
                  </div>
                </div>
              </div>

              {/* Bottom Selected Range Bar & Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <span>Terpilih:</span>
                  {internalAllTime ? (
                    <span className="font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Semua Data (All-Time)
                    </span>
                  ) : (
                    <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {formatDisplayDate(effectiveRange.start)} — {formatDisplayDate(effectiveRange.end)}
                      {daysSelectedCount && (
                        <span className="ml-1.5 text-amber-700 font-extrabold">({daysSelectedCount} hari)</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    id="btn-apply-date-filter"
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Terapkan Filter Tanggal</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
