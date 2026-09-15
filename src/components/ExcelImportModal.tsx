import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Lead, 
  SalesAgent, 
  LeadCategory, 
  PropertyUnitInterest, 
  OmnichannelSource,
  FollowUpResolveStatus,
  SopComplianceStatus
} from '../types';
import { 
  analyzeRemarks, 
  calculateLeadScore, 
  getCategoryMeta, 
  getResolveStatusMeta,
  getSopStatusMeta,
  evaluateSopCompliance,
  formatRupiah,
  parseCampaignSource
} from '../services/leadScoring';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Eye,
  Filter,
  Check,
  ChevronRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExcelImportModalProps {
  salesAgents: SalesAgent[];
  onClose: () => void;
  onImportLeads: (leads: Lead[]) => void;
}

interface ParsedRowPreview {
  id: string;
  leadNumber: number;
  dateContact: string;
  phone: string;
  resolveStatus: FollowUpResolveStatus;
  statusLeads: string;
  assignedToName: string;
  assignedAgentId: string;
  answeredAt: string;
  firstResponseTimeMinutes?: number;
  firstResponseTimeFormatted: string;
  agentFirstReplyTime: string;
  adSource: string;
  remarksFu1: string;
  sopStatus: SopComplianceStatus;
  sopNotes: string;
  name: string;
  email: string;
  occupation: string;
  preferredUnit: PropertyUnitInterest;
  budgetEstimated: number;
  score: number;
  category: LeadCategory;
  detectedSignals: string[];
  explanation: string;
  raw: any;
}

