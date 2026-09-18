export interface DigitalSalesTransaction {
  id: string;
  no: number;
  hargaPengikatanExclPPN: number; // in Rupiah, 0 for pending/hyphen
  hargaFormatted: string;
  namaSales: string; // "Fitri", "Ditto", "Rose", "Regina", "Nike"
  salesFullName: string;
  caraBayar: string;
  sourceAds: string;
  status: 'closing' | 'reservation' | 'cancelled';
  statusLabel: string;
  rowHighlight: 'normal' | 'yellow' | 'red';
  unitInfo?: string;
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
    hargaPengikatanExclPPN: 3809024324,
    hargaFormatted: 'Rp3.809.024.324',
    namaSales: 'Fitri',
    salesFullName: 'Fitriyani Dewi',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Meta - SOHO Standard',
    status: 'cancelled',
    statusLabel: 'Batal (Merah)',
    rowHighlight: 'red',
    unitInfo: 'IkaIrkhamni - SH 10.15'
  },
  {
    id: 'dst-2',
    no: 2,
    hargaPengikatanExclPPN: 5438449550,
    hargaFormatted: 'Rp5.438.449.550',
    namaSales: 'Fitri',
    salesFullName: 'Fitriyani Dewi',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Google - Website',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Giras - SHP 0805'
  },
  {
    id: 'dst-3',
    no: 3,
    hargaPengikatanExclPPN: 0,
    hargaFormatted: '-',
    namaSales: 'Rose',
    salesFullName: 'Ira Rosdiana',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Google - Website',
    status: 'reservation',
    statusLabel: 'Reservasi (Kuning)',
    rowHighlight: 'yellow',
    unitInfo: 'Joe Keyzer - SHSD 0909'
  },
  {
    id: 'dst-4',
    no: 4,
    hargaPengikatanExclPPN: 5592295946,
    hargaFormatted: 'Rp5.592.295.946',
    namaSales: 'Fitri',
    salesFullName: 'Fitriyani Dewi',
    caraBayar: 'CB 6x 30% 1x, 70% 2-6x',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Astrid Suhaimi - SHP 0706'
  },
  {
    id: 'dst-5',
    no: 5,
    hargaPengikatanExclPPN: 6271952207,
    hargaFormatted: 'Rp6.271.952.207',
    namaSales: 'Ditto',
    salesFullName: 'Ditto Zulfikar Junaedi',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Bro / Bambang - Unit 0701 (209 Sqm)'
  },
  {
    id: 'dst-6',
    no: 6,
    hargaPengikatanExclPPN: 0,
    hargaFormatted: '-',
    namaSales: 'Rose',
    salesFullName: 'Ira Rosdiana',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Tiktok - Tiktok (BC 11 Mei)',
    status: 'reservation',
    statusLabel: 'Reservasi (Kuning)',
    rowHighlight: 'yellow',
    unitInfo: 'Andrew HaCe - SHS L/M'
  },
  {
    id: 'dst-7',
    no: 7,
    hargaPengikatanExclPPN: 4882425225,
    hargaFormatted: 'Rp4.882.425.225',
    namaSales: 'Regina',
    salesFullName: 'Regina Junita',
    caraBayar: 'KPA DP 30%',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Ery Wijaya - SHP 0702'
  },
  {
    id: 'dst-8',
    no: 8,
    hargaPengikatanExclPPN: 2326128649,
    hargaFormatted: 'Rp2.326.128.649',
    namaSales: 'Ditto',
    salesFullName: 'Ditto Zulfikar Junaedi',
    caraBayar: 'KPA DP Subsidi 5%',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Ronny Christian - Hold Unit 1 SH T2'
  },
  {
    id: 'dst-9',
    no: 9,
    hargaPengikatanExclPPN: 2326128649,
    hargaFormatted: 'Rp2.326.128.649',
    namaSales: 'Ditto',
    salesFullName: 'Ditto Zulfikar Junaedi',
    caraBayar: 'KPA DP Subsidi 5%',
    sourceAds: 'Meta - SOHO Signature',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Ronny Christian - Hold Unit 2 SH T2'
  },
  {
    id: 'dst-10',
    no: 10,
    hargaPengikatanExclPPN: 4689273694,
    hargaFormatted: 'Rp4.689.273.694',
    namaSales: 'Nike',
    salesFullName: 'Yulia Eunike',
    caraBayar: 'KPA Dp Subsidi 10%',
    sourceAds: 'Intagram - DM Sales',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Akhmad - SHSL'
  },
  {
    id: 'dst-11',
    no: 11,
    hargaPengikatanExclPPN: 1200000000,
    hargaFormatted: 'Rp1.200.000.000',
    namaSales: 'Rose',
    salesFullName: 'Ira Rosdiana',
    caraBayar: 'Hardcash',
    sourceAds: 'Google - Website',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Shelly Pieloor PS - 2Br Cash Keras'
  },
  {
    id: 'dst-12',
    no: 12,
    hargaPengikatanExclPPN: 4585501297,
    hargaFormatted: 'Rp4.585.501.297',
    namaSales: 'Nike',
    salesFullName: 'Yulia Eunike',
    caraBayar: 'KPA DP Subsidi',
    sourceAds: 'Intagram - DM Sales',
    status: 'closing',
    statusLabel: 'Closing Sah',
    rowHighlight: 'normal',
    unitInfo: 'Soni Laberta - SHSL'
  }
];

// Helper to compute rankings and aggregates
export function getDigitalSalesSummary() {
  const validClosingTransactions = DIGITAL_SALES_TRANSACTIONS.filter(t => t.status === 'closing');
  const totalNetRevenue = validClosingTransactions.reduce((sum, t) => sum + t.hargaPengikatanExclPPN, 0);
  const totalGrossRevenue = DIGITAL_SALES_TRANSACTIONS.reduce((sum, t) => sum + t.hargaPengikatanExclPPN, 0);
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
    totalClosingUnits,
    totalReservationUnits,
    totalCancelledUnits,
    salesRankings,
    sourceAdsBreakdown
  };
}
