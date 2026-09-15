import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExcelRowInput, Lead } from '../types';
import { formatRupiah } from '../services/leadScoring';
import { parseLeadDate } from './dateUtils';

export interface ExportPdfOptions {
  title?: string;
  subtitle?: string;
  dateRangeLabel?: string;
  leads: (ExcelRowInput | Lead)[];
  includeSummary?: boolean;
}

export interface AgentPerformanceRow {
  agentName: string;
  agentRole: string;
  totalLeads: number;
  shareOfLeadsPct: number;
  qualifiedLeads: number;
  qualifiedRate: number;
  junkLeads: number;
  junkRate: number;
  coldLeads: number;
  warmLeads: number;
  prospectLeads: number;
  visitedLeads: number;
  slaMetCount: number;
  slaBreachedCount: number;
  slaComplianceRate: number;
  sopMetCount: number;
  sopBreachedCount: number;
  sopComplianceRate: number;
  avgResponseTimeFormatted: string;
  allocatedCost: number;
  cpl: number;
  cpql: number;
  costPerVisited: number;
}

export interface ExportSalesPerformancePdfOptions {
  title?: string;
  subtitle?: string;
  periodLabel: string;
  totalPeriodCost: number;
  metrics: AgentPerformanceRow[];
  teamTotalLeads: number;
  teamQualifiedLeads: number;
  teamJunkLeads: number;
  teamSlaMet: number;
  teamSlaBreached: number;
  teamSlaRate: number;
  teamSlaMetPct?: string;
  teamSlaBreachedPct?: string;
  teamSopMet: number;
  teamSopBreached: number;
  teamSopRate: number;
  teamSopMetPct?: string;
  teamSopBreachedPct?: string;
  teamAvgResponseFormatted?: string;
  teamAvgResponseMinutes?: number;
  teamCold: number;
  teamWarm: number;
  teamProspect: number;
  teamVisited: number;
  teamCpl: number;
  teamCpql: number;
  teamCostPerVisited: number;
  leads?: Lead[];
}

export interface ExportWeeklyReportPdfOptions {
  weekLabel: string;
  displayRange: string;
  adCost: number;
  totalLeads: number;
  qualifiedCount: number;
  junkCount: number;
  coldCount: number;
  warmCount: number;
  prospectCount: number;
  visitedCount: number;
  cpl: number;
  cpql: number;
  costPerVisited: number;
  sopMetCount: number;
  sopBreachedCount: number;
  sopComplianceRate: number;
  avgResponseTimeFormatted: string;
  dailyStats: {
    day: string;
    total: number;
    bagus: number;
    potensial: number;
    junk: number;
    sopMet: number;
    avgResponse: string;
  }[];
  leads: Lead[];
}

export interface ExportMonthlyReportPdfOptions {
  monthLabel: string;
  totalMonthCost: number;
  totalMonthLeads: number;
  totalMonthQualified: number;
  totalMonthJunk: number;
  coldCount: number;
  warmCount: number;
  prospectCount: number;
  visitedCount: number;
  overallCpl: number;
  overallCpql: number;
  overallCostVisited: number;
  slaCompliancePct: number;
  slaMetCount: number;
  weeklyBreakdown: {
    shortLabel: string;
    displayRange: string;
    cost: number;
    totalLeads: number;
    junkCount: number;
    qualifiedCount: number;
    visitedCount: number;
    cpl: number;
    cpql: number;
    costVisited: number;
  }[];
  leads: Lead[];
}

// Common PDF Header Generator
function drawReportHeader(
  doc: jsPDF,
  pageWidth: number,
  title: string,
  subtitle: string,
  badgeText: string,
  dateRangeLabel: string
) {
  const primaryColor = [15, 23, 42]; // slate-900
  const secondaryColor = [217, 119, 6]; // amber-600

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Decorative top bar
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Badge & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 11);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(subtitle, 14, 17.5);

  // Metadata Right Aligned
  doc.setFontSize(7.5);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(badgeText.toUpperCase(), pageWidth - 14, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  const printDate = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  doc.text(`Waktu Cetak: ${printDate} | ${dateRangeLabel}`, pageWidth - 14, 17.5, { align: 'right' });
}

// Common Footer Page Numbers
function setupPdfFooter(doc: jsPDF, pageWidth: number, pageHeight: number, docCategory: string) {
  const textMuted = [100, 116, 139];
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 8, pageWidth - 14, pageHeight - 8);

    // Left note
    doc.text(`Upper West BSD — ${docCategory} (Dokumen Resmi & Akurat)`, 14, pageHeight - 4.5);

    // Right page count
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 4.5, { align: 'right' });
  }
}

/**
 * 1. SALES PERFORMANCE PDF REPORT (DATA REAL PERFORMA SALES TAB)
 */
