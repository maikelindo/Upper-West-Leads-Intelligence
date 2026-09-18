import { Lead } from '../types';

export interface WeekRange {
  id: string;
  label: string;
  shortLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  displayRange: string; // e.g. "03 Agu - 09 Agu 2026"
  isCurrentOrLatest?: boolean;
}

// Predefined weekly ranges for July 2026
export const JULY_2026_WEEKS: WeekRange[] = [
  {
    id: 'ALL',
    label: 'Semua Periode Juli (01 - 31 Jul 2026)',
    shortLabel: 'Semua',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    displayRange: '01 Jul - 31 Jul 2026',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_1',
    label: 'Minggu 1 (01 Jul - 05 Jul 2026)',
    shortLabel: 'W1 (01-05 Jul)',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    displayRange: '01 Jul - 05 Jul 2026',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_2',
    label: 'Minggu 2 (06 Jul - 12 Jul 2026)',
    shortLabel: 'W2 (06-12 Jul)',
    startDate: '2026-07-06',
    endDate: '2026-07-12',
    displayRange: '06 Jul - 12 Jul 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_3',
    label: 'Minggu 3 (13 Jul - 19 Jul 2026)',
    shortLabel: 'W3 (13-19 Jul)',
    startDate: '2026-07-13',
    endDate: '2026-07-19',
    displayRange: '13 Jul - 19 Jul 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_4',
    label: 'Minggu 4 (20 Jul - 26 Jul 2026)',
    shortLabel: 'W4 (20-26 Jul)',
    startDate: '2026-07-20',
    endDate: '2026-07-26',
    displayRange: '20 Jul - 26 Jul 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_5',
    label: 'Minggu 5 (27 Jul - 31 Jul 2026)',
    shortLabel: 'W5 (27-31 Jul)',
    startDate: '2026-07-27',
    endDate: '2026-07-31',
    displayRange: '27 Jul - 31 Jul 2026',
    isCurrentOrLatest: false,
  },
];

// Predefined weekly ranges (Senin - Minggu) covering August 2026 data
export const AUGUST_2026_WEEKS: WeekRange[] = [
  {
    id: 'ALL',
    label: 'Semua Periode Agustus (01 - 31 Agu 2026)',
    shortLabel: 'Semua',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    displayRange: '01 Agu - 31 Agu 2026',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_1',
    label: 'Minggu 1 (Senin 27 Jul - Minggu 02 Agu 2026)',
    shortLabel: 'W1 (01-02 Agu)',
    startDate: '2026-08-01',
    endDate: '2026-08-02',
    displayRange: '01 Agu - 02 Agu 2026 (Weekend Masuk)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_2',
    label: 'Minggu 2 (Senin 03 Agu - Minggu 09 Agu 2026)',
    shortLabel: 'W2 (03-09 Agu)',
    startDate: '2026-08-03',
    endDate: '2026-08-09',
    displayRange: '03 Agu - 09 Agu 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_3',
    label: 'Minggu 3 (Senin 10 Agu - Minggu 16 Agu 2026)',
    shortLabel: 'W3 (10-16 Agu)',
    startDate: '2026-08-10',
    endDate: '2026-08-16',
    displayRange: '10 Agu - 16 Agu 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_4',
    label: 'Minggu 4 (Senin 17 Agu - Minggu 23 Agu 2026)',
    shortLabel: 'W4 (17-23 Agu)',
    startDate: '2026-08-17',
    endDate: '2026-08-23',
    displayRange: '17 Agu - 23 Agu 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_5',
    label: 'Minggu 5 (Senin 24 Agu - Minggu 31 Agu 2026)',
    shortLabel: 'W5 (24-31 Agu)',
    startDate: '2026-08-24',
    endDate: '2026-08-31',
    displayRange: '24 Agu - 31 Agu 2026 (Senin - Senin)',
    isCurrentOrLatest: false,
  },
];

// Predefined weekly ranges covering September 2026 data
export const SEPTEMBER_2026_WEEKS: WeekRange[] = [
  {
    id: 'ALL',
    label: 'Semua Periode September (01 - 30 Sep 2026)',
    shortLabel: 'Semua',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    displayRange: '01 Sep - 30 Sep 2026',
    isCurrentOrLatest: true,
  },
  {
    id: 'WEEK_1',
    label: 'Minggu 1 (01 Sep - 06 Sep 2026)',
    shortLabel: 'W1 (01-06 Sep)',
    startDate: '2026-09-01',
    endDate: '2026-09-06',
    displayRange: '01 Sep - 06 Sep 2026 (Selasa - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_2',
    label: 'Minggu 2 (07 Sep - 13 Sep 2026)',
    shortLabel: 'W2 (07-13 Sep)',
    startDate: '2026-09-07',
    endDate: '2026-09-13',
    displayRange: '07 Sep - 13 Sep 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_3',
    label: 'Minggu 3 (14 Sep - 20 Sep 2026)',
    shortLabel: 'W3 (14-20 Sep)',
    startDate: '2026-09-14',
    endDate: '2026-09-20',
    displayRange: '14 Sep - 20 Sep 2026 (Senin - Minggu)',
    isCurrentOrLatest: true,
  },
  {
    id: 'WEEK_4',
    label: 'Minggu 4 (21 Sep - 27 Sep 2026)',
    shortLabel: 'W4 (21-27 Sep)',
    startDate: '2026-09-21',
    endDate: '2026-09-27',
    displayRange: '21 Sep - 27 Sep 2026 (Senin - Minggu)',
    isCurrentOrLatest: false,
  },
  {
    id: 'WEEK_5',
    label: 'Minggu 5 (28 Sep - 30 Sep 2026)',
    shortLabel: 'W5 (28-30 Sep)',
    startDate: '2026-09-28',
    endDate: '2026-09-30',
    displayRange: '28 Sep - 30 Sep 2026 (Senin - Rabu)',
    isCurrentOrLatest: false,
  },
];

