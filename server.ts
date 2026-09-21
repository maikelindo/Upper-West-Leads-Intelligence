import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER_EMAIL = 'maikelindo8@gmail.com';
const DATA_FILE = path.join(process.cwd(), 'access_control.json');

interface AccessData {
  approvedUsers: Array<{
    email: string;
    name: string;
    avatar?: string;
    role: string;
    status: string;
    isOwner?: boolean;
    department?: string;
    approvedAt: string;
  }>;
  accessRequests: Array<{
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string;
    status: string;
    department: string;
    requestReason: string;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
  }>;
}

function loadAccessData(): AccessData {
  const defaultData: AccessData = {
    approvedUsers: [
      {
        email: OWNER_EMAIL,
        name: 'Maikel (Owner)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'OWNER',
        status: 'APPROVED',
        isOwner: true,
        department: 'Executive Management',
        approvedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        email: 'ditto.sales@gmail.com',
        name: 'Ditto Zulfikar',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'SALES',
        status: 'APPROVED',
        isOwner: false,
        department: 'Inhouse Sales Senior',
        approvedAt: '2026-03-10T09:30:00.000Z',
      }
    ],
    accessRequests: [
      {
        id: 'req-fitri-01',
        email: 'fitri.dewi@gmail.com',
        name: 'Fitriyani Dewi',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        role: 'SALES',
        status: 'PENDING',
        department: 'Sales Advisor Upper West',
        requestReason: 'Izin akses dashboard untuk evaluasi closing leads iklan Meta Ads & follow-up prospek SOHO',
        requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'req-marketing-02',
        email: 'reza.digital@gmail.com',
        name: 'Reza Pratama',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'MARKETING',
        status: 'PENDING',
        department: 'Performance Marketing Team',
        requestReason: 'Analisis CPL & ROAS kampanye iklan digital Upper West',
        requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      }
    ]
  };

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.approvedUsers)) parsed.approvedUsers = defaultData.approvedUsers;
      if (!Array.isArray(parsed.accessRequests)) parsed.accessRequests = defaultData.accessRequests;
      // Ensure owner is ALWAYS present in approvedUsers
      if (!parsed.approvedUsers.some((u: any) => u.email.toLowerCase() === OWNER_EMAIL.toLowerCase())) {
        parsed.approvedUsers.unshift(defaultData.approvedUsers[0]);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading access_control.json, using default:', err);
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing default access_control.json:', err);
  }
  return defaultData;
}

