import React, { useState, useMemo } from 'react';
import { 
  Lead, 
  SalesAgent, 
  PipelineStage, 
  OmnichannelSource, 
  ScoringWeightsConfig, 
  GoAppWebhookLog,
  LeadCategory,
  FollowUpResolveStatus 
} from './types';
import { 
  INITIAL_LEADS, 
  MOCK_SALES_AGENTS, 
  MOCK_GOAPP_WEBHOOKS 
} from './data/mockData';
import { 
  calculateLeadScore, 
  DEFAULT_SCORING_WEIGHTS 
} from './services/leadScoring';
import { filterLeadsByWeek } from './utils/dateUtils';
import { Header } from './components/Header';
import { Sidebar, NavigationMenu } from './components/Sidebar';
import { CategorySummaryDashboard } from './components/CategorySummaryDashboard';
import { LeadTable } from './components/LeadTable';
import { KanbanBoard } from './components/KanbanBoard';
import { GoAppOmnichannelHub } from './components/GoAppOmnichannelHub';
import { AnalyticsView } from './components/AnalyticsView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { ScoringRulesModal } from './components/ScoringRulesModal';
import { AddLeadModal } from './components/AddLeadModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ConversationScorerModal } from './components/ConversationScorerModal';
import { WeeklyReportDashboard } from './components/WeeklyReportDashboard';
import { MonthlyReportDashboard } from './components/MonthlyReportDashboard';
import { SalesPerformanceDashboard } from './components/SalesPerformanceDashboard';
import { AdsSourceReportDashboard } from './components/AdsSourceReportDashboard';
import { DetailVisitedDashboard } from './components/DetailVisitedDashboard';
import { DigitalAdsResultDashboard } from './components/DigitalAdsResultDashboard';
import { UnifiedDigitalResultDashboard } from './components/UnifiedDigitalResultDashboard';
import { ReportLeadsDashboard } from './components/ReportLeadsDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessGateScreen } from './components/AccessGateScreen';
import { AccessManagementModal } from './components/AccessManagementModal';
import { 
  Bell, 
  Flame, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

function DashboardApp() {
  const [isAccessManagementOpen, setIsAccessManagementOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [salesAgents] = useState<SalesAgent[]>(MOCK_SALES_AGENTS);
  const [webhookLogs, setWebhookLogs] = useState<GoAppWebhookLog[]>(MOCK_GOAPP_WEBHOOKS);
  const [scoringWeights, setScoringWeights] = useState<ScoringWeightsConfig>(DEFAULT_SCORING_WEIGHTS);
  
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ALL');
  const [navigationMenu, setNavigationMenu] = useState<NavigationMenu>('dashboard');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<LeadCategory | 'ALL'>('ALL');

  // Main Dashboard Period & Weekly Filters
  const [dashboardMonth, setDashboardMonth] = useState<string>('2026-10');
  const [dashboardWeekId, setDashboardWeekId] = useState<string>('ALL');
  const [dashboardCustomStart, setDashboardCustomStart] = useState<string>('2026-10-01');
  const [dashboardCustomEnd, setDashboardCustomEnd] = useState<string>('2026-10-31');
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isScoringRulesOpen, setIsScoringRulesOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isConversationScorerOpen, setIsConversationScorerOpen] = useState(false);
  const [selectedLeadForScoring, setSelectedLeadForScoring] = useState<Lead | null>(null);

  const [notification, setNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'hot_upgrade' | 'new_message' | 'import_success';
    leadId?: string;
  } | null>(null);

  // Filter leads by selected sales agent
  const visibleLeads = leads.filter((lead) => {
    if (selectedAgentId === 'ALL') return true;
    return lead.assignedAgentId === selectedAgentId;
  });

  // Leads filtered by Dashboard's Month & Week selection
  const dashboardTimeFilteredLeads = useMemo(() => {
    return filterLeadsByWeek(
      visibleLeads,
      dashboardWeekId,
      dashboardCustomStart,
      dashboardCustomEnd,
      dashboardMonth
    );
  }, [visibleLeads, dashboardWeekId, dashboardCustomStart, dashboardCustomEnd, dashboardMonth]);

  const hotLeadsCount = visibleLeads.filter((l) => l.category === 'VISITED' || l.category === 'PROSPECT' || l.quality === 'HOT').length;
  const totalLeadsCount = visibleLeads.length;

  const visitedCount = visibleLeads.filter((l) => l.category === 'VISITED').length;
  const prospectCount = visibleLeads.filter((l) => l.category === 'PROSPECT').length;
  const warmCount = visibleLeads.filter((l) => l.category === 'WARM').length;
  const coldCount = visibleLeads.filter((l) => l.category === 'COLD').length;
  const junkCount = visibleLeads.filter((l) => l.category === 'JUNK').length;

  // Handle imported leads from Excel file with strict Single-Source Replacement option
  const handleImportLeads = (newLeads: Lead[], mode: 'REPLACE_MONTH' | 'APPEND' = 'REPLACE_MONTH') => {
    if (mode === 'REPLACE_MONTH' && newLeads.length > 0) {
      // Detect target month from the imported batch (checking first 10 rows)
      const sampleDates = newLeads.slice(0, 10).map((l) => (l.dateContact || '').toLowerCase());
      let detectedMonth: 'sep' | 'aug' | 'jul' | null = null;
      if (sampleDates.some((d) => d.includes('sep') || d.includes('-09-') || d.includes('/09/'))) detectedMonth = 'sep';
      else if (sampleDates.some((d) => d.includes('aug') || d.includes('-08-') || d.includes('/08/'))) detectedMonth = 'aug';
      else if (sampleDates.some((d) => d.includes('jul') || d.includes('-07-') || d.includes('/07/'))) detectedMonth = 'jul';

      setLeads((prev) => {
        if (!detectedMonth) {
          return [...newLeads, ...prev];
        }
        // Strict replacement: Purge all existing leads of this detected month completely!
        const withoutOldMonth = prev.filter((l) => {
          const d = (l.dateContact || '').toLowerCase();
          if (detectedMonth === 'sep') return !(d.includes('sep') || d.includes('-09-') || d.includes('/09/'));
          if (detectedMonth === 'aug') return !(d.includes('aug') || d.includes('-08-') || d.includes('/08/'));
          if (detectedMonth === 'jul') return !(d.includes('jul') || d.includes('-07-') || d.includes('/07/'));
          return true;
        });
        return [...newLeads, ...withoutOldMonth];
      });

      const monthName = detectedMonth === 'sep' ? 'September' : detectedMonth === 'aug' ? 'Agustus' : detectedMonth === 'jul' ? 'Juli' : 'Bulan Terpilih';

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setNotification({
        id: `notif-${Date.now()}`,
        title: '✅ Update Data Leads Berhasil!',
        message: `Data lama bulan ${monthName} telah dihapus bersih. Server kini menggunakan data 1 file terbaru (${newLeads.length} leads).`,
        type: 'import_success',
      });
    } else {
      setLeads((prev) => [...newLeads, ...prev]);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setNotification({
        id: `notif-${Date.now()}`,
        title: '✅ Import Excel Berhasil!',
        message: `Sebanyak ${newLeads.length} prospek (12 Variabel Penilaian) berhasil ditambahkan ke sistem.`,
        type: 'import_success',
      });
    }
    setNavigationMenu('dashboard');
  };

  // Recalculate all leads when weights change
  const handleSaveWeights = (newWeights: ScoringWeightsConfig) => {
    setScoringWeights(newWeights);
    setLeads((prev) =>
      prev.map((lead) => {
        const breakdown = calculateLeadScore(lead, newWeights);
        return {
          ...lead,
          score: breakdown.totalScore,
          scoreBreakdown: breakdown,
          quality: breakdown.qualityTier,
          category: breakdown.categoryTier,
        };
      })
    );
  };

  // Move Lead to another stage
  const handleMoveStage = (leadId: string, nextStage: PipelineStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, stage: nextStage } : null));
    }
  };

  // Reassign Sales Agent
  const handleReassignAgent = (leadId: string, agentId: string) => {
    const matchedAgent = salesAgents.find((a) => a.id === agentId);
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              assignedAgentId: agentId,
              assignedToName: matchedAgent?.name || l.assignedToName,
            }
          : l
      )
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              assignedAgentId: agentId,
              assignedToName: matchedAgent?.name || prev.assignedToName,
            }
          : null
      );
    }
  };

  // Update specific performance evaluation fields (12 variables)
  const handleUpdateLeadPerformance = (leadId: string, updatedFields: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const merged = { ...l, ...updatedFields };
        const breakdown = calculateLeadScore(merged, scoringWeights);
        return {
          ...merged,
          score: breakdown.totalScore,
          scoreBreakdown: breakdown,
          quality: breakdown.qualityTier,
          category: breakdown.categoryTier,
        };
      })
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => {
        if (!prev) return null;
        const merged = { ...prev, ...updatedFields };
        const breakdown = calculateLeadScore(merged, scoringWeights);
        return {
          ...merged,
          score: breakdown.totalScore,
          scoreBreakdown: breakdown,
          quality: breakdown.qualityTier,
          category: breakdown.categoryTier,
        };
      });
    }
  };

  // Update Resolve Status directly
  const handleUpdateResolveStatus = (leadId: string, status: FollowUpResolveStatus) => {
    handleUpdateLeadPerformance(leadId, { resolveStatus: status });
  };

  // Send message from detail modal drawer
  const handleSendMessage = (leadId: string, text: string, channel: OmnichannelSource = 'WHATSAPP') => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'SALES_AGENT' as const,
      senderName: 'Sales Agent',
      channel,
      message: text,
      timestamp: new Date().toISOString(),
    };
    
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          messages: [...(l.messages || []), newMsg],
          lastActivityAt: new Date().toISOString(),
        };
      })
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              messages: [...(prev.messages || []), newMsg],
              lastActivityAt: new Date().toISOString(),
            }
          : null
      );
    }
  };

  // Add internal note
  const handleAddNote = (leadId: string, note: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          notes: [note, ...(l.notes || [])],
        };
      })
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) =>
        prev ? { ...prev, notes: [note, ...(prev.notes || [])] } : null
      );
    }
  };

  // Add new lead manual form
  const handleAddLead = (newLeadData: Lead) => {
    setLeads((prev) => [newLeadData, ...prev]);
    setSelectedLead(newLeadData);
  };

  // Quick WhatsApp trigger
  const handleQuickWhatsApp = (lead: Lead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const greetingMsg = encodeURIComponent(
      `Halo Bapak/Ibu ${lead.name}, saya dari Marketing Gallery Upper West BSD City. Terkait minat Anda pada unit ${lead.preferredUnit}, ada yang bisa kami bantu?`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${greetingMsg}`, '_blank');
  };

  // Update AI Evaluation from lead detail modal
  const handleUpdateAIEvaluation = (leadId: string, customCategory: LeadCategory) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, category: customCategory } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, category: customCategory } : null));
    }
  };

  // Trigger simulated incoming message
  const handleTriggerSimulatedMessage = (
    leadId: string,
    messageText: string,
    channel: OmnichannelSource = 'WHATSAPP',
    eventType: 'INCOMING_MESSAGE' | 'SITE_VISIT_BOOKED' | 'CALL_COMPLETED' | 'BROCHURE_REQUEST' = 'INCOMING_MESSAGE'
  ) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const newWebhookLog: GoAppWebhookLog = {
      id: `wh-${Date.now()}`,
      eventType,
      channel,
      leadName: targetLead.name,
      summary: messageText,
      rawPayload: { message: messageText, source: channel },
      scoreImpact: 15,
      timestamp: new Date().toISOString(),
    };

    setWebhookLogs((prev) => [newWebhookLog, ...prev]);

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;

        const isSiteVisit = messageText.toLowerCase().includes('survey') || messageText.toLowerCase().includes('visit');
        const newActivity = {
          id: `act-${Date.now()}`,
          type: (isSiteVisit ? 'SITE_VISIT_REQUEST' : 'GOAPP_CHAT_MESSAGE') as any,
          title: isSiteVisit ? 'Booking Jadwal Visit' : 'Pesan Masuk',
          channel,
          description: `"${messageText.slice(0, 50)}..."`,
          pointsAdded: isSiteVisit ? 30 : 15,
          timestamp: new Date().toISOString(),
        };

        const newCustomerMsg = {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER' as const,
          senderName: targetLead.name,
          message: messageText,
          timestamp: new Date().toISOString(),
          channel,
        };

        const updatedActivities = [...(lead.activities || []), newActivity];
        const updatedMessages = [...(lead.messages || []), newCustomerMsg];
        const updatedStage = isSiteVisit && lead.stage === 'NEW' ? 'SITE_VISIT_SCHEDULED' : lead.stage;

        const draftUpdatedLead: Lead = {
          ...lead,
          activities: updatedActivities,
          messages: updatedMessages,
          stage: updatedStage,
          lastActivityAt: new Date().toISOString(),
        };

        const breakdown = calculateLeadScore(draftUpdatedLead, scoringWeights);
        const finalUpdatedLead = {
          ...draftUpdatedLead,
          score: breakdown.totalScore,
          scoreBreakdown: breakdown,
          quality: breakdown.qualityTier,
          category: breakdown.categoryTier,
        };

        if ((finalUpdatedLead.category === 'VISITED' || finalUpdatedLead.category === 'PROSPECT') && lead.category !== 'VISITED' && lead.category !== 'PROSPECT') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.5 },
          });
          setNotification({
            id: `notif-${Date.now()}`,
            title: `🏆 Lead Naik ke Kategori ${finalUpdatedLead.category}!`,
            message: `${targetLead.name} mencapai skor ${finalUpdatedLead.score}/100.`,
            type: 'hot_upgrade',
            leadId: targetLead.id,
          });
        } else {
          setNotification({
            id: `notif-${Date.now()}`,
            title: '📩 Pesan Masuk Prospek',
            message: `${targetLead.name}: "${messageText.slice(0, 60)}..." (Skor: ${finalUpdatedLead.score})`,
            type: 'new_message',
            leadId: targetLead.id,
          });
        }

        return finalUpdatedLead;
      })
    );
  };

  // Random simulation
  const handleRandomSimulation = () => {
    const candidateLeads = leads.filter((l) => l.category !== 'VISITED');
    const target = candidateLeads.length > 0 ? candidateLeads[0] : leads[0];
    if (target) {
      handleTriggerSimulatedMessage(
        target.id,
        `Halo sales Upper West, saya sudah siap survey show unit Sabtu ini jam 14:00 WIB dan mau lihat simulasi KPA Mandiri.`,
        'WHATSAPP',
        'SITE_VISIT_BOOKED'
      );
    }
  };

  return (
    <div id="upper-west-app-root" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header */}
      <Header
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        salesAgents={salesAgents}
        onOpenAccessManagement={() => setIsAccessManagementOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAddLead={() => setIsAddLeadOpen(true)}
        onOpenExcelImport={() => setIsExcelImportOpen(true)}
        onOpenScoringRules={() => setIsScoringRulesOpen(true)}
        onTriggerSimulation={handleRandomSimulation}
        hotLeadsCount={hotLeadsCount}
        totalLeadsCount={totalLeadsCount}
      />

      {/* Main Container with Left Sidebar Navigation */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          activeMenu={navigationMenu}
          setActiveMenu={setNavigationMenu}
          onOpenAccessManagement={() => setIsAccessManagementOpen(true)}
          onOpenAddLead={() => setIsAddLeadOpen(true)}
          onOpenExcelImport={() => setIsExcelImportOpen(true)}
          onOpenScoringRules={() => setIsScoringRulesOpen(true)}
          onTriggerSimulation={handleRandomSimulation}
          hotLeadsCount={hotLeadsCount}
          totalLeadsCount={totalLeadsCount}
          visitedCount={visitedCount}
          prospectCount={prospectCount}
          warmCount={warmCount}
          coldCount={coldCount}
          junkCount={junkCount}
          selectedCategoryFilter={activeCategoryFilter}
          onFilterByCategory={setActiveCategoryFilter}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 flex flex-col space-y-5">
          
          {/* Floating Notification Toast */}
          {notification && (
            <div
              id="app-notification-toast"
              onClick={() => {
                if (notification.leadId) {
                  const matched = leads.find((l) => l.id === notification.leadId);
                  if (matched) setSelectedLead(matched);
                }
                setNotification(null);
              }}
              className="bg-white border border-amber-500/50 p-3.5 rounded-xl shadow-md flex items-center justify-between cursor-pointer hover:border-amber-500 transition-all animate-bounce"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  {notification.type === 'hot_upgrade' ? (
                    <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                  ) : notification.type === 'import_success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{notification.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">{notification.message}</p>
                </div>
              </div>
              {notification.leadId && (
                <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
                  Lihat Prospek <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          )}

          {/* View 1: Main Dashboard */}
          {navigationMenu === 'dashboard' && (
            <div className="space-y-5">
              {/* 5-Tier Category Interactive Cards */}
              <CategorySummaryDashboard
                leads={visibleLeads}
                onOpenExcelImport={() => setIsExcelImportOpen(true)}
                activeCategoryFilter={activeCategoryFilter}
                onFilterByCategory={setActiveCategoryFilter}
                onSelectLead={setSelectedLead}
                selectedMonth={dashboardMonth}
                onMonthChange={setDashboardMonth}
                selectedWeekId={dashboardWeekId}
                onWeekChange={setDashboardWeekId}
                customStartDate={dashboardCustomStart}
                customEndDate={dashboardCustomEnd}
                onCustomDateChange={(s, e) => {
                  setDashboardCustomStart(s);
                  setDashboardCustomEnd(e);
                }}
              />

              {/* High Quality Leads (12 Variables Performance Evaluation) Table */}
              <LeadTable
                leads={dashboardTimeFilteredLeads}
                salesAgents={salesAgents}
                onSelectLead={setSelectedLead}
                onQuickWhatsApp={handleQuickWhatsApp}
                onMoveStage={handleMoveStage}
                onUpdateResolveStatus={handleUpdateResolveStatus}
                onUpdateLeadPerformance={handleUpdateLeadPerformance}
                onOpenExcelImport={() => setIsExcelImportOpen(true)}
                onOpenAddLead={() => setIsAddLeadOpen(true)}
                onOpenScoringModal={(lead) => {
                  setSelectedLeadForScoring(lead || null);
                  setIsConversationScorerOpen(true);
                }}
                activeCategoryFilter={activeCategoryFilter}
                onFilterByCategory={setActiveCategoryFilter}
              />
            </div>
          )}

          {/* View: Result Digital (Consolidated Table & Campaign Source Report) */}
          {(navigationMenu === 'result_digital' || navigationMenu === 'digital_ads_result' || navigationMenu === 'ads_source_report') && (
            <UnifiedDigitalResultDashboard
              leads={leads}
              salesAgents={salesAgents}
              onSelectLead={setSelectedLead}
            />
          )}

          {/* View: Report leads (Consolidated Weekly & Monthly Reports) */}
          {(navigationMenu === 'report_leads' || navigationMenu === 'weekly_report' || navigationMenu === 'monthly_report') && (
            <ReportLeadsDashboard
              leads={visibleLeads}
              salesAgents={salesAgents}
              onSelectLead={setSelectedLead}
              onOpenScoringModal={(lead) => {
                setSelectedLeadForScoring(lead || null);
                setIsConversationScorerOpen(true);
              }}
            />
          )}

          {/* View: Sales Performance Dashboard (Performa Sales) */}
          {navigationMenu === 'sales_performance' && (
            <SalesPerformanceDashboard
              leads={visibleLeads}
              salesAgents={salesAgents}
              onSelectLead={setSelectedLead}
            />
          )}

          {/* View: Detail Visited Dashboard */}
          {navigationMenu === 'detail_visited' && (
            <DetailVisitedDashboard
              onSelectLeadName={(name) => {
                const target = name.toLowerCase().trim();
                const cleanTarget = target.replace(/[^\w\s]/g, '').trim();
                
                // Phase 1: Exact match
                let matchedLead = leads.find((l) => {
                  const ln = l.name.toLowerCase().trim();
                  return ln === target || (cleanTarget.length > 2 && cleanTarget === ln.replace(/[^\w\s]/g, '').trim());
                });

                // Phase 2: Token match (e.g. 'Ernest' in 'Succesfull / Ernest')
                if (!matchedLead) {
                  matchedLead = leads.find((l) => {
                    const ln = l.name.toLowerCase().trim();
                    const targetTokens = target.split(/[\s/,-]+/).filter((t) => t.length >= 3);
                    const lnTokens = ln.split(/[\s/,-]+/).filter((t) => t.length >= 3);
                    return targetTokens.some((t) => lnTokens.includes(t));
                  });
                }

                if (matchedLead) setSelectedLead(matchedLead);
              }}
            />
          )}

          {/* View 5, 6, 7: Omnichannel Hub */}
          {(navigationMenu === 'whatsapp_logs' || navigationMenu === 'email_matrix' || navigationMenu === 'social_directs') && (
            <div className="space-y-4">
              <GoAppOmnichannelHub
                leads={leads}
                webhookLogs={webhookLogs}
                onTriggerSimulatedMessage={handleTriggerSimulatedMessage}
                onSelectLead={setSelectedLead}
              />
            </div>
          )}

        </main>
      </div>

      {/* Modal: Lead Detail & Omnichannel Chat Drawer */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          salesAgents={salesAgents}
          onClose={() => setSelectedLead(null)}
          onUpdateStage={handleMoveStage}
          onReassignAgent={handleReassignAgent}
          onSendMessage={handleSendMessage}
          onAddNote={handleAddNote}
          onUpdateAIEvaluation={handleUpdateAIEvaluation}
          onUpdateLeadPerformance={handleUpdateLeadPerformance}
        />
      )}

      {/* Modal: Excel Lead Import & Automatic Scoring */}
      {isExcelImportOpen && (
        <ExcelImportModal
          onClose={() => setIsExcelImportOpen(false)}
          onImportLeads={handleImportLeads}
          salesAgents={salesAgents}
        />
      )}

      {/* Modal: Scoring Rules Configurator */}
      {isScoringRulesOpen && (
        <ScoringRulesModal
          weights={scoringWeights}
          onClose={() => setIsScoringRulesOpen(false)}
          onSaveWeights={handleSaveWeights}
        />
      )}

      {/* Modal: Add New Lead */}
      {isAddLeadOpen && (
        <AddLeadModal
          salesAgents={salesAgents}
          onClose={() => setIsAddLeadOpen(false)}
          onAddLead={handleAddLead}
        />
      )}

      {/* Modal: Conversation & Lead Quality Scorer */}
      {isConversationScorerOpen && (
        <ConversationScorerModal
          isOpen={isConversationScorerOpen}
          onClose={() => {
            setIsConversationScorerOpen(false);
            setSelectedLeadForScoring(null);
          }}
          leads={leads}
          selectedLeadForScoring={selectedLeadForScoring}
          onApplyScoreToLead={(leadId, updatedData) => {
            handleUpdateLeadPerformance(leadId, updatedData);
          }}
        />
      )}

      {/* Modal: Owner Access Control / ACC Izin Pengguna */}
      {isAccessManagementOpen && (
        <AccessManagementModal
          isOpen={isAccessManagementOpen}
          onClose={() => setIsAccessManagementOpen(false)}
        />
      )}

      {/* Modal: Login Khusus Owner */}
      {isLoginModalOpen && (
        <AccessGateScreen
          isModal={true}
          defaultTab="OWNER"
          onClose={() => setIsLoginModalOpen(false)}
          onSuccessApproved={() => setIsLoginModalOpen(false)}
        />
      )}

    </div>
  );
}

function AuthGate() {
  // Direct public access: External visitors & team can view the dashboard immediately without login barrier
  return <DashboardApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
