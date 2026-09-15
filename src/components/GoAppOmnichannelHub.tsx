import React, { useState } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  MessageCircle, 
  Instagram, 
  Globe, 
  Phone, 
  Mail, 
  Sparkles, 
  Activity, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  Send, 
  RefreshCw,
  Clock,
  Flame,
  Layers,
  Settings
} from 'lucide-react';
import { Lead, OmnichannelSource, GoAppWebhookLog } from '../types';

interface GoAppOmnichannelHubProps {
  leads: Lead[];
  webhookLogs: GoAppWebhookLog[];
  onTriggerSimulatedMessage: (leadId: string, message: string, channel: OmnichannelSource, eventType?: any) => void;
  onSelectLead: (lead: Lead) => void;
}

export const GoAppOmnichannelHub: React.FC<GoAppOmnichannelHubProps> = ({
  leads,
  webhookLogs,
  onTriggerSimulatedMessage,
  onSelectLead,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [customMsg, setCustomMsg] = useState('');
  const [simChannel, setSimChannel] = useState<OmnichannelSource>('WHATSAPP');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const channels = [
    {
      name: 'WhatsApp Business API',
      channel: 'WHATSAPP' as OmnichannelSource,
      icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
      status: 'Connected',
      uptime: '99.98%',
      activeConvs: 24,
      avgResponse: '3.8 menit',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Instagram Direct Graph',
      channel: 'INSTAGRAM' as OmnichannelSource,
      icon: <Instagram className="w-4 h-4 text-pink-600" />,
      status: 'Connected',
      uptime: '99.95%',
      activeConvs: 12,
      avgResponse: '6.2 menit',
      badgeBg: 'bg-pink-50 text-pink-800 border-pink-200',
    },
    {
      name: 'Website Live & Tracker',
      channel: 'WEBSITE' as OmnichannelSource,
      icon: <Globe className="w-4 h-4 text-blue-600" />,
      status: 'Connected',
      uptime: '100%',
      activeConvs: 38,
      avgResponse: 'Instant Webhook',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      name: 'GoApp Cloud Voice PBX',
      channel: 'PHONE_CALL' as OmnichannelSource,
      icon: <Phone className="w-4 h-4 text-amber-600" />,
      status: 'Connected',
      uptime: '99.90%',
      activeConvs: 6,
      avgResponse: '12 detik',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      name: 'Corporate Inbound Email',
      channel: 'EMAIL' as OmnichannelSource,
      icon: <Mail className="w-4 h-4 text-indigo-600" />,
      status: 'Connected',
      uptime: '99.99%',
      activeConvs: 15,
      avgResponse: '28 menit',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
  ];

  const handleSimulatePrebuilt = (type: 'site_visit' | 'high_budget' | 'fast_reply') => {
    const targetLead = leads.find((l) => l.id === selectedLeadId) || leads[0];
    if (!targetLead) return;

    if (type === 'site_visit') {
      onTriggerSimulatedMessage(
        targetLead.id,
        `Halo sales Upper West, saya tertarik sekali dengan ${targetLead.preferredUnit}. Apakah hari Sabtu ini bisa booking jadwal show unit tour jam 14:00 WIB?`,
        'WHATSAPP',
        'SITE_VISIT_BOOKED'
      );
    } else if (type === 'high_budget') {
      onTriggerSimulatedMessage(
        targetLead.id,
        `Selamat siang, kami dari family office ingin konfirmasi pembayaran tunai keras (Hard Cash) untuk unit ${targetLead.preferredUnit}. Tolong siapkan draft SPK.`,
        'WHATSAPP',
        'INCOMING_MESSAGE'
      );
    } else {
      onTriggerSimulatedMessage(
        targetLead.id,
        `Terima kasih atas brosur yang dikirimkan. Saya sudah pelajari spesifikasi ceiling mezzanine 5.8m. Sangat bagus!`,
        'INSTAGRAM',
        'INCOMING_MESSAGE'
      );
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim() || !selectedLeadId) return;
    onTriggerSimulatedMessage(selectedLeadId, customMsg.trim(), simChannel, 'INCOMING_MESSAGE');
    setCustomMsg('');
  };

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3500);
  };

  return (
    <div id="goapp-omnichannel-hub" className="space-y-4">
      {/* Header Banner - High Density Dark Slate */}
      <div className="bg-[#0F172A] border border-slate-800 text-white rounded-lg p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  GoApp Omnichannel Gateway Integration
                </h2>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                  ACTIVE SYNC
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Mengintegrasikan seluruh komunikasi prospek (WhatsApp, Instagram, Web, Telepon) langsung ke penilaian skor otomatis sales Upper West.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
            <div>
              <span className="text-[9px] text-slate-400 uppercase">Webhook Ingest</span>
              <p className="text-xs font-bold text-white leading-tight">48 ms</p>
            </div>
            <div className="h-5 w-px bg-slate-700" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase">Interaksi</span>
              <p className="text-xs font-bold text-emerald-400 leading-tight">2,419 synced</p>
            </div>
          </div>
        </div>
      </div>

      {/* Omnichannel Channel Gateway Grid */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          Status Saluran Komunikasi GoApp
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {channels.map((ch, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-slate-200 p-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded bg-slate-100 border border-slate-200">
                    {ch.icon}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${ch.badgeBg}`}>
                    <span className="w-1 h-1 rounded-full bg-emerald-600" />
                    {ch.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">{ch.name}</h4>
                <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="text-slate-800 font-semibold">{ch.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Respon:</span>
                    <span className="text-slate-800 font-semibold">{ch.avgResponse}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                <span>Aktif di CRM:</span>
                <span className="font-bold text-slate-900">{ch.activeConvs} Leads</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Live Webhook Stream & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Interactive GoApp Event Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Simulasi Interaksi Pelanggan GoApp
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Uji bagaimana pesan masuk dari WhatsApp / Instagram secara otomatis menghitung ulang skor kualitas lead secara instan!
            </p>

            {/* Quick Trigger Buttons */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] font-bold uppercase text-slate-400">Skenario Instan:</span>
              
              <button
                onClick={() => handleSimulatePrebuilt('site_visit')}
                className="w-full text-left bg-purple-50 hover:bg-purple-100/80 border border-purple-200 p-2 rounded text-xs text-slate-800 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-purple-900 flex items-center gap-1 text-[11px]">
                    <Flame className="w-3 h-3 fill-purple-700 text-purple-700" />
                    <span>Request Show Unit Visit (+22 Pts)</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Pelanggan minta jadwal survey showroom Upper West Sabtu ini
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-700 shrink-0 ml-1.5" />
              </button>

              <button
                onClick={() => handleSimulatePrebuilt('high_budget')}
                className="w-full text-left bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 p-2 rounded text-xs text-slate-800 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                    <Zap className="w-3 h-3 text-emerald-700" />
                    <span>Konfirmasi Hard Cash Closing (+15 Pts)</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Pelanggan konfirmasi kesiapan transfer SPK & minta draft penawaran
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-1.5" />
              </button>

              <button
                onClick={() => handleSimulatePrebuilt('fast_reply')}
                className="w-full text-left bg-blue-50 hover:bg-blue-100/80 border border-blue-200 p-2 rounded text-xs text-slate-800 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-blue-900 flex items-center gap-1 text-[11px]">
                    <MessageCircle className="w-3 h-3 text-blue-700" />
                    <span>Respon Antusias E-Brochure (+12 Pts)</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Pelanggan membalas cepat via Instagram DM menanyakan mezzanine
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-700 shrink-0 ml-1.5" />
              </button>
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleCustomSubmit} className="space-y-2 pt-2.5 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400">Atau Tulis Pesan Kustom:</span>
              
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Pilih Prospek:</label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-[11px] text-slate-900"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.quality})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Channel:</label>
                  <select
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value as OmnichannelSource)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-[11px] text-slate-900"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="INSTAGRAM">Instagram DM</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE_CALL">Telepon Voice</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Contoh: Halo sales, bisa kirimkan skema KPA Bank BCA untuk tipe Penthouse?"
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
              />

              <button
                type="submit"
                disabled={!customMsg.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs py-1.5 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Kirim & Hitung Skor Otomatis</span>
              </button>
            </form>
          </div>

          {/* Quick Broadcast Widget */}
          <div className="mt-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[10px]">Drip Broadcast GoApp:</span>
              <button
                onClick={handleSendBroadcast}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded border border-slate-300 cursor-pointer font-semibold"
              >
                {broadcastSent ? '✓ Broadcast Terkirim ke 14 Leads' : '📢 Broadcast Promo Upper West'}
              </button>
            </div>
          </div>
        </div>

        {/* Live GoApp Webhook Feed (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-3.5 flex flex-col h-full shadow-2xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Omnichannel Webhook Logs (GoApp Stream)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Auto-Polling Active
            </span>
          </div>

          {/* Webhook Log List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px] scrollbar-thin">
            {webhookLogs.map((log) => {
              const matchedLead = leads.find((l) => l.name === log.leadName);

              return (
                <div
                  key={log.id}
                  onClick={() => matchedLead && onSelectLead(matchedLead)}
                  className="bg-slate-50 hover:bg-slate-100/90 p-2.5 rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase font-mono border ${
                        log.channel === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        log.channel === 'INSTAGRAM' ? 'bg-pink-50 text-pink-800 border-pink-200' :
                        log.channel === 'EMAIL' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {log.channel}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{log.leadName}</span>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                      +{log.scoreImpact} Score Pts
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mb-1 leading-snug">{log.summary}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Event: {log.eventType}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
