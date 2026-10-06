// Data Penjualan Digital & Transaksi Pengikatan Unit Upper West BSD City 2026
// Single-Source of Truth: Sesuai dokumen resmi spreadsheet Rincian Transaksi Penjualan Digital

export interface DigitalSalesTransaction {
  id: string;
  no: number;
  namaKonsumen: string;
  dateVisit: string;
  dateUtj: string;
  dateClosing: string;
  tipeUnit: string;
  sizeSg: string | number;
  hargaPengikatanInclPPN: number;
  hargaPengikatanExclPPN: number; // in Rupiah, 0 for pending/hyphen
  hargaFormatted: string;
  hargaInclFormatted: string;
  namaSales: string; // "Fitri", "Ditto", "Rose", "Regina", "Nike"
  salesFullName: string;
  caraBayar: string;
  sourceAds: string;
  status: 'closing' | 'reservation' | 'cancelled';
  statusLabel: string;
  rowHighlight: 'normal' | 'yellow' | 'red';
  unitInfo: string;
}

export interface SalesRevenueSummary {
  salesKey: string;
  salesName: string;
  salesFullName: string;
  avatar: string;
  closingUnits: number;
  reservationUnits: number;
  cancelledUnits: number;
  totalRevenueExclPPN: number; // Valid closing only
  grossRevenueExclPPN: number; // Including cancelled
  shareOfRevenuePct: number;
}