function saveAccessData(data: AccessData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving access_control.json:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client (server-side only)
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Gemini initialization warning:', err);
    }
  }

  // API 1: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Access Control API 1: Check Current User Status
  app.get('/api/auth/status', (req, res) => {
    const email = (req.query.email as string || '').trim().toLowerCase();
    const data = loadAccessData();

    if (!email) {
      return res.json({ status: 'NONE', email: '' });
    }

    // Is Owner (maikelindo8@gmail.com)
    if (email === OWNER_EMAIL.toLowerCase()) {
      return res.json({
        email: OWNER_EMAIL,
        name: 'Maikel',
        role: 'OWNER',
        status: 'APPROVED',
        isOwner: true,
        department: 'Executive Management',
        approvedAt: '2026-01-01T00:00:00.000Z'
      });
    }

    // Check approved list
    const approved = data.approvedUsers.find(u => u.email.toLowerCase() === email);
    if (approved) {
      return res.json({
        email: approved.email,
        name: approved.name,
        avatar: approved.avatar,
        role: approved.role,
        status: 'APPROVED',
        isOwner: false,
        department: approved.department,
        approvedAt: approved.approvedAt
      });
    }

    // Check pending / rejected in accessRequests
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === email);
    if (reqItem) {
      return res.json({
        email: reqItem.email,
        name: reqItem.name,
        avatar: reqItem.avatar,
        role: reqItem.role,
        status: reqItem.status,
        isOwner: false,
        department: reqItem.department,
        requestedAt: reqItem.requestedAt,
        requestReason: reqItem.requestReason
      });
    }

    return res.json({ status: 'NONE', email });
  });

  // Access Control API 2: Submit Access Request
  app.post('/api/auth/request-access', (req, res) => {
    const { email, name, role, department, requestReason } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email Gmail valid diperlukan' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const data = loadAccessData();

    // If owner requests, automatically approved
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return res.json({
        success: true,
        status: 'APPROVED',
        message: 'Akses disetujui otomatis sebagai Super Admin (Owner)',
        profile: data.approvedUsers.find(u => u.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
      });
    }

    // Check if already approved
    const alreadyApproved = data.approvedUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (alreadyApproved) {
      return res.json({
        success: true,
        status: 'APPROVED',
        message: 'Akun Anda sudah memiliki izin akses',
        profile: alreadyApproved
      });
    }

    // Check or update existing request
    const existingIdx = data.accessRequests.findIndex(r => r.email.toLowerCase() === cleanEmail);
    const newRequest = {
      id: existingIdx >= 0 ? data.accessRequests[existingIdx].id : `req-${Date.now()}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role: role || 'SALES',
      status: 'PENDING',
      department: department || 'Sales / Marketing Upper West',
      requestReason: requestReason || 'Permintaan akses dashboard visualisasi data leads dan sales Upper West BSD City',
      requestedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      data.accessRequests[existingIdx] = newRequest;
    } else {
      data.accessRequests.unshift(newRequest);
    }

    saveAccessData(data);
    res.json({
      success: true,
      status: 'PENDING',
      message: 'Permintaan akses berhasil dikirim ke Owner (maikelindo8@gmail.com)',
      request: newRequest
    });
  });

  // Access Control API 3: Get All Requests & Users (Owner Access Management)
  app.get('/api/auth/manage', (req, res) => {
    const data = loadAccessData();
    const pendingCount = data.accessRequests.filter(r => r.status === 'PENDING').length;
    res.json({
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests,
      pendingCount
    });
  });

  // Access Control API 4: Owner Approves (ACC) Request
  app.post('/api/auth/approve', (req, res) => {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email diperlukan' });

    const cleanEmail = email.trim().toLowerCase();
    const data = loadAccessData();

    // Find request
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === cleanEmail);
    const targetName = reqItem ? reqItem.name : cleanEmail.split('@')[0];
    const targetRole = role || (reqItem ? reqItem.role : 'SALES');
    const targetDept = reqItem ? reqItem.department : 'General';
    const targetAvatar = reqItem ? reqItem.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    // Update request status
    if (reqItem) {
      reqItem.status = 'APPROVED';
      reqItem.reviewedAt = new Date().toISOString();
      reqItem.reviewedBy = OWNER_EMAIL;
      reqItem.role = targetRole;
    }

    // Add or update in approvedUsers
    const approvedIdx = data.approvedUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const approvedObj = {
      email: cleanEmail,
      name: targetName,
      avatar: targetAvatar,
      role: targetRole,
      status: 'APPROVED',
      isOwner: cleanEmail === OWNER_EMAIL.toLowerCase(),
      department: targetDept,
      approvedAt: new Date().toISOString()
    };

    if (approvedIdx >= 0) {
      data.approvedUsers[approvedIdx] = approvedObj;
    } else {
      data.approvedUsers.push(approvedObj);
    }

    saveAccessData(data);
    res.json({
      success: true,
      message: `Akses untuk ${cleanEmail} berhasil di-ACC (disetujui)`,
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests
    });
  });

  // Access Control API 5: Owner Rejects Request
  app.post('/api/auth/reject', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email diperlukan' });

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Owner tidak dapat ditolak' });
    }

    const data = loadAccessData();
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === cleanEmail);
    if (reqItem) {
      reqItem.status = 'REJECTED';
      reqItem.reviewedAt = new Date().toISOString();
      reqItem.reviewedBy = OWNER_EMAIL;
    }

    // Remove from approvedUsers if existed
    data.approvedUsers = data.approvedUsers.filter(u => u.email.toLowerCase() !== cleanEmail);

    saveAccessData(data);
    res.json({
      success: true,
      message: `Permintaan akses ${cleanEmail} telah ditolak`,
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests
    });
  });

  // Access Control API 6: Owner Revokes Access
  app.post('/api/auth/revoke', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email diperlukan' });

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Akses Owner tidak dapat dicabut' });
    }

    const data = loadAccessData();
    data.approvedUsers = data.approvedUsers.filter(u => u.email.toLowerCase() !== cleanEmail);
    
    // Also update request item
    const reqItem = data.accessRequests.find(r => r.email.toLowerCase() === cleanEmail);
    if (reqItem) {
      reqItem.status = 'REJECTED';
    }

    saveAccessData(data);
    res.json({
      success: true,
      message: `Izin akses untuk ${cleanEmail} telah dicabut`,
      approvedUsers: data.approvedUsers,
      accessRequests: data.accessRequests
    });
  });

  // Access Control API 7: Owner Whitelists / Directly Invites Email
  app.post('/api/auth/invite', (req, res) => {
    const { email, name, role, department } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email Gmail valid diperlukan' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const data = loadAccessData();

    const existingIdx = data.approvedUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const userObj = {
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      role: role || 'SALES',
      status: 'APPROVED',
      isOwner: cleanEmail === OWNER_EMAIL.toLowerCase(),
      department: department || 'Sales & Marketing',
      approvedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      data.approvedUsers[existingIdx] = userObj;
    } else {
      data.approvedUsers.push(userObj);
    }

    saveAccessData(data);
    res.json({
      success: true,
      message: `${cleanEmail} berhasil ditambahkan ke daftar izin akses langsung`,
      approvedUsers: data.approvedUsers
    });
  });

  // API 2: Evaluate Lead Quality & Pitch Strategy with Gemini
  app.post('/api/gemini/evaluate-lead', async (req, res) => {
    try {
      const { lead } = req.body;
      if (!lead) {
        return res.status(400).json({ error: 'Lead data is required' });
      }

      if (!ai) {
        // Fallback intelligent evaluation if API key is not yet set
        return res.json({
          summary: `Prospek ${lead.name} menunjukkan minat signifikan pada ${lead.preferredUnit || 'Upper West Unit'}. Aktivitas multi-channel di GoApp menunjukkan sinyal kesiapan beli yang kuat.`,
          buyingReadiness: lead.score > 75 ? 'Tinggi (85-95%)' : lead.score > 45 ? 'Sedang (60-80%)' : 'Rendah/Eksplorasi (30-50%)',
          keyInterest: `${lead.preferredUnit} dengan skema pembayaran ${lead.preferredPayment || 'Inhouse'}`,
          objectionsOrRisks: [
            'Membutuhkan konfirmasi estimasi serah terima unit & spesifikasi mezzanine.',
            'Sensitivitas perbandingan diskon promo launching vs kompetitor terdekat.',
          ],
          recommendedNextStep: 'Undang untuk VIP Show Unit Tour di Marketing Gallery BSD dan presentasikan simulasi cashback DP.',
          suggestedPitchScript: `Selamat siang Bapak/Ibu ${lead.name}, menyambung percakapan di GoApp WhatsApp, kami sudah siapkan penawaran khusus untuk unit ${lead.preferredUnit} dengan benefit semi-furnished exclusive. Apakah berkenan kami jadwalkan private tour akhir pekan ini?`,
          lastEvaluatedAt: new Date().toISOString(),
        });
      }

      const prompt = `
Anda adalah AI Lead Scoring Specialist & Head of Sales untuk properti luxury "Upper West" di BSD City, Indonesia.
Analisis data prospek (lead) berikut yang berkomunikasi melalui omnichannel GoApp (WhatsApp, Instagram, Web, Telepon):

Data Lead:
- Nama: ${lead.name}
- Pekerjaan/Perusahaan: ${lead.occupation || '-'} (${lead.company || '-'})
- Kota: ${lead.city || '-'}
- Unit Diminati: ${lead.preferredUnit}
- Estimasi Budget: Rp ${(lead.budgetEstimated || 0).toLocaleString('id-ID')}
- Preferensi Bayar: ${lead.preferredPayment}
- Tahap Saat Ini: ${lead.stage}
- Skor Aktivitas Otomatis: ${lead.score} / 100 (${lead.quality})
- Riwayat Pesan GoApp:
${(lead.messages || []).map((m: any) => `  [${m.channel}] ${m.senderName}: "${m.message}"`).join('\n')}
- Aktivitas Terakhir:
${(lead.activities || []).map((a: any) => `  - ${a.title} (+${a.pointsAdded} pts) via ${a.channel}`).join('\n')}

Tolong berikan evaluasi mendalam dalam Bahasa Indonesia dalam format JSON valid:
{
  "summary": "Ringkasan profil dan peluang closing lead (2-3 kalimat)",
  "buyingReadiness": "Tingkat kesiapan beli (misal: 'Sangat Tinggi (90%) - Tahap Negosiasi Akhir')",
  "keyInterest": "Fokus utama & daya tarik yang paling diminati",
  "objectionsOrRisks": ["Keberatan/risiko 1", "Keberatan/risiko 2"],
  "recommendedNextStep": "Langkah aksi taktis berikutnya untuk tim sales Upper West",
  "suggestedPitchScript": "Script pesan WhatsApp follow-up profesional dan persuasif untuk sales rep"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      parsed.lastEvaluatedAt = new Date().toISOString();

      return res.json(parsed);
    } catch (error: any) {
      console.error('Error evaluating lead with Gemini:', error);
      res.status(500).json({
        error: error.message || 'Gagal mengevaluasi lead dengan AI',
      });
    }
  });

  // API 3: AI Draft Smart WhatsApp / GoApp Response
  app.post('/api/gemini/draft-message', async (req, res) => {
    try {
      const { lead, userIntent, tone = 'friendly_professional' } = req.body;
      if (!lead) {
        return res.status(400).json({ error: 'Lead data is required' });
      }

      if (!ai) {
        return res.json({
          draft: `Halo Bapak/Ibu ${lead.name}, terima kasih telah menghubungi Upper West BSD via GoApp. Menindaklanjuti ketertarikan Anda pada unit ${lead.preferredUnit}, kami memiliki promo diskon launching dan opsi cicilan ${lead.preferredPayment || 'In-House'}. Apakah akhir pekan ini ada waktu luang untuk kami jadwalkan private show unit tour di Marketing Gallery BSD? Terima kasih! - Tim Sales Upper West`,
        });
      }

      const prompt = `
Buatkan draft pesan follow-up WhatsApp melalui GoApp Omnichannel dalam Bahasa Indonesia yang sangat sopan, elegan, profesional, dan berkonversi tinggi untuk sales properti Upper West BSD.

Lead Profile:
- Nama: ${lead.name}
- Unit Diminati: ${lead.preferredUnit}
- Budget: Rp ${(lead.budgetEstimated || 0).toLocaleString('id-ID')}
- Status Lead: ${lead.quality} (Skor: ${lead.score}/100)
- Konteks Tambahan / Instruksi Sales: ${userIntent || 'Follow up jadwal kunjungan show unit dan kirimkan e-brochure'}
- Nada Bicara: ${tone}

Format output: HANYA berikan teks pesan WhatsApp (tanpa tanda kutip, tanpa teks pengantar). Sertakan call-to-action yang jelas dan ramah.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return res.json({ draft: response.text?.trim() });
    } catch (error: any) {
      console.error('Error drafting message with Gemini:', error);
      res.status(500).json({ error: error.message || 'Gagal membuat pesan AI' });
    }
  });

  // API 4: Batch AI Remarks Analysis for Excel Imported Leads
  app.post('/api/gemini/analyze-remarks-batch', async (req, res) => {
    try {
      const { items } = req.body; // Array of { id, name, remarks, unit, budget }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Array of items is required' });
      }

      if (!ai) {
        // Fallback rule-based result if API key not set
        const results = items.map((it: any) => {
          const text = (it.remarks || '').toLowerCase();
          let category = 'COLD';
          let scoreModifier = 0;
          let explanation = 'Analisis catatan follow up prospek.';
          let recommendedAction = 'Hubungi kembali via WhatsApp GoApp.';

          if (text.includes('salah sambung') || text.includes('tidak aktif') || text.includes('batal') || text.includes('tidak berminat') || text.includes('spam')) {
            category = 'JUNK';
            scoreModifier = -50;
            explanation = 'Terdeteksi indikasi data kontak tidak valid atau prospek menolak.';
            recommendedAction = 'Arsipkan kontak dari database aktif.';
          } else if (text.includes('visit') || text.includes('survey') || text.includes('show unit') || text.includes('booking fee') || text.includes('spk')) {
            category = 'VISITED';
            scoreModifier = 30;
            explanation = 'Prospek telah survei unit atau masuk tahap komitmen booking.';
            recommendedAction = 'Kirimkan proposal unit dan draft SPK.';
          } else if (text.includes('kpa') || text.includes('inhouse') || text.includes('cicil') || text.includes('nego') || text.includes('serius') || text.includes('diskon')) {
            category = 'PROSPECT';
            scoreModifier = 20;
            explanation = 'Prospek aktif mendiskusikan skema finansial dan harga.';
            recommendedAction = 'Presentasikan perbandingan kalkulasi KPA Bank rekanan.';
          } else if (text.includes('brosur') || text.includes('pricelist') || text.includes('daftar harga') || text.includes('loft') || text.includes('soho')) {
            category = 'WARM';
            scoreModifier = 10;
            explanation = 'Prospek meminta informasi rincian produk dan harga.';
            recommendedAction = 'Kirimkan e-brochure lengkap dan video virtual tour.';
          }

          return {
            id: it.id,
            category,
            scoreModifier,
            explanation,
            recommendedAction,
          };
        });

        return res.json({ results });
      }

      const prompt = `
Anda adalah AI Lead Qualification Expert untuk proyek properti luxury Upper West di BSD City.
Analisis kumpulan catatan riwayat follow-up (History Remarks) dari prospek berikut.
Klasifikasikan masing-masing prospek ke dalam salah satu dari 5 kategori mutlak:
1. "VISITED" (Sudah survei fisik / datang ke Marketing Gallery BSD / lihat show unit / booking fee / siap SPK)
2. "PROSPECT" (Minat tinggi, negosiasi harga, minta simulasi KPA BCA/Mandiri, cicilan in-house, cocok budget)
3. "WARM" (Responsif, minta e-brochure, minta pricelist, tanya spesifikasi lantai/luas unit)
4. "COLD" (Tahap awal outreach, belum respon, pesan hanya dibaca, pasif)
5. "JUNK" (Salah sambung, nomor tidak aktif, batal, tidak berminat, bukan target market, spam)

Daftar Leads untuk dianalisis:
${items.map((it: any, idx: number) => `
[Item ${idx + 1}]
- ID: ${it.id}
- Nama: ${it.name}
- Unit: ${it.unit || '-'}
- Budget: ${it.budget || '-'}
- History Remarks: "${it.remarks || 'Tidak ada catatan'}"
`).join('\n')}

Kembalikan output DALAM FORMAT JSON VALID berupa array:
{
  "results": [
    {
      "id": "ID_LEAD",
      "category": "VISITED" | "PROSPECT" | "WARM" | "COLD" | "JUNK",
      "scoreModifier": 30 | 20 | 10 | 0 | -50,
      "detectedSignals": ["Sinyal 1", "Sinyal 2"],
      "explanation": "Alasan singkat penetapan kategori (1 kalimat)",
      "recommendedAction": "Rekomendasi tindak lanjut sales (1 kalimat)"
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{"results":[]}';
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error batch evaluating remarks with Gemini:', error);
      res.status(500).json({ error: error.message || 'Gagal menganalisis batch remarks' });
    }
  });

  // Serve static assets from public/ folder (logo, favicon, images)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Upper West CRM Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
