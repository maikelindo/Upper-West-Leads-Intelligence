import { VISITED_LEADS_PART1, VisitedLeadRecord } from './visitedLeadsPart1';
import { VISITED_LEADS_PART2 } from './visitedLeadsPart2';

export type { VisitedLeadRecord };

export const ALL_VISITED_LEADS: VisitedLeadRecord[] = [
  ...VISITED_LEADS_PART1,
  ...VISITED_LEADS_PART2
];

// Months list in chronological order
export const VISITED_MONTHS = [
  { key: 'ALL', label: 'Semua Bulan' },
  { key: 'Sept', label: 'September 2026' },
  { key: 'Aug', label: 'Agustus 2026' },
  { key: 'Juli', label: 'Juli 2026' },
  { key: 'Juni', label: 'Juni 2026' },
  { key: 'Mei', label: 'Mei 2026' },
  { key: 'April', label: 'April 2026' },
  { key: 'Maret', label: 'Maret 2026' },
  { key: 'Februari', label: 'Februari 2026' },
  { key: 'Januari', label: 'Januari 2026' },
];

export const STATUS_COLORS = {
  closing: {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    rowBg: 'bg-emerald-50/70 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500',
    dot: 'bg-emerald-500',
    label: 'Closing (Deal)',
    hex: '#10B981',
  },
  reservation: {
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    rowBg: 'bg-cyan-50/70 hover:bg-cyan-100/70 border-l-4 border-l-cyan-400',
    dot: 'bg-cyan-500',
    label: 'Reservasi / Hold',
    hex: '#06B6D4',
  },
  cancelled: {
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    rowBg: 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500',
    dot: 'bg-rose-500',
    label: 'Batal / Cancelled',
    hex: '#F43F5E',
  },
  in_progress: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    rowBg: 'hover:bg-slate-50/80',
    dot: 'bg-slate-400',
    label: 'Visited (Follow Up)',
    hex: '#94A3B8',
  }
};