export const DIGITAL_SALES_TRANSACTIONS: DigitalSalesTransaction[] = [
  {
    id: 'dst-1',
    no: 1,
    namaKonsumen: 'Arif Ekanugraha',
    dateVisit: '12 Januari',
    dateUtj: '12 Januari',
    dateClosing: '19 Januari',
    tipeUnit: 'SHC 10.15',
    sizeSg: '106,39',
    hargaPengikatanInclPPN: 4228017000,
    hargaPengikatanExclPPN: 3809024324,
    hargaFormatted: 'Rp3.809.024.324',
    hargaInclFormatted: 'Rp4.228.017.000',
    namaSales: 'Fitri',
    salesFullName: 'Fitriyani Dewi',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Meta - SOHO Standard',
    status: 'cancelled',
    statusLabel: 'Batal (Merah)',
    rowHighlight: 'red',
    unitInfo: 'Arif Ekanugraha - SHC 10.15'
  },
  {
    id: 'dst-2',
    no: 2,
    namaKonsumen: 'Amir',
    dateVisit: '31 Januari',
    dateUtj: '9 Februari',
    dateClosing: '9 Februari',
    tipeUnit: 'SHP 08.05',
    sizeSg: '172,79',
    hargaPengikatanInclPPN: 6036679000,
    hargaPengikatanExclPPN: 5438449550,
    hargaFormatted: 'Rp5.438.449.550',
    hargaInclFormatted: 'Rp6.036.679.000',
    namaSales: 'Fitri',
    salesFullName: 'Fitriyani Dewi',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Google - Website',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Amir - SHP 08.05'
  },
  {
    id: 'dst-3',
    no: 3,
    namaKonsumen: 'Joe',
    dateVisit: '18 Maret',
    dateUtj: '30 Maret',
    dateClosing: '-',
    tipeUnit: 'SHSG 09.09',
    sizeSg: '87,73',
    hargaPengikatanInclPPN: 3126177000,
    hargaPengikatanExclPPN: 0,
    hargaFormatted: '-',
    hargaInclFormatted: 'Rp3.126.177.000',
    namaSales: 'Rose',
    salesFullName: 'Ira Rosdiana',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Google - Website',
    status: 'reservation',
    statusLabel: 'Reservasi (Kuning)',
    rowHighlight: 'yellow',
    unitInfo: 'Joe - SHSG 09.09'
  },
  {
    id: 'dst-4',
    no: 4,
    namaKonsumen: 'Astrid Suhaimi',
    dateVisit: '05. 06, 09 Mei',
    dateUtj: '9 Mei',
    dateClosing: '11 Mei',
    tipeUnit: 'SHP 07.06',
    sizeSg: '197,42',
    hargaPengikatanInclPPN: 6207448500,
    hargaPengikatanExclPPN: 5592295946,
    hargaFormatted: 'Rp5.592.295.946',
    hargaInclFormatted: 'Rp6.207.448.500',
    namaSales: 'Fitri',
    salesFullName: 'Fitriyani Dewi',
    caraBayar: 'CB 6x 30% 1x, 70% 2-6x',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Astrid Suhaimi - SHP 07.06'
  },
  {
    id: 'dst-5',
    no: 5,
    namaKonsumen: 'Bambang',
    dateVisit: '02 & 14 Mei',
    dateUtj: '15 Mei',
    dateClosing: '20 Mei',
    tipeUnit: 'SHP 07.01',
    sizeSg: '209,76',
    hargaPengikatanInclPPN: 6961866950,
    hargaPengikatanExclPPN: 6271952207,
    hargaFormatted: 'Rp6.271.952.207',
    hargaInclFormatted: 'Rp6.961.866.950',
    namaSales: 'Ditto',
    salesFullName: 'Ditto Zulfikar Junaedi',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Meta - SOHO Signature',
    status: 'cancelled',
    statusLabel: 'Batal (Merah)',
    rowHighlight: 'red',
    unitInfo: 'Bambang - SHP 07.01'
  },
  {
    id: 'dst-6',
    no: 6,
    namaKonsumen: 'Andrew HaCe',
    dateVisit: '17 Mei , 08 & 16 Juni',
    dateUtj: '16 Juni',
    dateClosing: '28 Sept',
    tipeUnit: 'SHP 07.02',
    sizeSg: '172,96',
    hargaPengikatanInclPPN: 6375604470,
    hargaPengikatanExclPPN: 5743787811,
    hargaFormatted: 'Rp5.743.787.811',
    hargaInclFormatted: 'Rp6.375.604.470',
    namaSales: 'Rose',
    salesFullName: 'Ira Rosdiana',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Tiktok - Tiktok (BC 11 Mei)',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Andrew HaCe - SHP 07.02'
  },
  {
    id: 'dst-7',
    no: 7,
    namaKonsumen: 'Ery Wijaya',
    dateVisit: '10,16,22 Juni',
    dateUtj: '22 Juni',
    dateClosing: '17 Juli',
    tipeUnit: 'SHP 08.03',
    sizeSg: '172,36',
    hargaPengikatanInclPPN: 5419492000,
    hargaPengikatanExclPPN: 4882425225,
    hargaFormatted: 'Rp4.882.425.225',
    hargaInclFormatted: 'Rp5.419.492.000',
    namaSales: 'Regina',
    salesFullName: 'Regina Junita',
    caraBayar: 'KPA DP 30%',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Ery Wijaya - SHP 08.03'
  },
  {
    id: 'dst-8',
    no: 8,
    namaKonsumen: 'Ronny Christian',
    dateVisit: '07 & 13 July',
    dateUtj: '26 July',
    dateClosing: '28 July',
    tipeUnit: 'SHS 17.05',
    sizeSg: '80,51',
    hargaPengikatanInclPPN: 2582002800,
    hargaPengikatanExclPPN: 2326128649,
    hargaFormatted: 'Rp2.326.128.649',
    hargaInclFormatted: 'Rp2.582.002.800',
    namaSales: 'Ditto',
    salesFullName: 'Ditto Zulfikar Junaedi',
    caraBayar: 'KPA DP Subsidi 5%',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Ronny Christian - SHS 17.05'
  },
  {
    id: 'dst-9',
    no: 9,
    namaKonsumen: 'Ronny Christian',
    dateVisit: '07 & 13 July',
    dateUtj: '26 July',
    dateClosing: '28 July',
    tipeUnit: 'SHS 17.06',
    sizeSg: '80,51',
    hargaPengikatanInclPPN: 2582002800,
    hargaPengikatanExclPPN: 2326128649,
    hargaFormatted: 'Rp2.326.128.649',
    hargaInclFormatted: 'Rp2.582.002.800',
    namaSales: 'Ditto',
    salesFullName: 'Ditto Zulfikar Junaedi',
    caraBayar: 'KPA DP Subsidi 5%',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Ronny Christian - SHS 17.06'
  },
  {
    id: 'dst-10',
    no: 10,
    namaKonsumen: 'Akhmad',
    dateVisit: '15 July',
    dateUtj: '31 July',
    dateClosing: '31 July',
    tipeUnit: 'SHL 16.10',
    sizeSg: '155,35',
    hargaPengikatanInclPPN: 5205093800,
    hargaPengikatanExclPPN: 4689273694,
    hargaFormatted: 'Rp4.689.273.694',
    hargaInclFormatted: 'Rp5.205.093.800',
    namaSales: 'Nike',
    salesFullName: 'Yulia Eunike',
    caraBayar: 'KPA Dp Subsidi 10%',
    sourceAds: 'Intagram - DM Sales',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Akhmad - SHL 16.10'
  },
  {
    id: 'dst-11',
    no: 11,
    namaKonsumen: 'Sherly',
    dateVisit: '19 Mar, 13 Mei, 10,11 Aug',
    dateUtj: '11 Aug',
    dateClosing: '12 Aug',
    tipeUnit: 'APE 20.07',
    sizeSg: '44,05',
    hargaPengikatanInclPPN: 1332000000,
    hargaPengikatanExclPPN: 1200000000,
    hargaFormatted: 'Rp1.200.000.000',
    hargaInclFormatted: 'Rp1.332.000.000',
    namaSales: 'Rose',
    salesFullName: 'Ira Rosdiana',
    caraBayar: 'Hardcash',
    sourceAds: 'Google - Website',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Sherly - APE 20.07'
  },
  {
    id: 'dst-12',
    no: 12,
    namaKonsumen: 'Soni Laberta',
    dateVisit: '22 July. 21 Aug',
    dateUtj: '22 Aug',
    dateClosing: '22 Aug',
    tipeUnit: 'SHSL 17.10',
    sizeSg: '155,25',
    hargaPengikatanInclPPN: 5089906440,
    hargaPengikatanExclPPN: 4585501297,
    hargaFormatted: 'Rp4.585.501.297',
    hargaInclFormatted: 'Rp5.089.906.440',
    namaSales: 'Nike',
    salesFullName: 'Yulia Eunike',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Intagram - DM Sales',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Soni Laberta - SHSL 17.10'
  }
];