// 12-Variable Template Data ready for export & testing
const SAMPLE_12_VARIABLE_LEADS = [
  {
    'No.': 1,
    'Date contact': '2026-08-16 09:15',
    'No Telfon': '+62 811-7788-9900',
    'Resolve / Follow Up': 'Resolved',
    'Status Leads': 'Visited',
    'assigned_to': 'Budi Hartono',
    'answered_at': '2026-08-16 09:19',
    'first_response_time': '4 menit',
    'agent_first_reply_time': '09:19 WIB',
    'Source Iklan by': 'Meta Ads - Instagram Reels (SOHO BSD)',
    'Remaks FU 1': 'Sudah visit show unit bersama partner kantor. Sangat suka konsep dual-key mezzanine 5.8m. Minta siapkan draft SPK dan lock unit lantai 12.',
    'SOP': 'SOP Met (< 15 Min)',
    'Nama Prospek': 'Bambang Soediro, S.H.',
    'Tipe Unit Diminati': 'SOHO Suite (Type B - 112m²)',
    'Estimasi Budget (IDR)': 4900000000,
  },
  {
    'No.': 2,
    'Date contact': '2026-08-16 10:20',
    'No Telfon': '+62 813-2244-6688',
    'Resolve / Follow Up': 'In Progress',
    'Status Leads': 'Visited',
    'assigned_to': 'Sarah Wijaya',
    'answered_at': '2026-08-16 10:23',
    'first_response_time': '3 menit',
    'agent_first_reply_time': '10:23 WIB',
    'Source Iklan by': 'Meta Ads - Instagram Story (Show Unit)',
    'Remaks FU 1': 'Sudah datang survey marketing gallery BSD hari Minggu. Menanyakan cashback pembayaran hard cash dan opsi furnishing.',
    'SOP': 'SOP Met (< 15 Min)',
    'Nama Prospek': 'Fiona Anggraeni',
    'Tipe Unit Diminati': 'Lifestyle SOHO (Type A - 78m²)',
    'Estimasi Budget (IDR)': 3400000000,
  },
  {
    'No.': 3,
    'Date contact': '2026-08-15 14:00',
    'No Telfon': '+62 812-9900-1122',
    'Resolve / Follow Up': 'Need Follow Up',
    'Status Leads': 'Prospect',
    'assigned_to': 'Kevin Pratama',
    'answered_at': '2026-08-15 14:12',
    'first_response_time': '12 menit',
    'agent_first_reply_time': '14:12 WIB',
    'Source Iklan by': 'Google Search Ads ("Penthouse BSD")',
    'Remaks FU 1': 'Minta simulasi KPA Bank BCA dan Mandiri untuk tenor 10 tahun. Budget cocok, sedang negosiasi diskon biaya akad kredit dan siap booking minggu depan.',
    'SOP': 'SOP Met (< 15 Min)',
    'Nama Prospek': 'Ir. Dedi Setiawan',
    'Tipe Unit Diminati': 'Grand Penthouse (180m²)',
    'Estimasi Budget (IDR)': 7600000000,
  },
  {
    'No.': 4,
    'Date contact': '2026-08-15 11:30',
    'No Telfon': '+62 818-4455-1100',
    'Resolve / Follow Up': 'In Progress',
    'Status Leads': 'Prospect',
    'assigned_to': 'Nadia Siregar',
    'answered_at': '2026-08-15 11:36',
    'first_response_time': '6 menit',
    'agent_first_reply_time': '11:36 WIB',
    'Source Iklan by': 'TikTok Ads Campaign',
    'Remaks FU 1': 'Minta hitungan DP 20% dicicil 6x. Sudah bandingkan dengan unit loft sekitarnya dan lebih tertarik Upper West karena akses lifestyle hub.',
    'SOP': 'SOP Met (< 15 Min)',
    'Nama Prospek': 'Clarissa Halim',
    'Tipe Unit Diminati': '1BR Modern Loft (45m²)',
    'Estimasi Budget (IDR)': 1650000000,
  },
  {
    'No.': 5,
    'Date contact': '2026-08-14 09:00',
    'No Telfon': '+62 815-6677-8899',
    'Resolve / Follow Up': 'Need Follow Up',
    'Status Leads': 'Warm',
    'assigned_to': 'Budi Hartono',
    'answered_at': '2026-08-14 09:35',
    'first_response_time': '35 menit',
    'agent_first_reply_time': '09:35 WIB',
    'Source Iklan by': 'Google Search Ads ("SOHO BSD")',
    'Remaks FU 1': 'Minta dikirimkan e-brochure lengkap dan pricelist terbaru. Respon WA sangat ramah dan menanyakan jadwal open house.',
    'SOP': 'SOP Breached (> 30 Min)',
    'Nama Prospek': 'Agus Prasetyo',
    'Tipe Unit Diminati': 'Lifestyle SOHO (Type A - 78m²)',
    'Estimasi Budget (IDR)': 3200000000,
  },
  {
    'No.': 6,
    'Date contact': '2026-08-13 16:20',
    'No Telfon': '+62 877-0099-8811',
    'Resolve / Follow Up': 'Pending',
    'Status Leads': 'Cold',
    'assigned_to': 'Sarah Wijaya',
    'answered_at': '',
    'first_response_time': 'Belum Dijawab',
    'agent_first_reply_time': '-',
    'Source Iklan by': 'Meta Ads - Facebook Feed',
    'Remaks FU 1': 'Baru kirim perkenalan wa pertama, belum ada balasan dari prospek.',
    'SOP': 'Pending Response',
    'Nama Prospek': 'Hendrawan Kusno',
    'Tipe Unit Diminati': '1BR Modern Loft (45m²)',
    'Estimasi Budget (IDR)': 1500000000,
  },
  {
    'No.': 7,
    'Date contact': '2026-08-12 10:15',
    'No Telfon': '+62 899-1122-3344',
    'Resolve / Follow Up': 'Resolved',
    'Status Leads': 'Junk',
    'assigned_to': 'Kevin Pratama',
    'answered_at': '2026-08-12 10:21',
    'first_response_time': '6 menit',
    'agent_first_reply_time': '10:21 WIB',
    'Source Iklan by': 'Display Ads BSD',
    'Remaks FU 1': 'Salah sambung, nomor tidak aktif / cari rumah subsidi 200 juta.',
    'SOP': 'SOP Met (< 15 Min)',
    'Nama Prospek': 'Bukan Target (Junk)',
    'Tipe Unit Diminati': '1BR Modern Loft (45m²)',
    'Estimasi Budget (IDR)': 200000000,
  }
];

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  salesAgents,
  onClose,
  onImportLeads,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedRowPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<LeadCategory | 'ALL'>('ALL');
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize column header keys for forgiving mapping
  const normalizeKey = (key: string) => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const parseExcelFile = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          setIsProcessing(false);
          return;
        }

        const previews: ParsedRowPreview[] = rawJson.map((row, index) => {
          // Flexible key lookup matching all 12 requested fields
          const findValue = (possibleKeys: string[]) => {
            const normalizedPossible = possibleKeys.map(normalizeKey);
            for (const key of Object.keys(row)) {
              if (normalizedPossible.includes(normalizeKey(key))) {
                return row[key];
              }
            }
            return undefined;
          };

          // 1. No.
          const rawNo = findValue(['No.', 'No', 'Number', 'Nomor']) || (index + 1);
          const leadNumber = typeof rawNo === 'number' ? rawNo : parseInt(rawNo, 10) || (index + 1);

          // 2. Date contact
          const dateContact = String(findValue(['Date contact', 'Date Contact', 'Tanggal Kontak', 'Date', 'Tanggal']) || new Date().toISOString().slice(0, 16).replace('T', ' '));

          // 3. No Telfon
          const phone = String(findValue(['No Telfon', 'No Telepon', 'No Whatsapp', 'Phone', 'Telepon', 'Nomor']) || `0812${Math.floor(10000000 + Math.random() * 90000000)}`);

          // 4. Resolve / Follow Up
          const rawResolve = String(findValue(['Resolve / Follow Up', 'Resolve', 'Follow Up', 'Status Resolve', 'Tindakan']) || 'In Progress');
          let resolveStatus: FollowUpResolveStatus = 'IN_PROGRESS';
          const rLower = rawResolve.toLowerCase();
          if (rLower.includes('resolved') || rLower.includes('selesai') || rLower.includes('solved')) resolveStatus = 'RESOLVED';
          else if (rLower.includes('need') || rLower.includes('perlu')) resolveStatus = 'NEED_FOLLOW_UP';
          else if (rLower.includes('pending') || rLower.includes('tunggu')) resolveStatus = 'PENDING';
          else if (rLower.includes('escalat') || rLower.includes('spv')) resolveStatus = 'ESCALATED';

          // 5. Status Leads
          const statusLeads = String(findValue(['Status Leads', 'Status Lead', 'Category', 'Kategori']) || '');

          // 6. assigned_to
          const assignedToName = String(findValue(['assigned_to', 'Assigned To', 'PIC Sales', 'Sales', 'Agent']) || salesAgents[index % salesAgents.length]?.name || 'Budi Hartono');
          const matchedAgent = salesAgents.find((a) => a.name.toLowerCase() === assignedToName.toLowerCase()) || salesAgents[index % salesAgents.length];

          // 7. answered_at
          const answeredAt = String(findValue(['answered_at', 'Answered At', 'Waktu Dijawab', 'Jam Dijawab']) || '');

          // 8. first_response_time
          const rawResponseTime = findValue(['first_response_time', 'First Response Time', 'Response Time', 'Kecepatan Respon']);
          let firstResponseTimeMinutes: number | undefined = undefined;
          let firstResponseTimeFormatted = 'Belum Dijawab';
          
          if (rawResponseTime !== undefined && rawResponseTime !== null && String(rawResponseTime).trim() !== '') {
            const strVal = String(rawResponseTime);
            const numMatch = strVal.match(/\d+/);
            if (numMatch) {
              firstResponseTimeMinutes = parseInt(numMatch[0], 10);
              firstResponseTimeFormatted = `${firstResponseTimeMinutes} menit`;
            } else if (strVal.toLowerCase().includes('belum')) {
              firstResponseTimeMinutes = undefined;
              firstResponseTimeFormatted = 'Belum Dijawab';
            }
          }

          // 9. agent_first_reply_time
          const agentFirstReplyTime = String(findValue(['agent_first_reply_time', 'First Reply Time', 'Jam Balas Pertama']) || (answeredAt ? answeredAt.slice(-5) + ' WIB' : '-'));

          // 10. Source Iklan by
          const rawAdSource = String(findValue(['Source Iklan by', 'Source Iklan', 'Sumber Iklan', 'Ad Source', 'Campaign', 'Content', 'Channel', 'Source']) || 'Meta Ads - Instagram');
          const rawPlatform = String(findValue(['Source', 'Platform', 'Media', 'Sumber']) || '');
          const campaignMeta = parseCampaignSource(rawPlatform, rawAdSource);
          const adSource = campaignMeta.fullName;

          // 11. Remaks FU 1
          const remarksFu1 = String(findValue(['Remaks FU 1', 'Remarks FU 1', 'Catatan Follow Up', 'Remarks', 'History Remarks', 'Catatan']) || '');

          // 12. SOP
          const rawSop = String(findValue(['SOP', 'Status SOP', 'SOP SLA']) || '');
          const sopEvaluation = evaluateSopCompliance(firstResponseTimeMinutes, answeredAt, remarksFu1);
          let sopStatus: SopComplianceStatus = sopEvaluation.sopStatus;
          if (rawSop.toLowerCase().includes('breached') || rawSop.toLowerCase().includes('terlambat')) sopStatus = 'SOP_BREACHED';
          else if (rawSop.toLowerCase().includes('warning')) sopStatus = 'SOP_WARNING';
          else if (rawSop.toLowerCase().includes('met') || rawSop.toLowerCase().includes('sesuai')) sopStatus = 'SOP_MET';
          else if (rawSop.toLowerCase().includes('pending')) sopStatus = 'PENDING';

          // Standard Profile Info
          const name = String(findValue(['Nama Prospek', 'Nama', 'Name', 'Client', 'Customer']) || `Prospek #${leadNumber}`);
          const email = String(findValue(['Email', 'Surel']) || `prospek.${leadNumber}@example.com`);
          const occupation = String(findValue(['Pekerjaan', 'Occupation', 'Jabatan', 'Profesi']) || 'Profesional / Wiraswasta');
          const preferredUnit = (findValue(['Tipe Unit Diminati', 'Unit Diminati', 'Unit', 'Tipe Unit']) || 'Lifestyle SOHO (Type A - 78m²)') as PropertyUnitInterest;
          const rawBudget = findValue(['Estimasi Budget (IDR)', 'Budget', 'Estimasi Budget', 'Harga']);
          const budgetEstimated = typeof rawBudget === 'number' ? rawBudget : parseInt(String(rawBudget).replace(/[^0-9]/g, ''), 10) || 2800000000;

          // AI / NLP Analysis of Remarks FU 1
          const remarksAnalysis = analyzeRemarks(remarksFu1 || statusLeads);

          // Full Score Calculation
          const breakdown = calculateLeadScore({
            budgetEstimated,
            preferredUnit,
            preferredPayment: 'In-House 36x',
            historyRemarks: remarksFu1,
            remarksFu1,
            resolveStatus,
            firstResponseTimeMinutes,
            activities: [],
            messages: [],
          });

          return {
            id: `excel-row-${Date.now()}-${index}`,
            leadNumber,
            dateContact,
            phone,
            resolveStatus,
            statusLeads,
            assignedToName: matchedAgent.name,
            assignedAgentId: matchedAgent.id,
            answeredAt,
            firstResponseTimeMinutes,
            firstResponseTimeFormatted,
            agentFirstReplyTime,
            adSource,
            remarksFu1,
            sopStatus,
            sopNotes: sopEvaluation.notes,
            name,
            email,
            occupation,
            preferredUnit,
            budgetEstimated,
            score: breakdown.totalScore,
            category: breakdown.leadCategory,
            detectedSignals: remarksAnalysis.detectedSignals,
            explanation: remarksAnalysis.explanation,
            raw: row,
          };
        });

        setParsedRows(previews);
        setStep('PREVIEW');
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        alert('Gagal memproses file Excel. Pastikan format file adalah .xlsx atau .xls yang valid.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_12_VARIABLE_LEADS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads_Performance_12_Var');
    XLSX.writeFile(wb, 'UpperWest_Template_12_Variabel_Performance.xlsx');
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const newLeads: Lead[] = parsedRows.map((row) => {
      const breakdown = calculateLeadScore({
        budgetEstimated: row.budgetEstimated,
        preferredUnit: row.preferredUnit,
        preferredPayment: 'In-House 36x',
        historyRemarks: row.remarksFu1,
        remarksFu1: row.remarksFu1,
        resolveStatus: row.resolveStatus,
        firstResponseTimeMinutes: row.firstResponseTimeMinutes,
        activities: [],
        messages: [],
      });

      return {
        id: `lead-imp-${Date.now()}-${row.leadNumber}`,
        leadNumber: row.leadNumber,
        dateContact: row.dateContact,
        phone: row.phone,
        resolveStatus: row.resolveStatus,
        stage: row.category === 'VISITED' ? 'SITE_VISIT_SCHEDULED' : row.category === 'PROSPECT' ? 'NEGOTIATION' : 'CONTACTED',
        assignedAgentId: row.assignedAgentId,
        assignedToName: row.assignedToName,
        answeredAt: row.answeredAt,
        firstResponseTimeMinutes: row.firstResponseTimeMinutes,
        firstResponseTimeFormatted: row.firstResponseTimeFormatted,
        agentFirstReplyTime: row.agentFirstReplyTime,
        adSource: row.adSource,
        campaignSource: row.adSource,
        adPlatform: row.adSource.split(' - ')[0] || 'Not Detected',
        adContent: row.adSource.split(' - ').slice(1).join(' - ') || row.adSource,
        remarksFu1: row.remarksFu1,
        sopStatus: row.sopStatus,
        sopNotes: row.sopNotes,
        name: row.name,
        email: row.email,
        occupation: row.occupation,
        city: 'Tangerang Selatan / Jabodetabek',
        preferredUnit: row.preferredUnit,
        budgetEstimated: row.budgetEstimated,
        budgetRangeText: formatRupiah(row.budgetEstimated),
        preferredPayment: 'In-House 36x',
        primaryChannel: 'EXCEL_IMPORT',
        goAppConversationId: `imp-${Date.now()}`,
        historyRemarks: row.remarksFu1,
        remarksAnalysis: {
          category: row.category,
          scoreModifier: breakdown.remarksEvaluation?.scoreModifier || 0,
          detectedSignals: row.detectedSignals,
          explanation: row.explanation,
          sentiment: 'POSITIVE',
        },
        score: breakdown.totalScore,
        scoreBreakdown: breakdown,
        quality: breakdown.qualityTier,
        category: breakdown.leadCategory,
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        notes: [row.remarksFu1].filter(Boolean),
        activities: [
          {
            id: `act-imp-${Date.now()}`,
            type: 'EXCEL_IMPORT_EVENT',
            title: 'Import Data Excel 12 Variabel',
            description: `Diimpor dari file "${fileName || 'Excel'}". Skor dihitung otomatis.`,
            timestamp: new Date().toISOString(),
            pointsAdded: 10,
            channel: 'EXCEL_IMPORT',
          },
        ],
        messages: [],
      };
    });

    onImportLeads(newLeads);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });

    onClose();
  };

  const filteredPreviewRows = parsedRows.filter((r) => {
    if (selectedFilterCategory === 'ALL') return true;
    return r.category === selectedFilterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Import Leads Excel (12 Variabel Penilaian Performa)
              </h2>
              <p className="text-xs text-slate-400">
                Sistem mengevaluasi No, Date contact, No Telfon, Resolve, Status Leads, assigned_to, answered_at, first response, Source Iklan, Remarks FU 1, & SOP.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {step === 'UPLOAD' ? (
            <div className="space-y-6">
              
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    parseExcelFile(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      parseExcelFile(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div className="p-4 rounded-full bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Tarik & Lepas File Excel Disini, atau <span className="text-emerald-700 underline">Klik untuk Pilih File</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Mendukung format <strong>.XLSX</strong>, <strong>.XLS</strong>, dan <strong>.CSV</strong>. Kolom otomatis dipetakan ke 12 variabel evaluasi performa sales Upper West.
                </p>

                {isProcessing && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses & Menilai 12 Variabel...</span>
                  </div>
                )}
              </div>

              {/* 12 Variables Reference Table & Sample Download */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    Template Resmi 12 Variabel Penilaian Performa Leads
                  </h4>
                  <p className="text-xs text-amber-900/80">
                    Header kolom yang didukung: <strong>No.</strong>, <strong>Date contact</strong>, <strong>No Telfon</strong>, <strong>Resolve / Follow Up</strong>, <strong>Status Leads</strong>, <strong>assigned_to</strong>, <strong>answered_at</strong>, <strong>first_response_time</strong>, <strong>agent_first_reply_time</strong>, <strong>Source Iklan by</strong>, <strong>Remaks FU 1</strong>, <strong>SOP</strong>.
                  </p>
                </div>

                <button
                  onClick={handleDownloadSampleExcel}
                  className="shrink-0 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample Template .XLSX</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Summary of Parsed Leads */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Pratinjau Hasil Import: <span className="text-emerald-700 font-extrabold">{parsedRows.length} Prospek Terbaca</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    File: <span className="font-mono font-semibold">{fileName}</span> • Seluruh 12 variabel telah dinilai & dihitung skornya.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStep('UPLOAD');
                    setParsedRows([]);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Ganti File Excel
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-extrabold uppercase text-[10px] whitespace-nowrap sticky top-0 z-10">
                        <th className="py-2 px-3 text-center">No.</th>
                        <th className="py-2 px-3">Date Contact</th>
                        <th className="py-2 px-3">No Telfon</th>
                        <th className="py-2 px-3">Resolve / FU</th>
                        <th className="py-2 px-3">Status Leads</th>
                        <th className="py-2 px-3">Assigned To</th>
                        <th className="py-2 px-3">1st Response</th>
                        <th className="py-2 px-3">Source Iklan By</th>
                        <th className="py-2 px-3 min-w-[200px]">Remarks FU 1</th>
                        <th className="py-2 px-3 text-center">SOP</th>
                        <th className="py-2 px-3 text-center">Skor AI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredPreviewRows.map((r, i) => {
                        const catMeta = getCategoryMeta(r.category);
                        const resMeta = getResolveStatusMeta(r.resolveStatus);
                        const sopMeta = getSopStatusMeta(r.sopStatus);

                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                              {r.leadNumber || i + 1}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                              {r.dateContact}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono font-semibold text-slate-900">
                              {r.phone}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${resMeta.badgeBg} ${resMeta.badgeBorder} ${resMeta.badgeText}`}>
                                {resMeta.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${catMeta.badgeBg} ${catMeta.badgeBorder} ${catMeta.badgeText}`}>
                                {r.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap font-semibold text-slate-800">
                              {r.assignedToName}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                              {r.firstResponseTimeFormatted}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                                {r.adSource}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-xs text-slate-600 max-w-xs truncate" title={r.remarksFu1}>
                              {r.remarksFu1 || '-'}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sopMeta.badgeBg} ${sopMeta.badgeBorder} ${sopMeta.badgeText}`}>
                                {sopMeta.label.split(' ')[0]} {sopMeta.label.split(' ')[1] || ''}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-black text-slate-900">
                              {r.score}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {step === 'PREVIEW' ? (
              <span>Siap menambahkan <strong>{parsedRows.length}</strong> prospek baru ke dalam sistem CRM.</span>
            ) : (
              <span>Upper West BSD City • Real-time AI Lead Scoring</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>

            {step === 'PREVIEW' && (
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all shadow-md cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi & Simpan {parsedRows.length} Leads</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
