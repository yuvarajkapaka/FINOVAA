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
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20">
              {activeScenario?.type || 'SHOCK'}
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
                    {snapshot?.formatted_available_cash || '₹0.00'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Emergency Savings</span>
                  <span className="font-mono text-base font-bold text-ink mt-0.5 block">
                    {snapshot?.formatted_savings || '₹0.00'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Your Investments</span>
                  <span className="font-mono text-base font-bold text-ink mt-0.5 block">
                    {snapshot?.formatted_portfolio_value || '₹0.00'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Money Skills Score</span>
                  <span className="font-mono text-base font-bold text-forest mt-0.5 block">
                    {snapshot?.literacy_score || '0.0'} / 100
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeScenario?.choices?.map((choice, idx) => {
                const isSelected = activeChoiceId === choice.id;

                return (
                  <div
                    key={choice.id}
                    onClick={() => setActiveChoiceId(choice.id)}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all duration-250 ease-out fade-up-stagger flex flex-col justify-between ${
                      isSelected
                        ? 'bg-canvas-white border-forest ring-2 ring-forest/30 shadow-md -translate-y-1'
                        : 'bg-canvas-subtle border-edge hover:border-forest/60 hover:bg-canvas-white hover:-translate-y-1 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase transition-colors duration-200 ${
                          isSelected ? 'bg-forest text-canvas-white border-forest' : 'bg-canvas-white text-ink-muted border-edge'
                        }`}>
                          Option {choice.id}
                        </span>
                        {isSelected && (
                          <span className="text-[11px] font-semibold text-forest flex items-center gap-1 animate-in fade-in duration-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-sm font-bold text-ink">
                        {choice.text}
                      </h4>

                      <p className="text-xs text-ink-muted leading-relaxed">
                        {choice.description || 'Applies deliberate balance reallocation to address the shock scenario.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-edge text-[11px] text-ink-muted flex items-center justify-between">
                      <span>Click to select option</span>
                      <ArrowRight className="w-3.5 h-3.5 text-forest" />
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
                  Simulated Outcome
                </span>
                <span className="text-xs text-ink font-semibold">
                  {selectedEvaluation.choice_text}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
                {selectedEvaluation.rationale}
              </p>
            </div>

            {/* Before vs After Quantitative Comparisons */}
            <div className="space-y-3">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink-muted">
                What Happened to Your Money • Before vs. After
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5 ${
                  selectedEvaluation.delta_cash > 0 ? 'highlight-pos' : selectedEvaluation.delta_cash < 0 ? 'highlight-neg' : ''
                }`}>
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Available Money</span>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-ink-muted text-xs">{selectedEvaluation.before?.formatted_cash}</span>
                    <span className="text-ink-subtle">→</span>
                    <span className="text-base font-bold text-ink">{selectedEvaluation.after?.formatted_cash}</span>
                  </div>
                  <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((selectedEvaluation.after?.cash_paise || 0) / Math.max(1, selectedEvaluation.before?.cash_paise || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5 ${
                  selectedEvaluation.delta_savings > 0 ? 'highlight-pos' : selectedEvaluation.delta_savings < 0 ? 'highlight-neg' : ''
                }`}>
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Emergency Savings</span>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-ink-muted text-xs">{selectedEvaluation.before?.formatted_savings}</span>
                    <span className="text-ink-subtle">→</span>
                    <span className="text-base font-bold text-ink">{selectedEvaluation.after?.formatted_savings}</span>
                  </div>
                  <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((selectedEvaluation.after?.savings_paise || 0) / Math.max(1, selectedEvaluation.before?.savings_paise || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">Total Money & Investments</span>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-ink-muted text-xs">{selectedEvaluation.before?.formatted_total}</span>
                    <span className="text-ink-subtle">→</span>
                    <span className="text-base font-bold text-forest">{selectedEvaluation.after?.formatted_total}</span>
                  </div>
                  <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((selectedEvaluation.after?.total_paise || 0) / Math.max(1, selectedEvaluation.before?.total_paise || 1)) * 100)}%` 
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluations.map((evalItem) => {
                const isCurrent = evalItem.choice_id === activeChoiceId;

                return (
                  <div
                    key={evalItem.choice_id}
                    className={`rounded-2xl border p-5 space-y-3 ${
                      isCurrent
                        ? 'bg-canvas-white border-forest shadow-sm ring-1 ring-forest/30'
                        : 'bg-canvas-subtle border-edge'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase font-mono">
                        Option {evalItem.choice_id}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-forest">
                          Your Selected Choice
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif text-xs font-bold text-ink">
                      {evalItem.choice_text}
                    </h4>

                    <p className="text-xs text-ink-muted leading-relaxed">
                      {evalItem.rationale}
                    </p>

                    <div className="pt-2 border-t border-edge text-xs font-mono grid grid-cols-2 gap-2 text-ink-muted">
                      <div>
                        <span className="text-[10px] block text-ink-subtle">Ending Available Money:</span>
                        <span className="text-ink font-semibold">{evalItem.after?.formatted_cash}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block text-ink-subtle">Ending Savings:</span>
                        <span className="text-ink font-semibold">{evalItem.after?.formatted_savings}</span>
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
                {selectedEvaluation?.educational_takeaway || 'Disciplined emergency funding prevents panic liquidations of growth assets.'}
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