// Helper to compute rankings and aggregates
export function getDigitalSalesSummary() {
  const validClosingTransactions = DIGITAL_SALES_TRANSACTIONS.filter(t => t.status === 'closing');
  const totalNetRevenue = validClosingTransactions.reduce((sum, t) => sum + t.hargaPengikatanExclPPN, 0);
  const totalGrossRevenue = DIGITAL_SALES_TRANSACTIONS.reduce((sum, t) => sum + t.hargaPengikatanExclPPN, 0);
  const totalReservationRevenue = DIGITAL_SALES_TRANSACTIONS.filter(t => t.status === 'reservation').reduce((sum, t) => sum + t.hargaPengikatanExclPPN, 0);
  const totalCancelledRevenue = DIGITAL_SALES_TRANSACTIONS.filter(t => t.status === 'cancelled').reduce((sum, t) => sum + t.hargaPengikatanExclPPN, 0);
  const totalClosingUnits = validClosingTransactions.length;
  const totalReservationUnits = DIGITAL_SALES_TRANSACTIONS.filter(t => t.status === 'reservation').length;
  const totalCancelledUnits = DIGITAL_SALES_TRANSACTIONS.filter(t => t.status === 'cancelled').length;

  const salesMap: Record<string, {
    salesKey: string;
    salesName: string;
    salesFullName: string;
    avatar: string;
    closingUnits: number;
    reservationUnits: number;
    cancelledUnits: number;
    totalRevenueExclPPN: number;
    grossRevenueExclPPN: number;
  }> = {
    'Fitri': {
      salesKey: 'Fitri',
      salesName: 'Fitri',
      salesFullName: 'Fitriyani Dewi',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      closingUnits: 0,
      reservationUnits: 0,
      cancelledUnits: 0,
      totalRevenueExclPPN: 0,
      grossRevenueExclPPN: 0
    },
    'Nike': {
      salesKey: 'Nike',
      salesName: 'Nike',
      salesFullName: 'Yulia Eunike',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      closingUnits: 0,
      reservationUnits: 0,
      cancelledUnits: 0,
      totalRevenueExclPPN: 0,
      grossRevenueExclPPN: 0
    },
    'Rose': {
      salesKey: 'Rose',
      salesName: 'Rose',
      salesFullName: 'Ira Rosdiana',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      closingUnits: 0,
      reservationUnits: 0,
      cancelledUnits: 0,
      totalRevenueExclPPN: 0,
      grossRevenueExclPPN: 0
    },
    'Regina': {
      salesKey: 'Regina',
      salesName: 'Regina',
      salesFullName: 'Regina Junita',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      closingUnits: 0,
      reservationUnits: 0,
      cancelledUnits: 0,
      totalRevenueExclPPN: 0,
      grossRevenueExclPPN: 0
    },
    'Ditto': {
      salesKey: 'Ditto',
      salesName: 'Ditto',
      salesFullName: 'Ditto Zulfikar Junaedi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      closingUnits: 0,
      reservationUnits: 0,
      cancelledUnits: 0,
      totalRevenueExclPPN: 0,
      grossRevenueExclPPN: 0
    }
  };

  DIGITAL_SALES_TRANSACTIONS.forEach(t => {
    const s = salesMap[t.namaSales];
    if (s) {
      if (t.status === 'closing') {
        s.closingUnits += 1;
        s.totalRevenueExclPPN += t.hargaPengikatanExclPPN;
        s.grossRevenueExclPPN += t.hargaPengikatanExclPPN;
      } else if (t.status === 'reservation') {
        s.reservationUnits += 1;
      } else if (t.status === 'cancelled') {
        s.cancelledUnits += 1;
        s.grossRevenueExclPPN += t.hargaPengikatanExclPPN;
      }
    }
  });

  const salesRankings: SalesRevenueSummary[] = Object.values(salesMap)
    .map(s => ({
      ...s,
      shareOfRevenuePct: totalNetRevenue > 0 ? (s.totalRevenueExclPPN / totalNetRevenue) * 100 : 0
    }))
    .sort((a, b) => b.totalRevenueExclPPN - a.totalRevenueExclPPN);

  // Source Ads aggregation
  const sourceAdsMap: Record<string, { name: string; revenue: number; units: number }> = {};
  DIGITAL_SALES_TRANSACTIONS.forEach(t => {
    if (!sourceAdsMap[t.sourceAds]) {
      sourceAdsMap[t.sourceAds] = { name: t.sourceAds, revenue: 0, units: 0 };
    }
    if (t.status === 'closing') {
      sourceAdsMap[t.sourceAds].revenue += t.hargaPengikatanExclPPN;
      sourceAdsMap[t.sourceAds].units += 1;
    }
  });

  const sourceAdsBreakdown = Object.values(sourceAdsMap)
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalNetRevenue,
    totalGrossRevenue,
    totalReservationRevenue,
    totalCancelledRevenue,
    totalOverallRevenue: totalNetRevenue + totalCancelledRevenue,
    totalClosingUnits,
    totalReservationUnits,
    totalCancelledUnits,
    totalOverallUnits: totalClosingUnits + totalCancelledUnits,
    salesRankings,
    sourceAdsBreakdown
  };
}
