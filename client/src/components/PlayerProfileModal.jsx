import React from 'react';
import { 
  X, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  BookOpen, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Coins, 
  Sparkles,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function PlayerProfileModal({
  isOpen,
  onClose,
  wallet,
  goalsData,
  portfolioData,
  lessonsData,
  literacyScore,
  onNavigateTab
}) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Real calculations
  const totalScore = literacyScore?.total_score || 0;
  const tier = literacyScore?.tier || 'Foundation Builder';
  const breakdown = literacyScore?.breakdown || {
    savings_progress: { score: 0, max: 30 },
    financial_knowledge: { score: 0, max: 25 },
    decision_making: { score: 0, max: 25 },
    investment_learning: { score: 0, max: 20 }
  };

  const completedLessons = lessonsData?.progress?.completed_lessons_count || 0;
  const totalLessons = lessonsData?.progress?.total_lessons_count || 15;
  const goals = goalsData?.goals || [];
  const completedGoals = goals.filter(g => g.progress_percentage >= 100).length;
  const emergencyGoal = goals.find(g => g.is_emergency_fund);
  const emergencyCoverageMonths = emergencyGoal?.target_paise > 0 
    ? ((emergencyGoal.current_paise / emergencyGoal.target_paise) * 6).toFixed(1) 
    : '0.0';
  const holdingsCount = portfolioData?.holdings?.length || 0;
  const assetClassesExplored = breakdown.investment_learning?.asset_classes_explored || 0;
  const decisionScenariosCount = breakdown.decision_making?.scenarios_explored || 0;

  // Real, clearly defined achievements
  const milestones = [
    {
      id: 'MS_FOUNDATIONS',
      title: 'Financial Foundations',
      description: 'Set up your emergency savings and complete your first money lesson.',
      isUnlocked: Boolean(emergencyGoal) && completedLessons >= 1,
      criteria: 'Emergency savings active & at least 1 lesson completed'
    },
    {
      id: 'MS_SAVER',
      title: 'Disciplined Saver',
      description: 'Earn at least 15 points in Saving Money or build 3 months of emergency savings.',
      isUnlocked: (breakdown.savings_progress?.score || 0) >= 15.0 || Number(emergencyCoverageMonths) >= 3.0,
      criteria: 'Saving Money score ≥ 15 or 3+ months emergency savings'
    },
    {
      id: 'MS_DECISION',
      title: 'Informed Decision-Maker',
      description: 'Try multiple choices in Challenges and finish at least 3 lessons.',
      isUnlocked: (breakdown.decision_making?.score || 0) >= 6.0 && completedLessons >= 3,
      criteria: 'At least 2 challenges tried & 3 lessons finished'
    },
    {
      id: 'MS_INVESTOR',
      title: 'Investment Explorer',
      description: 'Inspect virtual investments and practice owning your first index fund or bond.',
      isUnlocked: holdingsCount > 0,
      criteria: 'Own at least 1 virtual investment'
    },
    {
      id: 'MS_STRATEGIST',
      title: 'Financial Strategist',
      description: 'Reach a Money Skills Score of 60 or higher across all four categories.',
      isUnlocked: totalScore >= 60.0,
      criteria: 'Total Money Skills Score ≥ 60.0 out of 100'
    }
  ];

  const unlockedCount = milestones.filter(m => m.isUnlocked).length;

  const completedMissions = [
    Number(emergencyCoverageMonths) >= 3.0,
    completedLessons >= 1,
    (assetClassesExplored >= 1 || holdingsCount > 0),
    (breakdown.decision_making?.score || 0) >= 3.0,
    totalScore >= 40.0
  ].filter(Boolean).length;

  // Contextual recommended next objective
  let recommendedObjective = {
    title: 'Keep Up the Good Habits',
    description: 'You completed the main achievements! Keep practicing challenges and checking investments.',
    actionTab: 'SCORE',
    actionLabel: 'View Score Details'
  };
  if (!milestones[0].isUnlocked) {
    recommendedObjective = {
      title: 'Finish Your First Money Lesson',
      description: 'Open Learn and complete your first lesson and quiz to unlock Financial Foundations.',
      actionTab: 'ACADEMY',
      actionLabel: 'Open Learn'
    };
  } else if (!milestones[1].isUnlocked) {
    recommendedObjective = {
      title: 'Build 3 Months of Emergency Savings',
      description: 'Add extra money to your Emergency Savings in Savings Center.',
      actionTab: 'SAVINGS',
      actionLabel: 'Open Savings Center'
    };
  } else if (!milestones[2].isUnlocked) {
    recommendedObjective = {
      title: 'Try a Money Challenge',
      description: 'Solve real-life money problems in Challenges and compare what happens.',
      actionTab: 'SIMULATION',
      actionLabel: 'Open Challenges'
    };
  } else if (!milestones[3].isUnlocked) {
    recommendedObjective = {
      title: 'Explore Virtual Investments',
      description: 'Inspect investments in Investment Center and try buying a virtual index fund.',
      actionTab: 'MARKET',
      actionLabel: 'Open Investment Center'
    };
  } else if (!milestones[4].isUnlocked) {
    recommendedObjective = {
      title: 'Reach 60 Points on Your Score',
      description: 'Combine saving, lesson quizzes, and smart choices to raise your overall score.',
      actionTab: 'SCORE',
      actionLabel: 'View Score Breakdown'
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-canvas-white border border-edge rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-edge bg-canvas-subtle flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-forest text-canvas-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">
              <Award className="w-5 h-5 text-canvas-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg font-bold text-ink">
                  Player Profile
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase tracking-wider font-mono">
                  {tier}
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Your actual learning and game progress based on verified activities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Score Banner: Your Money Skills */}
          <div className="p-5 rounded-2xl bg-canvas-subtle border border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                Your Money Skills
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-mono text-3xl font-bold text-forest">
                  {Number(totalScore).toFixed(1)}
                </span>
                <span className="text-xs text-ink-subtle">/ 100 Points Total</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Earned through saving money, completing lessons, and making thoughtful decisions.
              </p>
            </div>

            <div className="bg-canvas-white px-4 py-3 rounded-xl border border-edge shrink-0 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                Achievements Unlocked
              </span>
              <span className="font-mono text-xl font-bold text-copper">
                {unlockedCount} / {milestones.length}
              </span>
            </div>
          </div>

          {/* 4 Score Categories */}
          <div className="space-y-3">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink-muted">
              Score Breakdown (100 Points Total)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                <span className="text-[10px] font-semibold text-ink-muted block">Saving Money</span>
                <div className="font-mono font-bold text-ink">
                  {breakdown.savings_progress?.score || 0} <span className="text-[10px] text-ink-subtle">/ 30 pts</span>
                </div>
                <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                  <div 
                    className="bg-forest h-full rounded-full" 
                    style={{ width: `${Math.min(100, ((breakdown.savings_progress?.score || 0) / 30) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                <span className="text-[10px] font-semibold text-ink-muted block">Learning About Money</span>
                <div className="font-mono font-bold text-ink">
                  {breakdown.financial_knowledge?.score || 0} <span className="text-[10px] text-ink-subtle">/ 25 pts</span>
                </div>
                <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                  <div 
                    className="bg-forest h-full rounded-full" 
                    style={{ width: `${Math.min(100, ((breakdown.financial_knowledge?.score || 0) / 25) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                <span className="text-[10px] font-semibold text-ink-muted block">Making Good Decisions</span>
                <div className="font-mono font-bold text-ink">
                  {breakdown.decision_making?.score || 0} <span className="text-[10px] text-ink-subtle">/ 25 pts</span>
                </div>
                <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                  <div 
                    className="bg-forest h-full rounded-full" 
                    style={{ width: `${Math.min(100, ((breakdown.decision_making?.score || 0) / 25) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                <span className="text-[10px] font-semibold text-ink-muted block">Learning About Investments</span>
                <div className="font-mono font-bold text-ink">
                  {breakdown.investment_learning?.score || 0} <span className="text-[10px] text-ink-subtle">/ 20 pts</span>
                </div>
                <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                  <div 
                    className="bg-forest h-full rounded-full" 
                    style={{ width: `${Math.min(100, ((breakdown.investment_learning?.score || 0) / 20) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Metrics Checklist */}
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge space-y-2.5 text-xs">
            <span className="font-serif font-bold text-ink block uppercase tracking-wider text-[11px]">
              YOUR PROGRESS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-ink-muted text-[11px]">
              <div>
                <span className="text-ink-subtle block text-[10px]">COMPLETED MISSIONS</span>
                <strong className="text-forest font-semibold">{completedMissions} of 5 Completed</strong>
              </div>
              <div>
                <span className="text-ink-subtle block text-[10px]">LESSONS FINISHED</span>
                <strong className="text-ink">{completedLessons} of {totalLessons} Done</strong>
              </div>
              <div>
                <span className="text-ink-subtle block text-[10px]">SAVINGS GOALS</span>
                <strong className="text-ink">{completedGoals} Goals Funded</strong>
              </div>
              <div>
                <span className="text-ink-subtle block text-[10px]">EMERGENCY SAVINGS</span>
                <strong className="text-ink">{emergencyCoverageMonths} Months Covered</strong>
              </div>
              <div>
                <span className="text-ink-subtle block text-[10px]">AVAILABLE CHALLENGES</span>
                <strong className="text-ink">5 Scenarios Ready ({decisionScenariosCount} Tested)</strong>
              </div>
              <div>
                <span className="text-ink-subtle block text-[10px]">YOUR INVESTMENTS</span>
                <strong className="text-ink">{holdingsCount} Owned • {assetClassesExplored} Inspected</strong>
              </div>
            </div>
          </div>

          {/* Your Next Goal Card */}
          <div className="p-4 rounded-2xl bg-forest/5 border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest block flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-forest" />
                YOUR NEXT GOAL
              </span>
              <h4 className="font-serif font-bold text-xs text-ink">
                {recommendedObjective.title}
              </h4>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                {recommendedObjective.description}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onNavigateTab(recommendedObjective.actionTab);
              }}
              className="px-3.5 py-2 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shrink-0 flex items-center space-x-1.5 shadow-xs active:scale-95"
            >
              <span>{recommendedObjective.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Achievements (Milestones) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink-muted">
                YOUR ACHIEVEMENTS
              </h4>
              <span className="text-[11px] text-ink-subtle">Earned by skill, not wealth</span>
            </div>

            <div className="space-y-2.5">
              {milestones.map((ms, idx) => (
                <div
                  key={ms.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                    ms.isUnlocked
                      ? 'bg-canvas-white border-forest/50 ring-1 ring-forest/20 shadow-xs fade-up-stagger'
                      : 'bg-canvas-subtle/50 border-edge opacity-70'
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl mt-0.5 transition-transform duration-300 ${
                      ms.isUnlocked 
                        ? 'bg-forest/10 text-forest border border-forest/20 scale-105 shadow-xs' 
                        : 'bg-edge/40 text-ink-muted'
                    }`}>
                      {ms.isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-forest" />
                      ) : (
                        <Lock className="w-4 h-4 text-ink-muted" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-serif text-sm font-bold ${
                          ms.isUnlocked ? 'text-forest' : 'text-ink'
                        }`}>
                          {ms.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          ms.isUnlocked ? 'bg-pos/10 text-pos border border-pos/20' : 'bg-edge/50 text-ink-muted'
                        }`}>
                          {ms.isUnlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                        {ms.description}
                      </p>
                      <div className={`text-[11px] mt-1 font-mono ${
                        ms.isUnlocked ? 'text-forest font-semibold' : 'text-ink-subtle'
                      }`}>
                        {ms.isUnlocked ? `✓ Unlocked: ${ms.criteria}` : `How to unlock: ${ms.criteria}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-edge bg-canvas-subtle flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition"
          >
            Close Profile
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigateTab('SCORE');
            }}
            className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <span>View Full Score Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
