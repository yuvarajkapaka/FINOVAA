import React from 'react';
import { 
  Compass, 
  ArrowRight, 
  ShieldAlert, 
  BookOpen, 
  TrendingUp
} from 'lucide-react';

export default function YourNextMove({
  wallet,
  goalsData,
  lessonsData,
  portfolioData,
  literacyScore,
  onNavigateTab,
  onOpenAction,
  onSelectLesson,
  onOpenCreateGoal
}) {
  const emergencyGoal = goalsData?.goals?.find(g => g.is_emergency_fund);
  const emergencyPercentage = emergencyGoal?.percentage_complete || 0;
  const isEmergencyFunded = emergencyGoal?.is_completed || emergencyPercentage >= 100;

  const lessons = lessonsData?.lessons || [];
  const completedLessonsCount = lessonsData?.progress?.completed_lessons_count || 0;
  const nextUnreadLesson = lessons.find(l => !l.is_completed);

  const holdings = portfolioData?.holdings || [];
  const hasHoldings = holdings.length > 0;
  const availableCashINR = wallet?.balances?.current_balance_inr || 0;

  const totalScore = literacyScore?.total_score || 0;

  // Determine top 3 prioritized moves based strictly on real state
  const moves = [];

  // Move A: Emergency Shield if not complete
  if (!isEmergencyFunded) {
    moves.push({
      id: 'emergency-fund',
      title: 'Strengthen Emergency Cushion',
      subtitle: `Currently at ${emergencyPercentage}% of ${emergencyGoal?.target_formatted || 'target'}. A 3–6 month reserve shields your capital from surprise shocks.`,
      badge: 'High Priority',
      badgeColor: 'bg-copper/10 text-copper border-copper/20',
      icon: ShieldAlert,
      iconColor: 'text-copper',
      actionLabel: 'Deposit to Vault',
      action: () => onNavigateTab ? onNavigateTab('SAVINGS') : onOpenAction('TRANSFER'),
      progress: emergencyPercentage,
      progressColor: 'bg-copper'
    });
  }

  // Move B: Academy Education if lessons remain
  if (nextUnreadLesson) {
    moves.push({
      id: 'academy-next',
      title: `Study Lesson #${nextUnreadLesson.id}: ${nextUnreadLesson.title}`,
      subtitle: `${nextUnreadLesson.category} • ${nextUnreadLesson.read_time} • Advance your comprehension rubric through structured case studies.`,
      badge: `${completedLessonsCount}/15 Complete`,
      badgeColor: 'bg-forest/10 text-forest border-forest/20',
      icon: BookOpen,
      iconColor: 'text-forest',
      actionLabel: 'Start Mission',
      action: () => {
        if (onNavigateTab) onNavigateTab('ACADEMY');
        if (onSelectLesson) onSelectLesson(nextUnreadLesson.id);
      },
      progress: Math.round((completedLessonsCount / 15) * 100),
      progressColor: 'bg-forest'
    });
  }

  // Move C: Portfolio Diversification
  if (!hasHoldings && availableCashINR >= 1000) {
    moves.push({
      id: 'market-invest',
      title: 'Practice Virtual Investing',
      subtitle: `You have ₹${availableCashINR.toLocaleString('en-IN')} in liquid cash. Experience asset allocation across Index Funds, Bonds, or Gold.`,
      badge: '0 Active Holdings',
      badgeColor: 'bg-olive/10 text-olive border-olive/20',
      icon: TrendingUp,
      iconColor: 'text-olive',
      actionLabel: 'Explore Exchange',
      action: () => onNavigateTab && onNavigateTab('MARKET'),
      progress: 0,
      progressColor: 'bg-olive'
    });
  } else if (hasHoldings) {
    moves.push({
      id: 'market-check',
      title: 'Review Asset Allocation',
      subtitle: `You hold ${holdings.length} simulated position${holdings.length > 1 ? 's' : ''}. Observe how macro cycle shifts affect valuation and drawdowns.`,
      badge: `${holdings.length} Positions`,
      badgeColor: 'bg-olive/10 text-olive border-olive/20',
      icon: TrendingUp,
      iconColor: 'text-olive',
      actionLabel: 'View Portfolio',
      action: () => onNavigateTab && onNavigateTab('MARKET'),
      progress: 100,
      progressColor: 'bg-olive'
    });
  }

  // Move D: Decision Making Simulation
  moves.push({
    id: 'sim-decision',
    title: 'Test Financial Life Scenarios',
    subtitle: 'Evaluate emergency expenses, income reductions, and market drops with zero risk to your real virtual balance.',
    badge: 'Scenario Replay',
    badgeColor: 'bg-forest/10 text-forest border-forest/20',
    icon: Compass,
    iconColor: 'text-forest',
    actionLabel: 'Launch Simulator',
    action: () => onNavigateTab && onNavigateTab('SIMULATION'),
    progress: Math.min(100, Math.round((totalScore / 100) * 100)),
    progressColor: 'bg-forest'
  });

  const displayedMoves = moves.slice(0, 3);

  return (
    <div className="rounded-2xl bg-canvas-white border border-edge p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-edge">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-forest/10 text-forest border border-forest/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-ink flex items-center gap-2">
              <span>Your Next Move</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase tracking-wider">
                Live Directives
              </span>
            </h3>
            <p className="text-xs text-ink-muted">
              Personalized next strategic actions derived strictly from your verified account snapshot.
            </p>
          </div>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={() => onOpenAction('INCOME')}
            className="px-2.5 py-1 rounded-lg bg-forest/10 hover:bg-forest/20 text-forest border border-forest/20 text-[11px] font-semibold transition active:scale-95"
          >
            + Add Cash
          </button>
          <button
            onClick={() => onOpenAction('TRANSFER')}
            className="px-2.5 py-1 rounded-lg bg-olive/10 hover:bg-olive/20 text-olive border border-olive/20 text-[11px] font-semibold transition active:scale-95"
          >
            Deposit Vault
          </button>
          <button
            onClick={onOpenCreateGoal}
            className="px-2.5 py-1 rounded-lg bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-[11px] font-semibold transition active:scale-95"
          >
            + New Goal
          </button>
        </div>
      </div>

      {/* Grid of 3 moves */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {displayedMoves.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="rounded-xl bg-canvas-subtle border border-edge/80 hover:border-forest/40 p-4 flex flex-col justify-between transition group shadow-sm"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg bg-canvas-white border border-edge ${m.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>

                <div>
                  <h4 className="font-serif text-xs font-bold text-ink group-hover:text-forest transition line-clamp-1">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                    {m.subtitle}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-edge/70 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.progressColor} transition-all duration-500`}
                      style={{ width: `${Math.max(4, m.progress)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Trigger */}
              <button
                onClick={m.action}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-canvas-white hover:bg-forest text-ink hover:text-canvas-white border border-edge hover:border-forest text-xs font-semibold transition active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <span>{m.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
