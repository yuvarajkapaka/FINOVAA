import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import FinancialWorld from './components/FinancialWorld';
import MetricCards from './components/MetricCards';
import TransactionLedger from './components/TransactionLedger';
import ActionModal from './components/ActionModal';
import NotificationBanner from './components/NotificationBanner';
import EducationalInsight from './components/EducationalInsight';
import SavingsGoalsSection from './components/SavingsGoalsSection';
import GoalModal from './components/GoalModal';
import DeleteGoalModal from './components/DeleteGoalModal';
import AcademyView from './components/AcademyView';
import LessonDetailModal from './components/LessonDetailModal';
import MarketplaceView from './components/MarketplaceView';
import TradeModal from './components/TradeModal';
import SimulationView from './components/SimulationView';
import ScoreDashboardView from './components/ScoreDashboardView';
import MentorView from './components/MentorView';
import YourNextMove from './components/YourNextMove';
import PlayerProfileModal from './components/PlayerProfileModal';
import FinancialEventsModal from './components/FinancialEventsModal';
import AmbientBackground from './components/AmbientBackground';
import FinovaLogo from './components/FinovaLogo';
import Footer from './components/Footer';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from './api/config';

export default function App() {
  // Navigation states: 'WORLD' (default) | 'WALLET' | 'SAVINGS' | 'ACADEMY' | 'MARKET' | 'SIMULATION' | 'SCORE' | 'MENTOR' | 'OVERVIEW'
  const [activeTab, setActiveTab] = useState('WORLD');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(null);
  const [goalsData, setGoalsData] = useState(null);
  const [goalCategories, setGoalCategories] = useState([]);

  // Academy state
  const [lessonsData, setLessonsData] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // Market & Portfolio state
  const [marketData, setMarketData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isAdvancingCycle, setIsAdvancingCycle] = useState(false);
  const [tradeModalState, setTradeModalState] = useState({
    isOpen: false,
    mode: 'BUY',
    asset: null,
    holding: null
  });

  // Financial Literacy Score state
  const [literacyScore, setLiteracyScore] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Wallet Action Modal State
  const [walletModalState, setWalletModalState] = useState({
    isOpen: false,
    actionType: 'INCOME'
  });

  // Goal Modal State
  const [goalModalState, setGoalModalState] = useState({
    isOpen: false,
    mode: 'CREATE',
    goal: null
  });

  // Delete Goal Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    goal: null
  });

  // Toast Notification State
  const [notification, setNotification] = useState(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    setFetchError(null);

    try {
      const [walletRes, txRes, catRes, goalsRes, goalCatRes, academyRes, marketRes, portfolioRes, scoreRes] = await Promise.all([
        apiFetch('/api/wallet'),
        apiFetch('/api/transactions?limit=50'),
        apiFetch('/api/wallet/categories'),
        apiFetch('/api/goals'),
        apiFetch('/api/goals/categories'),
        apiFetch('/api/academy/lessons'),
        apiFetch('/api/marketplace/assets'),
        apiFetch('/api/portfolio'),
        apiFetch('/api/score')
      ]);

      if (!walletRes.ok) throw new Error(`Failed to load wallet data (${walletRes.status})`);
      if (!txRes.ok) throw new Error(`Failed to load transactions (${txRes.status})`);
      if (!goalsRes.ok) throw new Error(`Failed to load savings goals (${goalsRes.status})`);
      if (!academyRes.ok) throw new Error(`Failed to load academy lessons (${academyRes.status})`);

      const walletData = await walletRes.json();
      const txData = await txRes.json();
      const catData = catRes.ok ? await catRes.json() : null;
      const goalsDataPayload = await goalsRes.json();
      const goalCatPayload = goalCatRes.ok ? await goalCatRes.json() : null;
      const academyDataPayload = await academyRes.json();
      const marketDataPayload = marketRes.ok ? await marketRes.json() : null;
      const portfolioDataPayload = portfolioRes.ok ? await portfolioRes.json() : null;
      const scoreDataPayload = scoreRes.ok ? await scoreRes.json() : null;

      setWallet(walletData);
      setTransactions(txData.transactions || []);
      if (catData) setCategories(catData);
      setGoalsData(goalsDataPayload);
      if (goalCatPayload) setGoalCategories(goalCatPayload.categories || []);
      setLessonsData(academyDataPayload);
      if (marketDataPayload) setMarketData(marketDataPayload);
      if (portfolioDataPayload) setPortfolioData(portfolioDataPayload);
      if (scoreDataPayload?.success) setLiteracyScore(scoreDataPayload.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setFetchError(err.message || 'Unable to connect to FINOVA backend server.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Wallet action handlers
  const handleOpenWalletAction = (actionType) => {
    setWalletModalState({ isOpen: true, actionType });
  };

  const handleCloseWalletModal = () => {
    setWalletModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Goal action handlers
  const handleOpenCreateGoal = () => {
    setGoalModalState({ isOpen: true, mode: 'CREATE', goal: null });
  };

  const handleOpenEditGoal = (goal) => {
    setGoalModalState({ isOpen: true, mode: 'EDIT', goal });
  };

  const handleOpenContributeGoal = (goal) => {
    setGoalModalState({ isOpen: true, mode: 'CONTRIBUTE', goal });
  };

  const handleOpenWithdrawGoal = (goal) => {
    setGoalModalState({ isOpen: true, mode: 'WITHDRAW', goal });
  };

  const handleOpenDeleteGoal = (goal) => {
    setDeleteModalState({ isOpen: true, goal });
  };

  // Trade action handlers
  const handleOpenTrade = (mode, asset, holding = null) => {
    if (!asset) return;

    const normalizedMode = String(mode).toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
    const targetAssetId = Number(asset.asset_id || asset.id);

    const canonicalAsset = marketData?.assets?.find(a => a.id === targetAssetId) || asset;
    const canonicalHolding = holding || portfolioData?.holdings?.find(h => h.asset_id === targetAssetId) || null;

    setTradeModalState({
      isOpen: true,
      mode: normalizedMode,
      asset: canonicalAsset,
      holding: canonicalHolding
    });
  };

  const handleAdvanceCycle = async () => {
    setIsAdvancingCycle(true);
    try {
      const res = await apiFetch('/api/marketplace/advance', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to advance market cycle.');
      }
      setNotification({
        type: 'success',
        message: `Simulation advanced to Cycle #${data.cycle.current_cycle}! Deterministic asset quotes updated.`
      });
      await loadData(true);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Error advancing market cycle.'
      });
    } finally {
      setIsAdvancingCycle(false);
    }
  };

  const handleActionSuccess = (message) => {
    setNotification({ type: 'success', message });
    loadData(true);
  };

  // Real strategic mission progress calculation from underlying state
  const emergencyGoal = goalsData?.goals?.find(g => g.is_emergency_fund);
  const emergencyCoverageMonths = emergencyGoal?.target_paise > 0 
    ? ((emergencyGoal.current_paise / emergencyGoal.target_paise) * 6)
    : 0;
  const completedLessonsCount = lessonsData?.progress?.completed_lessons_count || 0;
  const holdingsCount = portfolioData?.holdings?.length || 0;
  const decisionScore = literacyScore?.breakdown?.decision_making?.score || 0;
  const totalScore = literacyScore?.total_score || 0;

  const m1 = emergencyCoverageMonths >= 3.0;
  const m2 = completedLessonsCount >= 1;
  const m3 = holdingsCount > 0;
  const m4 = decisionScore >= 3.0;
  const m5 = totalScore >= 40.0;
  const completedMissionsCount = [m1, m2, m3, m4, m5].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans selection:bg-copper selection:text-white relative overflow-x-hidden">
      {/* Premium Multi-Layer Ambient Background Layer (Zero interaction interference) */}
      <AmbientBackground activeTab={activeTab} />

      {/* Main Content Stacking Container */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Contextual Game HUD Header */}
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          wallet={wallet}
          literacyScore={literacyScore}
          completedMissionsCount={completedMissionsCount}
          totalMissionsCount={5}
          onOpenProfile={() => setIsProfileOpen(true)}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
          {/* Error State Banner */}
          {fetchError && (
            <div className="p-4 rounded-2xl bg-neg/10 border border-neg/30 text-neg text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-neg flex-shrink-0" />
                <div>
                  <p className="font-semibold text-neg">Backend Connection Notice</p>
                  <p className="text-ink-muted text-[11px] mt-0.5">{fetchError}</p>
                </div>
              </div>
              <button
                onClick={() => loadData(false)}
                className="px-3 py-1.5 rounded-xl bg-canvas-white hover:bg-canvas-subtle text-neg border border-neg/30 text-xs font-semibold transition"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Loading Skeleton with Official FINOVA Brand Mark */}
          {loading && !wallet ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4 text-ink-muted">
              <div className="animate-pulse">
                <FinovaLogo size="lg" showSubtitle={false} />
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-ink-muted">
                <Loader2 className="w-4 h-4 animate-spin text-forest" />
                <span>Synchronizing Economic Simulation State...</span>
              </div>
            </div>
          ) : (
          <div key={activeTab} className="page-enter">
            {activeTab === 'WORLD' ? (
              /* ================= VIEW 1: FINANCIAL WORLD (PRIMARY GAME EXPERIENCE) ================= */
              <FinancialWorld
                wallet={wallet}
                goalsData={goalsData}
                portfolioData={portfolioData}
                lessonsData={lessonsData}
                literacyScore={literacyScore}
                onNavigateTab={setActiveTab}
                onSelectLesson={setSelectedLessonId}
                onOpenAction={handleOpenWalletAction}
                onOpenCreateGoal={handleOpenCreateGoal}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenEvents={() => setIsEventsModalOpen(true)}
              />
            ) : activeTab === 'WALLET' ? (
              /* ================= VIEW 2: CAPITAL & CASH FLOW ================= */
              <div className="space-y-6">
                <MetricCards 
                  wallet={wallet} 
                  portfolioData={portfolioData}
                  literacyScore={literacyScore}
                  onOpenAction={handleOpenWalletAction}
                  onNavigateTab={setActiveTab}
                />
                <EducationalInsight wallet={wallet} />
                <TransactionLedger
                  transactions={transactions}
                  loading={isRefreshing && transactions.length === 0}
                  onOpenAction={handleOpenWalletAction}
                />
              </div>
            ) : activeTab === 'SAVINGS' ? (
              /* ================= VIEW 3: SAVINGS & RESERVES ================= */
              <div className="space-y-6">
                <SavingsGoalsSection
                  goalsData={goalsData}
                  onOpenCreateGoal={handleOpenCreateGoal}
                  onOpenEditGoal={handleOpenEditGoal}
                  onOpenContributeGoal={handleOpenContributeGoal}
                  onOpenWithdrawGoal={handleOpenWithdrawGoal}
                  onDeleteGoal={handleOpenDeleteGoal}
                />
              </div>
            ) : activeTab === 'ACADEMY' ? (
              /* ================= VIEW 4: KNOWLEDGE CENTER (ACADEMY) ================= */
              <AcademyView
                lessonsData={lessonsData}
                onSelectLesson={setSelectedLessonId}
                loading={isRefreshing && !lessonsData}
              />
            ) : activeTab === 'MARKET' ? (
              /* ================= VIEW 5: INVESTMENT EXCHANGE ================= */
              <MarketplaceView
                marketData={marketData}
                portfolioData={portfolioData}
                onOpenTrade={handleOpenTrade}
                onAdvanceCycle={handleAdvanceCycle}
                isAdvancingCycle={isAdvancingCycle}
                onActivityRecorded={() => loadData(true)}
              />
            ) : activeTab === 'SIMULATION' ? (
              /* ================= VIEW 6: DECISION LAB (LIFE SIMULATOR) ================= */
              <SimulationView
                wallet={wallet}
                goalsData={goalsData}
                portfolioData={portfolioData}
                onOpenEvents={() => setIsEventsModalOpen(true)}
              />
            ) : activeTab === 'SCORE' ? (
              /* ================= VIEW 7: FINANCIAL PROGRESS (LITERACY SCORE) ================= */
              <ScoreDashboardView
                onNavigateTab={setActiveTab}
              />
            ) : activeTab === 'MENTOR' ? (
              /* ================= VIEW 8: AI FINANCIAL MENTOR ================= */
              <MentorView
                wallet={wallet}
                portfolio={portfolioData}
                scoreData={literacyScore}
              />
            ) : (
              /* ================= VIEW 9: FINANCIAL OVERVIEW (SECONDARY DASHBOARD) ================= */
              <div className="space-y-6">
                <MetricCards 
                  wallet={wallet} 
                  portfolioData={portfolioData}
                  literacyScore={literacyScore}
                  onOpenAction={handleOpenWalletAction}
                  onNavigateTab={setActiveTab}
                />
                <EducationalInsight wallet={wallet} />
                <YourNextMove
                  wallet={wallet}
                  goalsData={goalsData}
                  portfolioData={portfolioData}
                  lessonsData={lessonsData}
                  literacyScore={literacyScore}
                  onNavigateTab={setActiveTab}
                  onSelectLesson={setSelectedLessonId}
                  onOpenAction={handleOpenWalletAction}
                  onOpenCreateGoal={handleOpenCreateGoal}
                />
                <SavingsGoalsSection
                  goalsData={goalsData}
                  onOpenCreateGoal={handleOpenCreateGoal}
                  onOpenEditGoal={handleOpenEditGoal}
                  onOpenContributeGoal={handleOpenContributeGoal}
                  onOpenWithdrawGoal={handleOpenWithdrawGoal}
                  onDeleteGoal={handleOpenDeleteGoal}
                />
                <TransactionLedger
                  transactions={transactions}
                  loading={isRefreshing && transactions.length === 0}
                  onOpenAction={handleOpenWalletAction}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Wallet Action Modal */}
      <ActionModal
        isOpen={walletModalState.isOpen}
        actionType={walletModalState.actionType}
        onClose={handleCloseWalletModal}
        wallet={wallet}
        categories={categories}
        onSuccess={handleActionSuccess}
      />

      {/* Goal Action Modal */}
      <GoalModal
        isOpen={goalModalState.isOpen}
        mode={goalModalState.mode}
        goal={goalModalState.goal}
        wallet={wallet}
        categories={goalCategories}
        onClose={() => setGoalModalState(prev => ({ ...prev, isOpen: false }))}
        onSuccess={handleActionSuccess}
      />

      {/* Delete Goal Modal */}
      <DeleteGoalModal
        isOpen={deleteModalState.isOpen}
        goal={deleteModalState.goal}
        onClose={() => setDeleteModalState({ isOpen: false, goal: null })}
        onSuccess={handleActionSuccess}
      />

      {/* Trade Modal for Investments */}
      <TradeModal
        isOpen={tradeModalState.isOpen}
        mode={tradeModalState.mode}
        asset={tradeModalState.asset}
        holding={tradeModalState.holding}
        wallet={wallet}
        onClose={() => setTradeModalState({ isOpen: false, mode: 'BUY', asset: null, holding: null })}
        onSuccess={handleActionSuccess}
      />

      {/* Lesson Detail and Quiz Modal */}
      <LessonDetailModal
        isOpen={Boolean(selectedLessonId)}
        lessonId={selectedLessonId}
        onClose={() => setSelectedLessonId(null)}
        onSuccess={handleActionSuccess}
      />

      {/* Player Profile & Milestones Modal */}
      <PlayerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        wallet={wallet}
        goalsData={goalsData}
        portfolioData={portfolioData}
        lessonsData={lessonsData}
        literacyScore={literacyScore}
        onNavigateTab={setActiveTab}
      />

      {/* Interactive Financial Events & Dilemmas Modal */}
      <FinancialEventsModal
        isOpen={isEventsModalOpen}
        onClose={() => setIsEventsModalOpen(false)}
        wallet={wallet}
        goalsData={goalsData}
        portfolioData={portfolioData}
        onCompleteEvent={() => loadData(true)}
      />

      {/* Toast Feedback Notification */}
      <NotificationBanner
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {/* Global Responsive Premium Footer */}
      <Footer onNavigateTab={setActiveTab} />
      </div>
    </div>
  );
}
