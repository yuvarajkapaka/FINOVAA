import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Target, 
  Edit3, 
  Trash2, 
  Vault, 
  Calendar, 
  Sparkles,
  Laptop,
  GraduationCap,
  Plane,
  Car,
  Home,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function SavingsGoalsSection({
  goalsData,
  onOpenCreateGoal,
  onOpenEditGoal,
  onOpenContributeGoal,
  onOpenWithdrawGoal,
  onDeleteGoal
}) {
  const [showEducationDetails, setShowEducationDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const goals = goalsData?.goals || [];
  const summary = goalsData?.summary || {};

  const emergencyGoal = goals.find(g => g.is_emergency_fund);
  const customGoals = goals.filter(g => !g.is_emergency_fund);
  const completedGoals = goals.filter(g => g.is_completed);

  const goalCategories = ['ALL', ...new Set(customGoals.map(g => g.category).filter(Boolean))];

  const filteredCustomGoals = customGoals.filter(g => {
    if (selectedCategory === 'ALL') return true;
    return g.category === selectedCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Emergency':
        return ShieldAlert;
      case 'Education':
        return GraduationCap;
      case 'Gadget & Tech':
        return Laptop;
      case 'Travel & Vacation':
        return Plane;
      case 'Vehicle':
        return Car;
      case 'Housing':
        return Home;
      default:
        return Target;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-edge">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-serif text-xl font-bold text-ink">
              Savings & Capital Reserves
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20">
              {goals.length} active
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Purpose-driven capital allocation. Set targets, fund emergency cushions, and track milestone progression.
          </p>
        </div>

        {/* Global Action & Summary Stats */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-4 bg-canvas-white px-4 py-2 rounded-xl border border-edge text-xs shadow-sm">
            <div>
              <span className="text-ink-muted block text-[10px] uppercase font-semibold">Total Reserves</span>
              <span className="font-mono font-bold text-forest">{summary.total_saved_in_goals_formatted || '₹0.00'}</span>
            </div>
            <div className="h-6 w-px bg-edge" />
            <div>
              <span className="text-ink-muted block text-[10px] uppercase font-semibold">Combined Target</span>
              <span className="font-mono font-bold text-ink">{summary.total_target_formatted || '₹0.00'}</span>
            </div>
            <div className="h-6 w-px bg-edge" />
            <div>
              <span className="text-ink-muted block text-[10px] uppercase font-semibold">Funded</span>
              <span className="font-mono font-bold text-copper">{summary.overall_percentage || 0}%</span>
            </div>
          </div>

          <button
            onClick={onOpenCreateGoal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Savings Goal</span>
          </button>
        </div>
      </div>

      {/* 1. DEDICATED EMERGENCY FUND CITADEL CARD */}
      {emergencyGoal && (
        <div className="rounded-2xl bg-canvas-white border-2 border-forest/30 p-6 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-forest/10 text-forest border border-forest/20 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif text-lg font-bold text-ink">
                      {emergencyGoal.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase tracking-wider">
                      Primary Liquidity Cushion
                    </span>
                    {emergencyGoal.is_completed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-forest border border-gold/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-forest" /> 100% Funded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Essential 3–6 months reserve to absorb unexpected life shocks without liquidating long-term investments.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 self-start sm:self-center">
                <button
                  onClick={() => onOpenContributeGoal(emergencyGoal)}
                  className="px-3.5 py-1.5 rounded-lg bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
                >
                  + Add to Cushion
                </button>
                {emergencyGoal.current_amount_paise > 0 && (
                  <button
                    onClick={() => onOpenWithdrawGoal(emergencyGoal)}
                    className="px-3 py-1.5 rounded-lg bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-xs font-medium transition active:scale-95"
                  >
                    Withdraw
                  </button>
                )}
                <button
                  onClick={() => onOpenEditGoal(emergencyGoal)}
                  className="p-1.5 rounded-lg bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink-muted hover:text-ink border border-edge transition"
                  title="Adjust target amount or timeline"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar & Numerical Metrics */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-end text-xs">
                <div>
                  <span className="text-ink-muted">Saved: </span>
                  <span className="text-lg font-bold font-mono text-forest">
                    {emergencyGoal.current_formatted}
                  </span>
                  <span className="text-ink-subtle mx-1.5">/</span>
                  <span className="text-ink-muted font-mono">
                    Target: {emergencyGoal.target_formatted}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-forest">
                    {emergencyGoal.percentage_complete}% Complete
                  </span>
                  <span className="text-[11px] text-ink-muted block">
                    Remaining: {emergencyGoal.remaining_formatted}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-canvas-subtle rounded-full h-3 overflow-hidden p-0.5 border border-edge">
                <div
                  className="h-full rounded-full bg-forest transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.max(2, emergencyGoal.percentage_complete)}%` }}
                />
              </div>
            </div>

            {/* Educational Collapsible Accordion */}
            <div className="pt-2 border-t border-edge">
              <button
                onClick={() => setShowEducationDetails(!showEducationDetails)}
                className="flex items-center space-x-1.5 text-xs text-forest hover:text-forest-dark font-semibold transition"
              >
                <span>Why is an emergency reserve critical for every investor?</span>
                {showEducationDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showEducationDetails && (
                <div className="mt-3 p-4 rounded-xl bg-canvas-subtle border border-edge text-xs text-ink space-y-2 animate-in fade-in duration-200">
                  <div className="font-bold text-ink">Three Core Pillars of Emergency Reserves:</div>
                  <ul className="list-disc list-inside space-y-1 text-ink-muted leading-relaxed">
                    <li><strong className="text-ink">Liquidity First:</strong> Keeps cash readily accessible so you never need high-interest personal loans during emergencies.</li>
                    <li><strong className="text-ink">Investment Shield:</strong> Prevents you from panic-selling equities or mutual funds at a loss during macro downturns.</li>
                    <li><strong className="text-ink">Peace of Mind:</strong> Gives you the psychological resilience to invest systematically in long-term wealth without financial anxiety.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Celebration Banner if any goals completed */}
      {completedGoals.length > 0 && (
        <div className="p-4 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-between text-xs text-ink shadow-sm">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-[#9B7A28] flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-serif font-bold text-sm text-ink">Goal Milestones Achieved</span>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {completedGoals.length} savings goal{completedGoals.length > 1 ? 's are' : ' is'} 100% funded! Disciplined allocation creates lasting resilience.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-canvas-white text-forest border border-edge shadow-xs">
            {completedGoals.length} Fully Funded
          </span>
        </div>
      )}

      {/* 2. CUSTOM SAVINGS GOALS GRID */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink-muted">
              Target-Based Savings Goals ({customGoals.length})
            </h3>
            <span className="text-xs text-ink-muted">
              Dedicated allocations for education, technology, travel, and capital milestones
            </span>
          </div>

          {/* Interactive Category Filter Pills */}
          {goalCategories.length > 2 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {goalCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                    selectedCategory === cat
                      ? 'bg-forest text-canvas-white border-forest'
                      : 'bg-canvas-white text-ink-muted border-edge hover:text-ink'
                  }`}
                >
                  {cat === 'ALL' ? 'All Goals' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {customGoals.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-edge bg-canvas-white p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-canvas-subtle flex items-center justify-center text-ink-muted mx-auto">
              <Vault className="w-6 h-6 text-forest" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-ink">No custom savings goals yet</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
                Goal-oriented saving helps you budget intentionally. Set up a goal for higher education, a laptop, travel, or a down payment.
              </p>
            </div>
            <button
              onClick={onOpenCreateGoal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-forest hover:bg-forest-light text-canvas-white text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomGoals.map((goal) => {
              const Icon = getCategoryIcon(goal.category);
              const isComplete = goal.is_completed;

              return (
                <div
                  key={goal.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-250 shadow-sm relative group bg-canvas-white hover:-translate-y-1.5 hover:shadow-lg ${
                    isComplete
                      ? 'border-forest/40 hover:border-forest/80'
                      : 'border-edge hover:border-forest/50'
                  }`}
                >
                  <div>
                    {/* Goal Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-lg border ${
                          isComplete 
                            ? 'bg-forest/10 text-forest border-forest/20' 
                            : 'bg-canvas-subtle text-ink-muted border-edge'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-ink group-hover:text-forest transition">
                            {goal.name}
                          </h4>
                          <span className="text-[10px] text-ink-muted">{goal.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onOpenEditGoal(goal)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas-subtle transition"
                          title="Edit Goal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteGoal(goal)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-neg hover:bg-neg/10 transition"
                          title="Delete Goal (Refunds saved funds)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Numerical Stats */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-ink-muted">Saved:</span>
                        <span className="font-mono font-bold text-ink text-base">
                          {goal.current_formatted}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs text-ink-muted font-mono">
                        <span>Target:</span>
                        <span>{goal.target_formatted}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className={isComplete ? 'text-forest font-bold' : 'text-ink-muted'}>
                          {goal.percentage_complete}%
                        </span>
                        <span className="text-ink-muted">
                          {isComplete ? 'Target reached' : `Need ${goal.remaining_formatted}`}
                        </span>
                      </div>
                      <div className="w-full bg-canvas-subtle rounded-full h-2 overflow-hidden border border-edge">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? 'bg-forest' : 'bg-copper'
                          }`}
                          style={{ width: `${Math.max(2, goal.percentage_complete)}%` }}
                        />
                      </div>
                    </div>

                    {/* Target Date */}
                    {goal.target_date && (
                      <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-ink-muted">
                        <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                        <span>Target Date: {goal.target_date}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-edge flex items-center space-x-2">
                    <button
                      onClick={() => onOpenContributeGoal(goal)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-forest/10 hover:bg-forest/20 text-forest border border-forest/20 text-xs font-semibold transition active:scale-95"
                    >
                      + Contribute
                    </button>
                    {goal.current_amount_paise > 0 && (
                      <button
                        onClick={() => onOpenWithdrawGoal(goal)}
                        className="py-1.5 px-3 rounded-lg bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-xs font-medium transition active:scale-95"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
