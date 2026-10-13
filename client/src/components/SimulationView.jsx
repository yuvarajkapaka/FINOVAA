import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  Target, 
  Gift, 
  Compass, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Play, 
  Info, 
  Wallet, 
  Layers, 
  PieChart, 
  Loader2, 
  Sparkles,
  HelpCircle,
  Check,
  ChevronRight,
  TrendingUp,
  Award,
  BarChart3,
  Search,
  BookOpen,
  Scale
} from 'lucide-react';
import { apiFetch } from '../api/config';

export default function SimulationView({ wallet, goalsData, portfolioData, onOpenEvents }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [activeChoiceId, setActiveChoiceId] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // 6-Stage Guided Strategy Sequence:
  // STAGE 1 — THE EVENT | STAGE 2 — INVESTIGATE | STAGE 3 — MAKE A DECISION | STAGE 4 — EXPERIENCE THE OUTCOME | STAGE 5 — COMPARE STRATEGIES | STAGE 6 — LEARN
  const [currentStage, setCurrentStage] = useState('STAGE_1_EVENT');
  const [exploredScenarioIds, setExploredScenarioIds] = useState(new Set());

  // Fetch scenario catalog on mount
  useEffect(() => {
    async function loadScenarios() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/simulation/scenarios');
        const data = await res.json();
        if (data.success && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          setSelectedScenarioId(data.scenarios[0].id);
          setActiveChoiceId(data.scenarios[0].choices[0]?.id);
          evaluateScenario(data.scenarios[0].id, data.scenarios[0].choices[0]?.id);
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScenarios();
  }, []);

  const evaluateScenario = async (scenarioId, choiceId = null) => {
    try {
      setIsEvaluating(true);
      const res = await apiFetch('/api/simulation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioId,
          choice_id: choiceId
        })
      });
      const data = await res.json();
      if (data.success) {
        setEvaluationData(data.data);
        if (choiceId) {
          setActiveChoiceId(choiceId);
        } else if (data.data.side_by_side_evaluations?.length > 0) {
          setActiveChoiceId(data.data.side_by_side_evaluations[0].choice_id);
        }
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectScenario = (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    setCurrentStage('STAGE_1_EVENT');
    const targetSc = scenarios.find(s => s.id === scenarioId);
    if (targetSc && targetSc.choices.length > 0) {
      setActiveChoiceId(targetSc.choices[0].id);
      evaluateScenario(scenarioId, targetSc.choices[0].id);
    } else {
      evaluateScenario(scenarioId);
    }
  };

  const handleConfirmDecision = async () => {
    if (!activeChoiceId) return;
    await evaluateScenario(selectedScenarioId, activeChoiceId);
    setCurrentStage('STAGE_4_OUTCOME');
    setExploredScenarioIds(prev => new Set([...prev, selectedScenarioId]));
  };

  const handleRestartScenario = () => {
    setCurrentStage('STAGE_1_EVENT');
  };

  const handleNextScenario = () => {
    const currentIndex = scenarios.findIndex(s => s.id === selectedScenarioId);
    if (currentIndex >= 0 && currentIndex < scenarios.length - 1) {
      handleSelectScenario(scenarios[currentIndex + 1].id);
    } else if (scenarios.length > 0) {
      handleSelectScenario(scenarios[0].id);
    }
  };

  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  const snapshot = evaluationData?.snapshot;
  const evaluations = evaluationData?.side_by_side_evaluations || [];
  const selectedEvaluation = evaluationData?.selected_evaluation || evaluations.find(e => e.choice_id === activeChoiceId) || evaluations[0];

  const stagesList = [
    { id: 'STAGE_1_EVENT', step: '01', label: 'The Problem' },
    { id: 'STAGE_2_INVESTIGATE', step: '02', label: 'Check Money' },
    { id: 'STAGE_3_DECISION', step: '03', label: 'Choose What to Do' },
    { id: 'STAGE_4_OUTCOME', step: '04', label: 'What Happens' },
    { id: 'STAGE_5_COMPARE', step: '05', label: 'Compare Choices' },
    { id: 'STAGE_6_LEARN', step: '06', label: 'What You Learned' },
  ];

  const getStrategyBadge = (label) => {
    switch (label) {
      case 'Liquidity Preserved':
        return {
          icon: ShieldCheck,
          className: 'bg-forest/10 text-forest border-forest/20',
          label: 'Liquidity Preserved'
        };
      case 'Budget-Aware':
        return {
          icon: Wallet,
          className: 'bg-forest/10 text-forest border-forest/20',
          label: 'Budget-Aware'
        };
      case 'Learning Opportunity':
        return {
          icon: AlertTriangle,
          className: 'bg-copper/10 text-copper border-copper/30',
          label: 'Learning Opportunity'
        };
      case 'Goal-Aligned':
        return {
          icon: Target,
          className: 'bg-forest/10 text-forest border-forest/20',
          label: 'Goal-Aligned'
        };
      case 'Goal Trade-Off':
        return {
          icon: Scale,
          className: 'bg-copper/10 text-copper border-copper/30',
          label: 'Goal Trade-Off'
        };
      default:
        return {
          icon: Compass,
          className: 'bg-canvas-subtle text-ink-muted border-edge',
          label: label || 'Strategy'
        };
    }
  };

  const getChoiceImpactDetails = (choice, evalItem, scenario) => {
    if (evalItem?.deltas) {
      const { deltas } = evalItem;
      const impacts = [];
      if (deltas.cash_delta_paise !== 0) {
        impacts.push({
          label: 'Available Cash',
          delta: deltas.formatted_cash_delta,
          isNegative: deltas.cash_delta_paise < 0,
          color: deltas.cash_delta_paise < 0 ? 'text-copper' : 'text-forest'
        });
      }
      if (deltas.savings_delta_paise !== 0) {
        impacts.push({
          label: 'Emergency Savings',
          delta: deltas.formatted_savings_delta,
          isNegative: deltas.savings_delta_paise < 0,
          color: deltas.savings_delta_paise < 0 ? 'text-copper' : 'text-forest'
        });
      }
      if (deltas.investments_delta_paise !== 0) {
        impacts.push({
          label: 'Virtual Investments',
          delta: deltas.formatted_investments_delta,
          isNegative: deltas.investments_delta_paise < 0,
          color: deltas.investments_delta_paise < 0 ? 'text-copper' : 'text-forest'
        });
      }

      let sourceAccount = 'Operational Cash';
      if (deltas.savings_delta_paise < 0) sourceAccount = 'Emergency Buffer';
      else if (deltas.cash_delta_paise < 0) sourceAccount = 'Available Cash';
      else if (deltas.investments_delta_paise < 0) sourceAccount = 'Liquidated Assets';

      return {
        sourceAccount,
        impacts: impacts.length > 0 ? impacts : [{ label: 'Account Balances', delta: '₹0.00 change', isNegative: false, color: 'text-ink-muted' }],
        netWealthDelta: deltas.formatted_wealth_delta,
        note: evalItem.goal_impact_note
      };
    }

    const amt = scenario?.formatted_event_amount || '₹8,000';
    if (choice.action_type === 'USE_SAVINGS') {
      return {
        sourceAccount: 'Emergency Buffer',
        impacts: [{ label: 'Emergency Savings', delta: `-${amt}`, isNegative: true, color: 'text-copper' }],
        netWealthDelta: `-${amt}`,
        note: 'Drawn directly from emergency buffer; daily cash preserved.'
      };
    }
    if (choice.action_type === 'USE_CASH') {
      return {
        sourceAccount: 'Available Cash',
        impacts: [{ label: 'Available Cash', delta: `-${amt}`, isNegative: true, color: 'text-copper' }],
        netWealthDelta: `-${amt}`,
        note: 'Drawn from liquid cash; emergency buffer preserved.'
      };
    }
    if (choice.action_type === 'LIQUIDATE_INVESTMENT') {
      return {
        sourceAccount: 'Liquidated Assets',
        impacts: [{ label: 'Virtual Investments', delta: `-${amt}`, isNegative: true, color: 'text-copper' }],
        netWealthDelta: `-${amt}`,
        note: 'Units sold to pay urgent obligation.'
      };
    }
    return {
      sourceAccount: 'Budget Outflow',
      impacts: [{ label: 'Account Allocation', delta: amt, isNegative: false, color: 'text-forest' }],
      netWealthDelta: '₹0.00',
      note: choice.tradeoff_summary
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. SCENARIO CHAMBER HEADER & 5-SCENARIO NAVIGATOR */}
      <div className="bg-canvas-white border border-edge rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs font-semibold">
              <Compass className="w-4 h-4" />
              <span>Challenges • Zero Real Money Risk</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Challenges • Money Problem Simulator
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Experience the consequences of critical financial choices. Test your decisions against realistic money problems
              and see how each choice impacts your available money, emergency savings, and future resilience.
            </p>
          </div>

          {/* Scenarios Mastered Barometer & Financial Events Trigger */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {onOpenEvents && (
              <button
                onClick={onOpenEvents}
                className="px-4 py-3 rounded-2xl bg-forest/10 hover:bg-forest/20 text-forest border border-forest/30 text-xs font-bold transition flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-forest" />
                <span>Play Financial Events</span>
              </button>
            )}

            <div className="bg-canvas-subtle p-3.5 rounded-2xl border border-edge flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Scenarios Mastered</span>
                <span className="font-mono text-xl font-bold text-forest">{exploredScenarioIds.size} / 5</span>
              </div>
              <div className="w-9 h-9 rounded-full border-2 border-forest/30 flex items-center justify-center font-bold text-xs text-forest">
                {Math.round((exploredScenarioIds.size / 5) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* 5 Scenario Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-edge">
          {scenarios.map((sc, idx) => {
            const isSelected = sc.id === selectedScenarioId;
            const isExplored = exploredScenarioIds.has(sc.id);

            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-forest text-canvas-white border-forest shadow-sm -translate-y-0.5'
                    : 'bg-canvas-subtle text-ink-muted border-edge hover:text-ink hover:border-forest/40 hover:bg-canvas-white hover:-translate-y-0.5 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span>Scenario 0{idx + 1}</span>
                  {isExplored && <CheckCircle2 className="w-3.5 h-3.5 text-forest" />}
                </div>
                <div className="font-serif font-bold text-xs mt-1.5 line-clamp-1">
                  {sc.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. THE 6-STAGE STRATEGY GAME SEQUENCER */}
      <div className="bg-canvas-white border border-edge rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Stage Progress Bar Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-edge">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase">
              {activeScenario?.category || activeScenario?.type || 'Unexpected Expense'}
            </span>
            <h2 className="font-serif text-lg font-bold text-ink">
              {activeScenario?.title}
            </h2>
          </div>

          {/* 6 Stage Step Buttons */}
          <div className="flex items-center space-x-1 p-1 rounded-2xl bg-canvas-subtle border border-edge text-xs overflow-x-auto">
            {stagesList.map(st => (
              <button
                key={st.id}
                onClick={() => setCurrentStage(st.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition flex items-center space-x-1.5 whitespace-nowrap ${
                  currentStage === st.id
                    ? 'bg-forest text-canvas-white shadow-xs font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span className="opacity-70 font-mono text-[10px]">{st.step}</span>
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STAGE 1 — THE EVENT */}
        {currentStage === 'STAGE_1_EVENT' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-canvas-subtle border border-edge space-y-3">
              <div className="flex items-center space-x-2 text-copper font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>The Problem • Sudden Money Situation</span>
              </div>
              <p className="text-sm sm:text-base font-serif text-ink leading-relaxed font-semibold fade-up-stagger">
                {activeScenario?.description}
              </p>
            </div>

            {/* Baseline Account Snapshot at Moment of Shock */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Your Starting Balances
                </span>
                <span className="font-mono text-forest">Zero Balance Impact Guarantee</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Available Money</span>
                  <span className="font-mono text-base font-bold text-ink mt-0.5 block">
                    {snapshot?.formatted_cash || snapshot?.formatted_available_cash || '₹0.00'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Emergency Savings</span>
                  <span className="font-mono text-base font-bold text-ink mt-0.5 block">
                    {snapshot?.formatted_savings || snapshot?.formatted_emergency_fund || '₹0.00'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Your Investments</span>
                  <span className="font-mono text-base font-bold text-ink mt-0.5 block">
                    {snapshot?.formatted_investments || snapshot?.formatted_portfolio_value || '₹0.00'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Total Virtual Wealth</span>
                  <span className="font-mono text-base font-bold text-forest mt-0.5 block">
                    {snapshot?.formatted_total_wealth || '₹0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-edge">
              <button
                onClick={() => setCurrentStage('STAGE_2_INVESTIGATE')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <span>Proceed to Check Money</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2 — INVESTIGATE */}
        {currentStage === 'STAGE_2_INVESTIGATE' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-ink">
                Investigate Available Financial Data & Exposure
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Before selecting a response, investigate how this shock interacts with your baseline accounts across three vital pillars.
              </p>
            </div>

            {/* Context Metrics Summary */}
            {activeScenario?.formatted_event_amount && (
              <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">Financial Obligation:</span>
                  <span className="font-mono font-bold text-ink text-sm">{activeScenario.formatted_event_amount}</span>
                </div>
                <div className="text-ink-muted">
                  <span className="font-semibold text-forest">Objective: </span>
                  <span>{activeScenario.learning_objective}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-canvas-subtle border border-edge space-y-2">
                <span className="font-serif font-bold text-sm text-forest block">
                  Pillar A: Cash Flow & Liquidity
                </span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  How does absorbing this sudden obligation affect immediate day-to-day liquidity? Will it force an operational overdraft or disrupt recurring living expenses?
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-canvas-subtle border border-edge space-y-2">
                <span className="font-serif font-bold text-sm text-copper block">
                  Pillar B: Emergency Cushion
                </span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Does your Vault reserve hold sufficient uncommitted capital to absorb this shock, or will it exhaust your safety buffer completely?
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-canvas-subtle border border-edge space-y-2">
                <span className="font-serif font-bold text-sm text-olive block">
                  Pillar C: Compounding Protection
                </span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Are your long-term investment assets shielded from panic selling, or does this shock force premature liquidations at temporary market lows?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-edge">
              <button
                onClick={() => setCurrentStage('STAGE_1_EVENT')}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition"
              >
                ← Back to The Event
              </button>
              <button
                onClick={() => setCurrentStage('STAGE_3_DECISION')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <span>Proceed to Make Decision</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3 — MAKE A DECISION */}
        {currentStage === 'STAGE_3_DECISION' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-ink">
                Make a Strategic Decision
              </h3>
              <p className="text-xs text-ink-muted">
                Select one of the authentic response options below. Each demonstrates a distinct real-world approach with clear trade-offs.
              </p>
            </div>

            {/* 3 Distinct Decision Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {activeScenario?.choices?.map((choice, idx) => {
                const isSelected = activeChoiceId === choice.id;
                const strategyBadge = getStrategyBadge(choice.label);
                const StrategyIcon = strategyBadge.icon;
                const choiceEval = evaluations.find(e => e.choice_id === choice.id);
                const impactDetails = getChoiceImpactDetails(choice, choiceEval, activeScenario);

                return (
                  <div
                    key={choice.id}
                    onClick={() => setActiveChoiceId(choice.id)}
                    className={`rounded-3xl border p-5 sm:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-canvas-white border-forest ring-2 ring-forest/30 shadow-md -translate-y-1'
                        : 'bg-canvas-subtle border-edge hover:border-forest/50 hover:bg-canvas-white hover:-translate-y-1 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Card Header: Option Tag & Strategy Category Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-canvas-white border border-edge text-ink-muted">
                            Option 0{idx + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 uppercase tracking-wider ${strategyBadge.className}`}>
                            <StrategyIcon className="w-3 h-3 shrink-0" />
                            <span>{choice.label || 'Strategy'}</span>
                          </span>
                        </div>

                        {isSelected ? (
                          <span className="text-[11px] font-bold text-forest flex items-center gap-1 bg-forest/10 px-2 py-0.5 rounded-full border border-forest/20 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-edge hover:border-forest/40 transition-colors shrink-0" />
                        )}
                      </div>

                      {/* Decision Title */}
                      <h4 className="font-serif text-base font-bold text-ink leading-snug">
                        {choice.title || choice.text}
                      </h4>

                      {/* Clear Narrative Description */}
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {choice.summary || choice.description}
                      </p>

                      {/* Virtual Money Cost & Consequence Box */}
                      <div className="p-3.5 rounded-2xl bg-canvas-white border border-edge/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
                            Required Outlay
                          </span>
                          <span className="font-mono font-bold text-ink">
                            {activeScenario?.formatted_event_amount || '₹8,000.00'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-edge/60 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-ink-muted">Primary Fund Source:</span>
                            <span className="font-mono font-bold text-ink">
                              {impactDetails.sourceAccount}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <span className="text-ink-muted shrink-0">Balance Impact:</span>
                            <div className="text-right font-mono space-y-0.5">
                              {impactDetails.impacts.map((imp, impIdx) => (
                                <div key={impIdx} className={`font-bold ${imp.color}`}>
                                  {imp.label}: {imp.delta}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Strategic Trade-Off Callout */}
                      {choice.tradeoff_summary && (
                        <div className="p-3 rounded-xl bg-forest/5 border border-forest/15 space-y-1">
                          <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-forest">
                            <Scale className="w-3.5 h-3.5 shrink-0" />
                            <span>Financial Trade-Off</span>
                          </div>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            {choice.tradeoff_summary}
                          </p>
                        </div>
                      )}

                      {/* Pros & Cons Checklist */}
                      {((choice.pros && choice.pros.length > 0) || (choice.cons && choice.cons.length > 0)) && (
                        <div className="space-y-2 pt-1 text-xs">
                          {choice.pros && choice.pros.length > 0 && (
                            <div className="space-y-1">
                              {choice.pros.slice(0, 2).map((pro, pIdx) => (
                                <div key={pIdx} className="flex items-start space-x-1.5 text-[11px] text-ink leading-relaxed">
                                  <Check className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                                  <span>{pro}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {choice.cons && choice.cons.length > 0 && (
                            <div className="space-y-1 pt-1.5 border-t border-edge/60">
                              {choice.cons.slice(0, 2).map((con, cIdx) => (
                                <div key={cIdx} className="flex items-start space-x-1.5 text-[11px] text-copper leading-relaxed">
                                  <AlertTriangle className="w-3.5 h-3.5 text-copper shrink-0 mt-0.5" />
                                  <span>{con}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Action Footer */}
                    <div className={`mt-4 pt-3 border-t text-xs flex items-center justify-between font-medium ${
                      isSelected ? 'border-forest/30 text-forest font-bold' : 'border-edge text-ink-muted'
                    }`}>
                      <span>{isSelected ? '✓ Strategy Selected' : 'Click to select this strategy'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-forest translate-x-0.5' : 'text-ink-muted'} transition-transform`} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-edge">
              <button
                onClick={() => setCurrentStage('STAGE_2_INVESTIGATE')}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition"
              >
                ← Back to Investigate
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={!activeChoiceId || isEvaluating}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-40"
              >
                {isEvaluating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Evaluate & Reveal Consequences</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4 — EXPERIENCE THE OUTCOME */}
        {currentStage === 'STAGE_4_OUTCOME' && selectedEvaluation && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Outcome Explanation Card */}
            <div className="p-6 rounded-2xl bg-canvas-subtle border border-edge space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest px-2.5 py-0.5 rounded-full bg-forest/10 border border-forest/20 font-mono">
                  Simulated Outcome • {selectedEvaluation.label}
                </span>
                <span className="text-xs text-ink font-semibold">
                  {selectedEvaluation.choice_title || selectedEvaluation.choice_text}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
                {selectedEvaluation.educational_verdict || selectedEvaluation.tradeoff_summary || selectedEvaluation.rationale}
              </p>
              {selectedEvaluation.goal_impact_note && (
                <div className="p-3 bg-canvas-white rounded-xl border border-edge text-xs text-ink-muted flex items-start space-x-2">
                  <Info className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                  <span>{selectedEvaluation.goal_impact_note}</span>
                </div>
              )}
            </div>

            {/* Before vs After Quantitative Comparisons */}
            <div className="space-y-3">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink-muted">
                What Happened to Your Money • Before vs. After
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5 ${
                  (selectedEvaluation.deltas?.cash_delta_paise || 0) > 0 ? 'highlight-pos' : (selectedEvaluation.deltas?.cash_delta_paise || 0) < 0 ? 'highlight-neg' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-ink-muted">Available Money</span>
                    <span className="font-mono text-[10px] font-bold text-ink-muted">
                      {selectedEvaluation.deltas?.formatted_cash_delta || '₹0.00'}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-ink-muted text-xs">
                      {selectedEvaluation.before?.formatted_cash || snapshot?.formatted_cash}
                    </span>
                    <span className="text-ink-subtle">→</span>
                    <span className="text-base font-bold text-ink">
                      {selectedEvaluation.after?.formatted_cash || selectedEvaluation.resulting_state?.formatted_cash}
                    </span>
                  </div>
                  <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((selectedEvaluation.resulting_state?.cash_paise || selectedEvaluation.after?.cash_paise || 0) / Math.max(1, selectedEvaluation.before?.cash_paise || snapshot?.cash_paise || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5 ${
                  (selectedEvaluation.deltas?.savings_delta_paise || 0) > 0 ? 'highlight-pos' : (selectedEvaluation.deltas?.savings_delta_paise || 0) < 0 ? 'highlight-neg' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-ink-muted">Emergency Savings</span>
                    <span className="font-mono text-[10px] font-bold text-ink-muted">
                      {selectedEvaluation.deltas?.formatted_savings_delta || '₹0.00'}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-ink-muted text-xs">
                      {selectedEvaluation.before?.formatted_savings || snapshot?.formatted_savings}
                    </span>
                    <span className="text-ink-subtle">→</span>
                    <span className="text-base font-bold text-ink">
                      {selectedEvaluation.after?.formatted_savings || selectedEvaluation.resulting_state?.formatted_savings}
                    </span>
                  </div>
                  <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((selectedEvaluation.resulting_state?.savings_paise || selectedEvaluation.after?.savings_paise || 0) / Math.max(1, selectedEvaluation.before?.savings_paise || snapshot?.savings_paise || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-ink-muted">Total Virtual Wealth</span>
                    <span className="font-mono text-[10px] font-bold text-ink-muted">
                      {selectedEvaluation.deltas?.formatted_wealth_delta || '₹0.00'}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-ink-muted text-xs">
                      {selectedEvaluation.before?.formatted_total || snapshot?.formatted_total_wealth}
                    </span>
                    <span className="text-ink-subtle">→</span>
                    <span className="text-base font-bold text-forest">
                      {selectedEvaluation.after?.formatted_total || selectedEvaluation.resulting_state?.formatted_total_wealth}
                    </span>
                  </div>
                  <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((selectedEvaluation.resulting_state?.total_virtual_wealth_paise || selectedEvaluation.after?.total_paise || 0) / Math.max(1, selectedEvaluation.before?.total_paise || snapshot?.total_virtual_wealth_paise || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-edge">
              <button
                onClick={handleRestartScenario}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Problem</span>
              </button>

              <button
                onClick={() => setCurrentStage('STAGE_5_COMPARE')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <span>Compare Your Choices</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 5 — COMPARE STRATEGIES (DECISION ECHO) */}
        {currentStage === 'STAGE_5_COMPARE' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-ink">
                Compare Your Choices
              </h3>
              <p className="text-xs text-ink-muted">
                Compare every choice side-by-side starting from the exact same starting point.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {evaluations.map((evalItem, idx) => {
                const isCurrent = evalItem.choice_id === activeChoiceId;
                const strategyBadge = getStrategyBadge(evalItem.label);
                const StrategyIcon = strategyBadge.icon;

                return (
                  <div
                    key={evalItem.choice_id}
                    className={`rounded-2xl border p-5 space-y-3.5 flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-canvas-white border-forest shadow-sm ring-1 ring-forest/30'
                        : 'bg-canvas-subtle border-edge'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-canvas-white border border-edge text-ink-muted">
                            Option 0{idx + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 uppercase ${strategyBadge.className}`}>
                            <StrategyIcon className="w-3 h-3 shrink-0" />
                            <span>{evalItem.label}</span>
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-forest">
                            Your Choice
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-sm font-bold text-ink">
                        {evalItem.choice_title || evalItem.choice_text}
                      </h4>

                      <p className="text-xs text-ink-muted leading-relaxed">
                        {evalItem.tradeoff_summary || evalItem.rationale}
                      </p>

                      {evalItem.educational_verdict && (
                        <div className="p-2.5 bg-canvas-white/80 rounded-xl border border-edge/80 text-[11px] text-ink leading-relaxed">
                          <span className="font-semibold text-forest block mb-0.5">Verdict:</span>
                          {evalItem.educational_verdict}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-edge text-xs font-mono grid grid-cols-2 gap-2 text-ink-muted">
                      <div>
                        <span className="text-[10px] block text-ink-subtle">Ending Available Cash:</span>
                        <span className="text-ink font-semibold">
                          {evalItem.after?.formatted_cash || evalItem.resulting_state?.formatted_cash}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] block text-ink-subtle">Ending Savings:</span>
                        <span className="text-ink font-semibold">
                          {evalItem.after?.formatted_savings || evalItem.resulting_state?.formatted_savings}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-edge">
              <button
                onClick={() => setCurrentStage('STAGE_4_OUTCOME')}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition"
              >
                ← Back to Outcome
              </button>

              <button
                onClick={() => setCurrentStage('STAGE_6_LEARN')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <span>Proceed to Learn Principle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 6 — LEARN */}
        {currentStage === 'STAGE_6_LEARN' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-forest/10 border border-forest/30 space-y-4 fade-up-stagger">
              <div className="flex items-center space-x-2 text-forest font-bold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Stage 6 — Core Financial Principle & Strategic Takeaway</span>
              </div>

              <h3 className="font-serif text-lg font-bold text-ink">
                What this simulation scenario teaches you:
              </h3>

              <p className="text-sm text-ink leading-relaxed font-medium">
                {selectedEvaluation?.educational_verdict || selectedEvaluation?.educational_takeaway || activeScenario?.learning_objective}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3.5 bg-canvas-white rounded-xl border border-edge space-y-1">
                  <strong className="text-forest block">Strategic Rule:</strong>
                  <p className="text-ink-muted leading-relaxed">
                    Always maintain 3 to 6 months of living expenses in an unencumbered savings vault before committing significant surplus capital into volatile markets.
                  </p>
                </div>

                <div className="p-3.5 bg-canvas-white rounded-xl border border-edge space-y-1">
                  <strong className="text-copper block">Opportunity Cost Awareness:</strong>
                  <p className="text-ink-muted leading-relaxed">
                    Emergency funds have low nominal yields, but their real return is preventing high-interest debt or selling investments during drawdowns.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-edge">
              <button
                onClick={() => setCurrentStage('STAGE_5_COMPARE')}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition"
              >
                ← Back to Comparison
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRestartScenario}
                  className="px-4 py-2 rounded-xl bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-xs font-semibold transition"
                >
                  Replay This Scenario
                </button>

                <button
                  onClick={handleNextScenario}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
                >
                  <span>Advance to Next Scenario</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