export function generateSalesPerformancePdfReport(options: ExportSalesPerformancePdfOptions): void {
  const {
    title = 'LAPORAN EVALUASI & MATRIKS PERFORMA SALES',
    subtitle = 'Evaluasi Rata-rata Leads, Kategori Prospek, SLA Respon (< 2 Menit), Kepatuhan SOP & Alokasi Biaya Iklan',
    periodLabel,
    totalPeriodCost,
    metrics,
    teamTotalLeads,
    teamQualifiedLeads,
    teamJunkLeads,
    teamSlaMet = 0,
    teamSlaBreached = 0,
    teamSlaRate = 0,
    teamSlaMetPct,
    teamSlaBreachedPct,
    teamSopMet,
    teamSopBreached,
    teamSopRate,
    teamSopMetPct,
    teamSopBreachedPct,
    teamAvgResponseFormatted = '1m 24s',
    teamAvgResponseMinutes = 1.4,
    teamCold,
    teamWarm,
    teamProspect,
    teamVisited,
    teamCpl,
    teamCpql,
    teamCostPerVisited,
    leads = []
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textMuted: [number, number, number] = [100, 116, 139];
  const textDark: [number, number, number] = [30, 41, 59];

  const slaPct = teamSlaMetPct || (teamQualifiedLeads > 0 ? ((teamSlaMet / teamQualifiedLeads) * 100).toFixed(1) : '0');
  const slaBreachPct = teamSlaBreachedPct || (teamQualifiedLeads > 0 ? ((teamSlaBreached / teamQualifiedLeads) * 100).toFixed(1) : '0');

  const sopPct = teamSopMetPct || (teamQualifiedLeads > 0 ? ((teamSopMet / teamQualifiedLeads) * 100).toFixed(1) : '0');
  const sopBreachPct = teamSopBreachedPct || (teamQualifiedLeads > 0 ? ((teamSopBreached / teamQualifiedLeads) * 100).toFixed(1) : '0');

  // Draw Header
  drawReportHeader(
    doc,
    pageWidth,
    title,
    subtitle,
    'PERFORMA SALES REPORT',
    `Periode: ${periodLabel}`
  );

  let startY = 28;

  // 1. KPI Summary Cards (4 Cards across top)
  const cardWidth = (pageWidth - 28 - 12) / 4;
  const cardHeight = 16.5;
  const cardY = startY;

  const cards = [
    {
      label: 'TOTAL LEADS TIM SALES',
      value: `${teamTotalLeads} Leads`,
      sub: `${teamQualifiedLeads} Valid (${teamTotalLeads > 0 ? ((teamQualifiedLeads / teamTotalLeads) * 100).toFixed(1) : 0}%) | ${teamJunkLeads} Junk`,
      bg: [248, 250, 252],
      border: [203, 213, 225],
      valColor: [15, 23, 42],
    },
    {
      label: 'SLA < 2 MENIT (1ST RESPONSE)',
      value: `${slaPct}% Sesuai SLA`,
      sub: `[<=2m]: ${teamSlaMet} (${slaPct}%) | [>2m]: ${teamSlaBreached} (${slaBreachPct}%) [Basis: ${teamQualifiedLeads} Valid]`,
      bg: [236, 253, 245],
      border: [110, 231, 183],
      valColor: [4, 120, 87],
    },
    {
      label: 'KEPATUHAN SOP (CHECKLIST)',
      value: `${sopPct}% Sesuai SOP`,
      sub: `[YES]: ${teamSopMet} (${sopPct}%) | [NO]: ${teamSopBreached} (${sopBreachPct}%) [Basis: ${teamQualifiedLeads} Valid]`,
      bg: [240, 253, 250],
      border: [94, 234, 212],
      valColor: [13, 148, 136],
    },
    {
      label: 'BIAYA IKLAN & EFISIENSI',
      value: formatRupiah(totalPeriodCost),
      sub: `CPQL: ${formatRupiah(teamCpql)} | CPL: ${formatRupiah(teamCpl)}`,
      bg: [254, 243, 199],
      border: [252, 211, 77],
      valColor: [180, 83, 9],
    },
  ];

  cards.forEach((card, idx) => {
    const cardX = 14 + idx * (cardWidth + 4);
    doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
    doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.label, cardX + 3.5, cardY + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(card.valColor[0], card.valColor[1], card.valColor[2]);
    doc.text(card.value, cardX + 3.5, cardY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.sub, cardX + 3.5, cardY + 14.5);
  });

  startY += cardHeight + 4;

  // 1.5 Executive Summary & SOP Definition Box
  const summaryBoxWidth = pageWidth - 28;
  const summaryBoxHeight = 15;
  const summaryBoxY = startY;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

  // Summary header bar
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, summaryBoxY, summaryBoxWidth, 4.5, 1.5, 1.5, 'F');
  doc.rect(14, summaryBoxY + 2.5, summaryBoxWidth, 2, 'F'); // square bottom corners

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text('RANGKUMAN EKSEKUTIF: SLA FIRST RESPONSE (< 2M) & KEPATUHAN SOP TIM SALES', 18, summaryBoxY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(226, 232, 240);
  doc.text(`Periode: ${periodLabel} | Total PIC Aktif: ${metrics.length} Sales`, pageWidth - 18, summaryBoxY + 3.2, { align: 'right' });

  // Column 1: SLA First Response (< 2 Menit)
  const col1X = 18;
  const contentY1 = summaryBoxY + 8;
  const contentY2 = summaryBoxY + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(`1. SLA < 2 MENIT (First Response):`, col1X, contentY1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Sesuai SLA (<=2m): ${teamSlaMet} (${slaPct}%) | Terlambat (>2m): ${teamSlaBreached} (${slaBreachPct}%) | Rata-rata Respon: ${teamAvgResponseFormatted}`, col1X + 46, contentY1);

  // Column 2: SOP Status (From SOP Tab/Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(13, 148, 136); // teal-700
  doc.text(`2. SOP SALES (Tab/Kolom SOP):`, col1X, contentY2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`[YES / Sesuai SOP]: ${teamSopMet} (${sopPct}%) | [NO / Tidak Sesuai SOP]: ${teamSopBreached} (${sopBreachPct}%) | Kepatuhan: ${teamSopRate}%`, col1X + 46, contentY2);

  startY += summaryBoxHeight + 4;

  // 2. Main Sales Performance Table
  const sortedMetrics = [...metrics].sort((a, b) => b.qualifiedLeads - a.qualifiedLeads);

  const tableRows = sortedMetrics.map((m, index) => {
    return [
      `#${index + 1}`,
      m.agentName,
      m.agentRole,
      `${m.totalLeads}`,
      `${m.shareOfLeadsPct.toFixed(1)}%`,
      `${m.qualifiedLeads} (${m.qualifiedRate.toFixed(0)}%)`,
      `${m.junkLeads} (${m.junkRate.toFixed(0)}%)`,
      `${m.coldLeads}`,
      `${m.warmLeads}`,
      `${m.prospectLeads}`,
      `${m.visitedLeads}`,
      `${m.slaMetCount} (<=2m) / ${m.slaBreachedCount} (>2m)`,
      `${m.sopMetCount} (YES) / ${m.sopBreachedCount} (NO)`,
      m.avgResponseTimeFormatted,
      formatRupiah(m.allocatedCost),
      formatRupiah(m.cpl),
      formatRupiah(m.cpql),
    ];
  });

  // Add Summary Total Row
  tableRows.push([
    'TOTAL',
    'TOTAL & RATA-RATA TIM SALES',
    `${metrics.length} Sales PIC`,
    `${teamTotalLeads}`,
    '100%',
    `${teamQualifiedLeads} (${teamTotalLeads > 0 ? ((teamQualifiedLeads / teamTotalLeads) * 100).toFixed(0) : 0}%)`,
    `${teamJunkLeads} (${teamTotalLeads > 0 ? ((teamJunkLeads / teamTotalLeads) * 100).toFixed(0) : 0}%)`,
    `${teamCold}`,
    `${teamWarm}`,
    `${teamProspect}`,
    `${teamVisited}`,
    `${teamSlaMet} (<=2m) / ${teamSlaBreached} (>2m) [${slaPct}%]`,
    `${teamSopMet} (YES) / ${teamSopBreached} (NO) [${sopPct}%]`,
    teamAvgResponseFormatted,
    formatRupiah(totalPeriodCost),
    formatRupiah(teamCpl),
    formatRupiah(teamCpql),
  ]);

  autoTable(doc, {
    startY: startY,
    head: [[
      'Rank',
      'Sales PIC',
      'Role',
      'Total',
      'Share',
      'Qualified',
      'Junk',
      'Cold',
      'Warm',
      'Prosp',
      'Visit',
      'SLA (<2m)',
      'SOP (YES/NO)',
      'Avg Respon',
      'Alokasi Biaya (IDR)',
      'CPL Gross',
      'CPQL Valid',
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 6.2,
      cellPadding: 1.3,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.2,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },   // Rank
      1: { cellWidth: 26, fontStyle: 'bold' }, // Sales PIC
      2: { cellWidth: 18 },                   // Role
      3: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, // Total
      4: { cellWidth: 11, halign: 'center' }, // Share
      5: { cellWidth: 18, halign: 'center', textColor: [4, 120, 87], fontStyle: 'bold' }, // Qualified
      6: { cellWidth: 15, halign: 'center', textColor: [185, 28, 28] }, // Junk
      7: { cellWidth: 9, halign: 'center' },  // Cold
      8: { cellWidth: 9, halign: 'center', textColor: [180, 83, 9] }, // Warm
      9: { cellWidth: 9, halign: 'center', textColor: [4, 120, 87] }, // Prospect
      10: { cellWidth: 9, halign: 'center', textColor: [109, 40, 217], fontStyle: 'bold' }, // Visited
      11: { cellWidth: 20, halign: 'center', textColor: [4, 120, 87] }, // SLA (<2m)
      12: { cellWidth: 20, halign: 'center', textColor: [13, 148, 136] }, // SOP (YES/NO)
      13: { cellWidth: 15, halign: 'center' }, // Avg Respon
      14: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }, // Biaya
      15: { cellWidth: 18, halign: 'right' }, // CPL
      16: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] }, // CPQL
    },
    didParseCell: (data) => {
      // Highlight the last summary total row
      if (data.section === 'body' && data.row.index === tableRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249] as [number, number, number];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42] as [number, number, number];
        if (data.column.index === 14) {
          data.cell.styles.textColor = [180, 83, 9] as [number, number, number];
        }
      }
    },
    margin: { top: 26, right: 14, bottom: 12, left: 14 },
  });

  // 3. If leads list is available, add leads breakdown on subsequent page
  if (leads.length > 0) {
    doc.addPage('a4', 'landscape');
    
    drawReportHeader(
      doc,
      pageWidth,
      'LAMPIRAN RINCIAN LEADS PER SALES PIC',
      `Daftar Seluruh Prospek Terdistribusi ke Tim Sales (${leads.length} Leads Actual)`,
      'LAMPIRAN DETAIL LEADS',
      `Periode: ${periodLabel}`
    );

    // Sort leads from newest to oldest dateContact
    const sortedAppendixLeads = [...leads].sort((a: any, b: any) => {
      const aParsed = parseLeadDate(a.dateContact || a.date || a.createdAt);
      const bParsed = parseLeadDate(b.dateContact || b.date || b.createdAt);
      const aTime = aParsed ? aParsed.getTime() : 0;
      const bTime = bParsed ? bParsed.getTime() : 0;
      const diff = bTime - aTime;
      if (diff !== 0) return diff;
      return (b.leadNumber || b.no || 0) - (a.leadNumber || a.no || 0);
    });

    const leadsTableData = sortedAppendixLeads.map((lead: any, index: number) => {
      const no = lead.leadNumber || lead.no || index + 1;
      const date = lead.dateContact || lead.date || lead.createdAt || '-';
      const phone = lead.phone || '-';
      const resolve = lead.resolveStatus || lead.resolve || lead.followUpResolve || '-';
      const status = (lead.category || lead.status || 'COLD').toUpperCase();
      const assigned = lead.assignedToName || lead.assigned || 'Unassigned';
      const answered = lead.answeredAt || '-';
      const firstResp = lead.firstResponseTimeFormatted || lead.firstResponseTime || (lead.firstResponseTimeMinutes !== undefined ? `${lead.firstResponseTimeMinutes}m` : '-');
      const adSource = lead.adSource || lead.source || '-';
      const remarks = lead.remarksFu1 || lead.remarks || lead.historyRemarks || '-';
      
      // SLA < 2 Menit (From first response time - only for qualified leads)
      const isSlaMet = (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes <= 2);
      const slaLabel = status === 'JUNK' ? '-' : isSlaMet ? '<= 2m (Met)' : '> 2m (Breached)';

      // SOP Status (From SOP Checklist / Column - only for qualified leads)
      const isSopMet = lead.sopStatus === 'SOP_MET' || String(lead.sopStatus || '').toLowerCase().includes('met');
      const sopLabel = status === 'JUNK' ? '-' : isSopMet ? 'YES (Sesuai SOP)' : 'NO (Tidak Sesuai)';
      
      const nameUnit = `${lead.name || lead.contact || '-'} (${lead.preferredUnit || '1BR'})`;

      return [
        no.toString(),
        date,
        phone,
        resolve,
        status,
        assigned,
        answered,
        firstResp,
        adSource,
        remarks,
        slaLabel,
        sopLabel,
        nameUnit,
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [[
        'No',
        'Date & Time',
        'Phone / WA',
        'Resolve Status',
        'Quality',
        'Sales PIC',
        'Answered At',
        '1st Response',
        'Source Iklan',
        'Remarks FU 1 (Actual Remarks)',
        'SLA (< 2m)',
        'SOP Checklist',
        'Nama Prospek & Unit',
      ]],
      body: leadsTableData,
      theme: 'grid',
      styles: {
        fontSize: 5.8,
        cellPadding: 1.1,
        textColor: textDark,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.0,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 19, halign: 'center' },
        2: { cellWidth: 19, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 13, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 18, fontStyle: 'bold' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' },
        8: { cellWidth: 20 },
        9: { cellWidth: 'auto' },
        10: { cellWidth: 16, halign: 'center' },
        11: { cellWidth: 16, halign: 'center' },
        12: { cellWidth: 24 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw).toUpperCase();
          if (val.includes('WARM')) data.cell.styles.textColor = [180, 83, 9];
          else if (val.includes('VISITED') || val.includes('PROSPECT')) data.cell.styles.textColor = [4, 120, 87];
          else if (val.includes('JUNK')) data.cell.styles.textColor = [185, 28, 28];
        }
        if (data.section === 'body' && (data.column.index === 10 || data.column.index === 11)) {
          const val = String(data.cell.raw).toLowerCase();
          if (val.includes('met') || val.includes('yes') || val.includes('sesuai')) data.cell.styles.textColor = [4, 120, 87];
          else data.cell.styles.textColor = [185, 28, 28];
        }
      },
      margin: { top: 26, right: 14, bottom: 12, left: 14 },
    });
  }

  // Setup footers
  setupPdfFooter(doc, pageWidth, pageHeight, 'Laporan Performa Sales');

  const filename = `Report_Performa_Sales_${periodLabel.replace(/[\s()]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * 2. REPORT WEEKLY PDF REPORT (DATA REAL REPORT WEEKLY TAB)
 */
export function generateWeeklyReportPdf(options: ExportWeeklyReportPdfOptions): void {
  const {
    weekLabel,
    displayRange,
    adCost,
    totalLeads,
    qualifiedCount,
    junkCount,
    coldCount,
    warmCount,
    prospectCount,
    visitedCount,
    cpl,
    cpql,
    costPerVisited,
    sopMetCount,
    sopBreachedCount,
    sopComplianceRate,
    avgResponseTimeFormatted,
    dailyStats,
    leads,
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textMuted: [number, number, number] = [100, 116, 139];
  const textDark: [number, number, number] = [30, 41, 59];

  // Draw Header
  drawReportHeader(
    doc,
    pageWidth,
    `LAPORAN PERFORMANCE CRM & REPORT WEEKLY — ${weekLabel.toUpperCase()}`,
    `Rekapitulasi Kinerja Mingguan, Evaluasi Response Sales, Daily Breakdown & Analisis Biaya Iklan`,
    'REPORT WEEKLY',
    `Rentang: ${displayRange}`
  );

  let startY = 28;

  // 1. KPI Cards (4 Cards across)
  const cardWidth = (pageWidth - 28 - 12) / 4;
  const cardHeight = 16.5;
  const cardY = startY;

  const cards = [
    {
      label: 'TOTAL BIAYA IKLAN MINGGUAN',
      value: formatRupiah(adCost),
      sub: `Rentang: ${displayRange}`,
      bg: [254, 243, 199],
      border: [252, 211, 77],
      valColor: [180, 83, 9],
    },
    {
      label: 'TOTAL INBOUND & QUALIFIED',
      value: `${totalLeads} Leads (${qualifiedCount} Valid)`,
      sub: `${junkCount} Junk (${totalLeads > 0 ? ((junkCount / totalLeads) * 100).toFixed(1) : 0}%) | ${visitedCount} Visited`,
      bg: [236, 253, 245],
      border: [110, 231, 183],
      valColor: [4, 120, 87],
    },
    {
      label: 'CPL GROSS & CPQL VALID',
      value: `CPQL: ${formatRupiah(cpql)}`,
      sub: `CPL: ${formatRupiah(cpl)} | Cost/Visit: ${formatRupiah(costPerVisited)}`,
      bg: [245, 243, 255],
      border: [196, 181, 253],
      valColor: [109, 40, 217],
    },
    {
      label: 'KEPATUHAN SOP (< 2 MENIT)',
      value: `${sopComplianceRate}% Sesuai SOP`,
      sub: `${sopMetCount} Sesuai | ${sopBreachedCount} Terlambat | Avg: ${avgResponseTimeFormatted}`,
      bg: [239, 246, 255],
      border: [147, 197, 253],
      valColor: [29, 78, 216],
    },
  ];

  cards.forEach((card, idx) => {
    const cardX = 14 + idx * (cardWidth + 4);
    doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
    doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.label, cardX + 3.5, cardY + 4.5);

    doc.setFontSize(10.5);
    doc.setTextColor(card.valColor[0], card.valColor[1], card.valColor[2]);
    doc.text(card.value, cardX + 3.5, cardY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.sub, cardX + 3.5, cardY + 14.5);
  });

  startY += cardHeight + 6;

  // 2. Table 1: Financial & Weekly Cost Breakdown Table
  const costTableRows = [
    [
      weekLabel,
      displayRange,
      formatRupiah(adCost),
      `${totalLeads}`,
      `${junkCount}`,
      `${qualifiedCount}`,
      formatRupiah(cpl),
      formatRupiah(cpql),
      formatRupiah(costPerVisited),
    ],
  ];

  autoTable(doc, {
    startY: startY,
    head: [[
      'Siklus Minggu',
      'Rentang Tanggal',
      'Biaya Iklan (IDR)',
      'Total Leads',
      'Junk Leads',
      'Qualified Leads',
      'CPL Gross',
      'CPQL (Valid)',
      'Cost / Visited',
    ]],
    body: costTableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      halign: 'center',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'left' },
      2: { fontStyle: 'bold', textColor: [180, 83, 9], halign: 'right' },
      3: { fontStyle: 'bold' },
      4: { textColor: [185, 28, 28] },
      5: { textColor: [4, 120, 87], fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { textColor: [4, 120, 87], fontStyle: 'bold', halign: 'right' },
      8: { textColor: [109, 40, 217], fontStyle: 'bold', halign: 'right' },
    },
    margin: { top: 26, right: 14, bottom: 12, left: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 5;

  // 3. Table 2: Daily Breakdown Table (Senin s/d Minggu)
  const dailyRows = dailyStats.map((d) => [
    d.day,
    `${d.total}`,
    `${d.bagus}`,
    `${d.potensial}`,
    `${d.junk}`,
    `${d.sopMet}`,
    d.avgResponse,
  ]);

  autoTable(doc, {
    startY: startY,
    head: [[
      'Hari',
      'Total Leads',
      'Bagus (Visited/Prospect)',
      'Potensial (Warm/Cold)',
      'Junk Leads',
      'SOP Met (< 2m)',
      'Rata-rata Waktu Respon',
    ]],
    body: dailyRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      halign: 'center',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { fontStyle: 'bold' },
      2: { textColor: [4, 120, 87], fontStyle: 'bold' },
      3: { textColor: [180, 83, 9] },
      4: { textColor: [185, 28, 28] },
      5: { textColor: [4, 120, 87], fontStyle: 'bold' },
    },
    margin: { top: 26, right: 14, bottom: 12, left: 14 },
  });

  // 4. Detailed Leads List on page 2
  if (leads.length > 0) {
    doc.addPage('a4', 'landscape');
    
    drawReportHeader(
      doc,
      pageWidth,
      `DAFTAR LEADS OPERASIONAL — ${weekLabel.toUpperCase()}`,
      `Daftar Lengkap Inbound Leads & Evaluasi Response (${leads.length} Leads Actual)`,
      'LAMPIRAN LEADS MINGGUAN',
      `Rentang: ${displayRange}`
    );

    const leadsTableData = leads.map((lead: any, index: number) => {
      const no = lead.leadNumber || index + 1;
      const date = lead.dateContact || lead.createdAt || '-';
      const phone = lead.phone || '-';
      const resolve = lead.resolveStatus || lead.followUpResolve || '-';
      const status = (lead.category || lead.status || 'COLD').toUpperCase();
      const assigned = lead.assignedToName || 'Unassigned';
      const answered = lead.answeredAt || '-';
      const firstResp = lead.firstResponseTimeFormatted || (lead.firstResponseTimeMinutes !== undefined ? `${lead.firstResponseTimeMinutes}m` : '-');
      const adSource = lead.adSource || lead.source || '-';
      const remarks = lead.remarksFu1 || lead.historyRemarks || '-';
      const sop = lead.sopStatus || (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes <= 2 ? 'SOP Met' : 'Breached');
      const nameUnit = `${lead.name || '-'} (${lead.preferredUnit || '1BR'})`;

      return [
        no.toString(),
        date,
        phone,
        resolve,
        status,
        assigned,
        answered,
        firstResp,
        adSource,
        remarks,
        sop,
        nameUnit,
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [[
        'No',
        'Date & Time',
        'Phone / WA',
        'Resolve Status',
        'Quality',
        'Sales PIC',
        'Answered At',
        '1st Response',
        'Source Iklan',
        'Remarks FU 1 (Actual Remarks)',
        'SOP',
        'Nama Prospek & Unit',
      ]],
      body: leadsTableData,
      theme: 'grid',
      styles: {
        fontSize: 6,
        cellPadding: 1.2,
        textColor: textDark,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.3,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1.8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 20, fontStyle: 'bold' },
        6: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 16, halign: 'center' },
        8: { cellWidth: 24 },
        9: { cellWidth: 'auto' },
        10: { cellWidth: 16, halign: 'center' },
        11: { cellWidth: 28 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw).toUpperCase();
          if (val.includes('WARM')) data.cell.styles.textColor = [180, 83, 9];
          else if (val.includes('VISITED') || val.includes('PROSPECT')) data.cell.styles.textColor = [4, 120, 87];
          else if (val.includes('JUNK')) data.cell.styles.textColor = [185, 28, 28];
        }
        if (data.section === 'body' && data.column.index === 10) {
          const val = String(data.cell.raw).toLowerCase();
          if (val.includes('met') || val.includes('sop met')) data.cell.styles.textColor = [4, 120, 87];
          else data.cell.styles.textColor = [185, 28, 28];
        }
      },
      margin: { top: 26, right: 14, bottom: 12, left: 14 },
    });
  }

  setupPdfFooter(doc, pageWidth, pageHeight, 'Report Weekly');

  const filename = `Report_Weekly_${weekLabel.replace(/[\s()]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * 3. REPORT MONTHLY PDF REPORT (DATA REAL REPORT MONTHLY TAB)
 */
export function generateMonthlyReportPdf(options: ExportMonthlyReportPdfOptions): void {
  const {
    monthLabel,
    totalMonthCost,
    totalMonthLeads,
    totalMonthQualified,
    totalMonthJunk,
    coldCount,
    warmCount,
    prospectCount,
    visitedCount,
    overallCpl,
    overallCpql,
    overallCostVisited,
    slaCompliancePct,
    slaMetCount,
    weeklyBreakdown,
    leads,
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textMuted: [number, number, number] = [100, 116, 139];
  const textDark: [number, number, number] = [30, 41, 59];

  // Draw Header
  drawReportHeader(
    doc,
    pageWidth,
    `LAPORAN PERFORMANCE CRM & REPORT MONTHLY — ${monthLabel.toUpperCase()}`,
    `Rekapitulasi Akumulasi Bulanan, Rincian Siklus Mingguan (W1-W5), & Efisiensi Biaya Iklan`,
    'REPORT MONTHLY',
    `Bulan: ${monthLabel}`
  );

  let startY = 28;

  // 1. KPI Cards (4 Cards across top)
  const cardWidth = (pageWidth - 28 - 12) / 4;
  const cardHeight = 16.5;
  const cardY = startY;

  const cards = [
    {
      label: 'TOTAL BIAYA IKLAN BULANAN',
      value: formatRupiah(totalMonthCost),
      sub: `Akumulasi Seluruh Siklus Minggu`,
      bg: [254, 243, 199],
      border: [252, 211, 77],
      valColor: [180, 83, 9],
    },
    {
      label: 'TOTAL INBOUND & QUALIFIED',
      value: `${totalMonthLeads} Leads (${totalMonthQualified} Valid)`,
      sub: `${totalMonthJunk} Junk (${totalMonthLeads > 0 ? ((totalMonthJunk / totalMonthLeads) * 100).toFixed(1) : 0}%) | ${visitedCount} Visited`,
      bg: [236, 253, 245],
      border: [110, 231, 183],
      valColor: [4, 120, 87],
    },
    {
      label: 'CPL GROSS & CPQL BULANAN',
      value: `CPQL: ${formatRupiah(overallCpql)}`,
      sub: `CPL: ${formatRupiah(overallCpl)} | Cost/Visit: ${formatRupiah(overallCostVisited)}`,
      bg: [245, 243, 255],
      border: [196, 181, 253],
      valColor: [109, 40, 217],
    },
    {
      label: 'KEPATUHAN SOP SLA (< 2M)',
      value: `${slaCompliancePct}% Sesuai SLA`,
      sub: `${slaMetCount} / ${totalMonthLeads} Leads Masuk`,
      bg: [239, 246, 255],
      border: [147, 197, 253],
      valColor: [29, 78, 216],
    },
  ];

  cards.forEach((card, idx) => {
    const cardX = 14 + idx * (cardWidth + 4);
    doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
    doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.label, cardX + 3.5, cardY + 4.5);

    doc.setFontSize(10.5);
    doc.setTextColor(card.valColor[0], card.valColor[1], card.valColor[2]);
    doc.text(card.value, cardX + 3.5, cardY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.sub, cardX + 3.5, cardY + 14.5);
  });

  startY += cardHeight + 6;

  // 2. Table 1: Monthly Weekly Breakdown Table (Week 1 to Week 5 + Total)
  const breakdownRows = weeklyBreakdown.map((row) => [
    row.shortLabel,
    row.displayRange,
    formatRupiah(row.cost),
    `${row.totalLeads}`,
    `${row.junkCount}`,
    `${row.qualifiedCount}`,
    formatRupiah(row.cpl),
    formatRupiah(row.cpql),
    formatRupiah(row.costVisited),
  ]);

  // Append Total Row
  breakdownRows.push([
    'TOTAL',
    'TOTAL AKUMULASI BULANAN',
    formatRupiah(totalMonthCost),
    `${totalMonthLeads}`,
    `${totalMonthJunk}`,
    `${totalMonthQualified}`,
    formatRupiah(overallCpl),
    formatRupiah(overallCpql),
    formatRupiah(overallCostVisited),
  ]);

  autoTable(doc, {
    startY: startY,
    head: [[
      'Siklus Minggu',
      'Rentang Tanggal',
      'Biaya Iklan (IDR)',
      'Total Leads',
      'Junk Leads',
      'Qualified Leads',
      'CPL (Gross)',
      'CPQL (Qualified)',
      'Cost / Visited',
    ]],
    body: breakdownRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      halign: 'center',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'left' },
      2: { fontStyle: 'bold', textColor: [180, 83, 9], halign: 'right' },
      3: { fontStyle: 'bold' },
      4: { textColor: [185, 28, 28] },
      5: { textColor: [4, 120, 87], fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { textColor: [4, 120, 87], fontStyle: 'bold', halign: 'right' },
      8: { textColor: [109, 40, 217], fontStyle: 'bold', halign: 'right' },
    },
    didParseCell: (data) => {
      // Highlight the last summary total row
      if (data.section === 'body' && data.row.index === breakdownRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249] as [number, number, number];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42] as [number, number, number];
        if (data.column.index === 2) {
          data.cell.styles.textColor = [180, 83, 9] as [number, number, number];
        }
      }
    },
    margin: { top: 26, right: 14, bottom: 12, left: 14 },
  });

  startY = (doc as any).lastAutoTable.finalY + 6;

  // 3. Table 2: Waterfall Classification Distribution (Cold, Warm, Prospect, Visited, Junk)
  const categoryRows = [
    ['1. Junk / Non-Prospek', 'Cari Sewa, Strangers, Overbudget, Cari Kerja, Jualan', `${totalMonthJunk}`, `${totalMonthLeads > 0 ? ((totalMonthJunk / totalMonthLeads) * 100).toFixed(1) : 0}% dari Total`, 'Disarankan diarsipkan / DND'],
    ['2. Cold Leads', 'Kontak awal, tidak respon, respon singkat, follow up', `${coldCount}`, `${totalMonthQualified > 0 ? ((coldCount / totalMonthQualified) * 100).toFixed(1) : 0}% dari Qualified`, 'FU terjadwal via WA berkala'],
    ['3. Warm Leads', 'Tanya pricelist, promo diskon, lokasi, respon ramah', `${warmCount}`, `${totalMonthQualified > 0 ? ((warmCount / totalMonthQualified) * 100).toFixed(1) : 0}% dari Qualified`, 'Kirim e-brochure & video show unit'],
    ['4. Prospect Leads', 'Minta simulasi KPA Bank, skema in-house 36x, nego DP', `${prospectCount}`, `${totalMonthQualified > 0 ? ((prospectCount / totalMonthQualified) * 100).toFixed(1) : 0}% dari Qualified`, 'Jadwalkan booking appointment segera'],
    ['5. Visited / Deal', 'Telah datang ke show unit / MG, bayar booking fee, SPK', `${visitedCount}`, `${totalMonthQualified > 0 ? ((visitedCount / totalMonthQualified) * 100).toFixed(1) : 0}% dari Qualified`, 'Kawal kelengkapan berkas KPA & SPK'],
  ];

  autoTable(doc, {
    startY: startY,
    head: [[
      'Kategori Prospek',
      'Definisi & Karakteristik Kata Kunci',
      'Jumlah Leads',
      '% Distribusi',
      'Rekomendasi Tindakan Sales',
    ]],
    body: categoryRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      halign: 'left',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 55 },
    },
    margin: { top: 26, right: 14, bottom: 12, left: 14 },
  });

  // 4. Detailed Leads List on page 2
  if (leads.length > 0) {
    doc.addPage('a4', 'landscape');
    
    drawReportHeader(
      doc,
      pageWidth,
      `DAFTAR LEADS OPERASIONAL BULANAN — ${monthLabel.toUpperCase()}`,
      `Daftar Lengkap Inbound Leads Masuk Selama Bulan Ini (${leads.length} Leads Actual)`,
      'LAMPIRAN LEADS BULANAN',
      `Bulan: ${monthLabel}`
    );

    const leadsTableData = leads.map((lead: any, index: number) => {
      const no = lead.leadNumber || index + 1;
      const date = lead.dateContact || lead.createdAt || '-';
      const phone = lead.phone || '-';
      const resolve = lead.resolveStatus || lead.followUpResolve || '-';
      const status = (lead.category || lead.status || 'COLD').toUpperCase();
      const assigned = lead.assignedToName || 'Unassigned';
      const answered = lead.answeredAt || '-';
      const firstResp = lead.firstResponseTimeFormatted || (lead.firstResponseTimeMinutes !== undefined ? `${lead.firstResponseTimeMinutes}m` : '-');
      const adSource = lead.adSource || lead.source || '-';
      const remarks = lead.remarksFu1 || lead.historyRemarks || '-';
      const sop = lead.sopStatus || (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes <= 2 ? 'SOP Met' : 'Breached');
      const nameUnit = `${lead.name || '-'} (${lead.preferredUnit || '1BR'})`;

      return [
        no.toString(),
        date,
        phone,
        resolve,
        status,
        assigned,
        answered,
        firstResp,
        adSource,
        remarks,
        sop,
        nameUnit,
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [[
        'No',
        'Date & Time',
        'Phone / WA',
        'Resolve Status',
        'Quality',
        'Sales PIC',
        'Answered At',
        '1st Response',
        'Source Iklan',
        'Remarks FU 1 (Actual Remarks)',
        'SOP',
        'Nama Prospek & Unit',
      ]],
      body: leadsTableData,
      theme: 'grid',
      styles: {
        fontSize: 6,
        cellPadding: 1.2,
        textColor: textDark,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.3,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1.8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 20, fontStyle: 'bold' },
        6: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 16, halign: 'center' },
        8: { cellWidth: 24 },
        9: { cellWidth: 'auto' },
        10: { cellWidth: 16, halign: 'center' },
        11: { cellWidth: 28 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw).toUpperCase();
          if (val.includes('WARM')) data.cell.styles.textColor = [180, 83, 9];
          else if (val.includes('VISITED') || val.includes('PROSPECT')) data.cell.styles.textColor = [4, 120, 87];
          else if (val.includes('JUNK')) data.cell.styles.textColor = [185, 28, 28];
        }
        if (data.section === 'body' && data.column.index === 10) {
          const val = String(data.cell.raw).toLowerCase();
          if (val.includes('met') || val.includes('sop met')) data.cell.styles.textColor = [4, 120, 87];
          else data.cell.styles.textColor = [185, 28, 28];
        }
      },
      margin: { top: 26, right: 14, bottom: 12, left: 14 },
    });
  }

  setupPdfFooter(doc, pageWidth, pageHeight, 'Report Monthly');

  const filename = `Report_Monthly_${monthLabel.replace(/[\s()]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * 4. GENERAL LEADS TABLE PDF REPORT
 */
export function generateLeadsPdfReport(options: ExportPdfOptions): void {
  const {
    title = 'LAPORAN ACTUAL LEADS & SALES PERFORMANCE',
    subtitle = 'Dokumen Resmi Analisis Kinerja Lead & Respon Sales',
    dateRangeLabel = 'Periode: 01 Agt 2026 - 16 Agt 2026 (159 Total Leads)',
    leads,
    includeSummary = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textDark: [number, number, number] = [30, 41, 59];
  const textMuted: [number, number, number] = [100, 116, 139];

  drawReportHeader(
    doc,
    pageWidth,
    title,
    subtitle,
    'ACTUAL LEADS REPORT',
    dateRangeLabel
  );

  let startY = 28;

  // 2. Summary KPI Cards
  if (includeSummary && leads.length > 0) {
    const totalLeads = leads.length;
    const getStatus = (l: any) => (l.category || l.status || '').toUpperCase();

    const warmCount = leads.filter((l) => getStatus(l).includes('WARM')).length;
    const coldCount = leads.filter((l) => getStatus(l).includes('COLD')).length;
    const visitedCount = leads.filter((l) => getStatus(l).includes('VISITED') || getStatus(l).includes('PROSPECT')).length;
    const junkCount = leads.filter((l) => getStatus(l).includes('JUNK')).length;

    const warmRatio = ((warmCount / totalLeads) * 100).toFixed(1);
    const junkRatio = ((junkCount / totalLeads) * 100).toFixed(1);
    const visitedRatio = ((visitedCount / totalLeads) * 100).toFixed(1);

    const cardWidth = (pageWidth - 28 - (4 * 4)) / 5;
    const cardHeight = 16;
    const cardY = startY;

    const cards = [
      { label: 'Total Leads', value: `${totalLeads}`, sub: '100% Data Actual', bg: [248, 250, 252], border: [203, 213, 225], valColor: [15, 23, 42] },
      { label: 'Warm (Prospek Tinggi)', value: `${warmCount}`, sub: `${warmRatio}% dari Total`, bg: [254, 243, 199], border: [252, 211, 77], valColor: [180, 83, 9] },
      { label: 'Cold (Follow Up)', value: `${coldCount}`, sub: `${((coldCount / totalLeads) * 100).toFixed(1)}% dari Total`, bg: [239, 246, 255], border: [147, 197, 253], valColor: [29, 78, 216] },
      { label: 'Visited / Deal', value: `${visitedCount}`, sub: `${visitedRatio}% Konversi Visit`, bg: [236, 253, 245], border: [110, 231, 183], valColor: [4, 120, 87] },
      { label: 'Junk / Overbudget', value: `${junkCount}`, sub: `${junkRatio}% dari Total`, bg: [254, 242, 242], border: [252, 165, 165], valColor: [185, 28, 28] },
    ];

    cards.forEach((card, idx) => {
      const cardX = 14 + idx * (cardWidth + 4);
      doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
      doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(card.label.toUpperCase(), cardX + 3, cardY + 4.5);

      doc.setFontSize(11);
      doc.setTextColor(card.valColor[0], card.valColor[1], card.valColor[2]);
      doc.text(card.value, cardX + 3, cardY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(card.sub, cardX + 3, cardY + 14);
    });

    startY += cardHeight + 6;
  }

  // 3. Build Table Rows
  const tableData = leads.map((lead: any, index: number) => {
    const no = lead.leadNumber || lead.no || (index + 1);
    const date = lead.dateContact || lead.date || (lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('id-ID') : '-');
    const phone = lead.phone || lead.customerPhone || '-';
    const resolve = lead.resolveStatus || lead.resolve || lead.followUpResolve || '-';
    const status = (lead.category || lead.status || lead.quality || 'COLD').toUpperCase();
    const assigned = lead.assignedToName || lead.assigned || 'Unassigned';
    const answered = lead.answeredAt || '-';
    const firstResp = lead.firstResponseTimeFormatted || lead.firstResponseTime || (lead.firstResponseTimeMinutes !== undefined ? `${lead.firstResponseTimeMinutes} menit` : (lead.responseDurationMinutes ? `${lead.responseDurationMinutes} mnt` : '-'));
    const agentReply = lead.agentFirstReplyTime || '-';
    const adSource = lead.adSource || lead.source || lead.primaryChannel || '-';
    const remarks = lead.remarksFu1 || lead.historyRemarks || lead.remarks || (lead.notes && lead.notes[0]?.text) || '-';
    const sop = lead.sopStatus || (lead.firstResponseTimeMinutes !== undefined && lead.firstResponseTimeMinutes <= 2 ? 'SOP Met (< 2m)' : 'Breached');
    const nameUnit = `${lead.name || lead.customerName || '-'} (${lead.preferredUnit || '1BR'})`;

    return [
      no.toString(),
      date,
      phone,
      resolve,
      status,
      assigned,
      answered,
      firstResp,
      agentReply,
      adSource,
      remarks,
      sop,
      nameUnit,
    ];
  });

  // 4. Render Table
  autoTable(doc, {
    startY: startY,
    head: [[
      'No',
      'Date & Time',
      'Phone / WA',
      'Resolve Status',
      'Quality',
      'Sales PIC',
      'Answered At',
      '1st Response',
      'Agent Reply',
      'Source Iklan',
      'Remarks FU 1 (Actual Remarks)',
      'SOP',
      'Nama Prospek & Unit',
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1.2,
      textColor: textDark,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.3,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 19, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 20 },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 15, halign: 'center' },
      8: { cellWidth: 15, halign: 'center' },
      9: { cellWidth: 24 },
      10: { cellWidth: 'auto' },
      11: { cellWidth: 17, halign: 'center' },
      12: { cellWidth: 26 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = String(data.cell.raw).toUpperCase();
        if (val.includes('WARM')) {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        } else if (val.includes('VISITED') || val.includes('PROSPECT')) {
          data.cell.styles.textColor = [4, 120, 87];
          data.cell.styles.fontStyle = 'bold';
        } else if (val.includes('JUNK')) {
          data.cell.styles.textColor = [185, 28, 28];
        } else {
          data.cell.styles.textColor = [30, 41, 59];
        }
      }
      if (data.section === 'body' && data.column.index === 11) {
        const val = String(data.cell.raw).toLowerCase();
        if (val.includes('met') || val.includes('< 2m')) {
          data.cell.styles.textColor = [4, 120, 87];
        } else {
          data.cell.styles.textColor = [185, 28, 28];
        }
      }
    },
    margin: { top: 26, right: 14, bottom: 12, left: 14 },
  });

  setupPdfFooter(doc, pageWidth, pageHeight, 'Actual Leads');

  const filename = `Report_Actual_Leads_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