export function getWeeksForMonth(monthKey: string): WeekRange[] {
  if (monthKey === '2026-07') return JULY_2026_WEEKS;
  if (monthKey === '2026-09') return SEPTEMBER_2026_WEEKS;
  return AUGUST_2026_WEEKS;
}

const MONTH_MAP: Record<string, string> = {
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'mei': '05', 'jun': '06',
  'jul': '07', 'aug': '08', 'agu': '08', 'agt': '08', 'sep': '09', 'oct': '10', 'okt': '10',
  'nov': '11', 'dec': '12', 'des': '12'
};

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Parses raw date strings like "16-Aug-26, 13:44", "02-Aug-26, 11:19", "31-Jul-26, 10:14", or ISO strings
 * into a standard JS Date object.
 */
export function parseLeadDate(dateStr?: string): Date | null {
  if (!dateStr) return null;

  // Check ISO format
  if (dateStr.includes('T') || (dateStr.length === 10 && dateStr.includes('-') && dateStr.startsWith('202'))) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }

  // Check format like "16-Aug-26, 13:44", "02-Aug-26, 11:19", "31-Jul-26, 10:14"
  const clean = dateStr.trim();
  const match = clean.match(/^(\d{1,2})[-/]([A-Za-z]{3,4})[-/](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{1,2}))?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000; // '26' -> 2026

    const monthNum = parseInt(MONTH_MAP[monthStr] || '08', 10) - 1;
    const hours = match[4] ? parseInt(match[4], 10) : 12;
    const minutes = match[5] ? parseInt(match[5], 10) : 0;

    return new Date(year, monthNum, day, hours, minutes);
  }

  // Numeric date format "DD-MM-YYYY HH:mm" or "DD/MM/YYYY HH:mm"
  const numMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{1,2}))?/);
  if (numMatch) {
    const day = parseInt(numMatch[1], 10);
    const monthNum = parseInt(numMatch[2], 10) - 1;
    let year = parseInt(numMatch[3], 10);
    if (year < 100) year += 2000;

    const hours = numMatch[4] ? parseInt(numMatch[4], 10) : 12;
    const minutes = numMatch[5] ? parseInt(numMatch[5], 10) : 0;

    return new Date(year, monthNum, day, hours, minutes);
  }

  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Formats a Date to Indonesian format e.g. "16 Agu 2026"
 */
export function formatDateIndonesian(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats a Date to Day Name e.g. "Senin"
 */
export function getIndonesianDayName(d: Date): string {
  return DAY_NAMES_ID[d.getDay()];
}

/**
 * Extracts a normalized YYYY-MM-DD string from a Lead object
 */
export function getLeadDateIso(lead: Lead): string {
  const d = parseLeadDate(lead.dateContact || lead.createdAt || lead.answeredAt);
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Filter leads based on selected weekly range or custom date range.
 * Uses robust ISO date comparisons (YYYY-MM-DD) to prevent timezone & time-of-day discrepancies.
 */
export function filterLeadsByWeek(
  leads: Lead[],
  selectedWeekId: string,
  customStartDate?: string,
  customEndDate?: string,
  monthKey?: string
): Lead[] {
  // If explicitly custom range or dates provided
  if (selectedWeekId === 'CUSTOM' && customStartDate && customEndDate) {
    const s = customStartDate <= customEndDate ? customStartDate : customEndDate;
    const e = customStartDate <= customEndDate ? customEndDate : customStartDate;
    return leads.filter((lead) => {
      const leadIso = getLeadDateIso(lead);
      if (!leadIso) return true;
      return leadIso >= s && leadIso <= e;
    });
  }

  // If specific week preset (e.g. 'WEEK_1', 'WEEK_2', 'sep-w1', etc.)
  if (selectedWeekId && selectedWeekId !== 'ALL' && selectedWeekId !== 'CUSTOM') {
    const weeksList = monthKey ? getWeeksForMonth(monthKey) : [...SEPTEMBER_2026_WEEKS, ...AUGUST_2026_WEEKS, ...JULY_2026_WEEKS];
    const matched = weeksList.find((w) => w.id === selectedWeekId);
    if (matched) {
      const s = matched.startDate;
      const e = matched.endDate;
      return leads.filter((lead) => {
        const leadIso = getLeadDateIso(lead);
        if (!leadIso) return true;
        return leadIso >= s && leadIso <= e;
      });
    }
  }

  // If ALL weeks within a specific month
  if (monthKey && monthKey !== 'ALL') {
    return leads.filter((lead) => {
      const leadIso = getLeadDateIso(lead);
      if (!leadIso) return true;
      return leadIso.startsWith(monthKey);
    });
  }

  // Fallback: If custom dates are explicitly provided (not all-time span)
  if (customStartDate && customEndDate && (customStartDate !== '2026-07-01' || customEndDate !== '2026-09-30')) {
    const s = customStartDate <= customEndDate ? customStartDate : customEndDate;
    const e = customStartDate <= customEndDate ? customEndDate : customStartDate;
    return leads.filter((lead) => {
      const leadIso = getLeadDateIso(lead);
      if (!leadIso) return true;
      return leadIso >= s && leadIso <= e;
    });
  }

  // All time: return all leads
  return leads;
}
