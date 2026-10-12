import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  Target,
  GraduationCap,
  Compass,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Loader2,
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  Check,
  X
} from 'lucide-react';

export default function ScoreDashboardView({ onNavigateTab }) {
  const [scoreData, setScoreData] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPillarForDetails, setSelectedPillarForDetails] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [submittingExam, setSubmittingExam] = useState(false);

  const fetchScoreAndBoard = async () => {
    try {
      setLoading(true);
      const [scoreRes, boardRes] = await Promise.all([
        fetch('/api/score'),
        fetch('/api/leaderboard')
      ]);

      const scoreJson = await scoreRes.json();
      const boardJson = await boardRes.json();

      if (scoreJson.success) setScoreData(scoreJson.data);
      if (boardJson.success) setBoardData(boardJson.board);
    } catch (err) {
      console.error('Failed to load score dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreAndBoard();
  }, []);

  const openExamModal = async () => {
    try {
      setIsExamModalOpen(true);
      setExamResult(null);
      setUserAnswers({});
      const res = await fetch('/api/score/literacy-check');
      const data = await res.json();
      if (data.success) {
        setExamQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Failed to load exam questions:', err);
    }
  };

  const handleSelectExamOption = (questionId, optionId) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    try {
      setSubmittingExam(true);
      const res = await fetch('/api/score/literacy-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers })
      });
      const data = await res.json();
      setExamResult(data);
      if (data.passed) {
        fetchScoreAndBoard();
      }
    } catch (err) {
      console.error('Failed to submit exam:', err);
    } finally {
      setSubmittingExam(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink-muted">
        <Loader2 className="w-8 h-8 animate-spin text-forest" />
        <p className="text-sm font-medium">Computing 100-Point Financial Resilience Rubric...</p>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="p-8 text-center text-ink-muted bg-canvas-white border border-edge rounded-2xl shadow-sm">
        Failed to load Financial Literacy Score. Please refresh the page.
      </div>
    );
  }

  const { total_score, tier, tier_badge, tier_description, breakdown, milestones, disclaimer } = scoreData;
  const { savings_progress, financial_knowledge, decision_making, investment_learning } = breakdown;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-canvas-white border border-edge text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-forest/10 border border-forest/20 flex items-center justify-center flex-shrink-0 text-forest">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-ink text-sm">Money Skills Score</h4>
            <p className="text-ink-muted text-[11px] mt-0.5">{disclaimer}</p>
          </div>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-canvas-subtle text-forest border border-edge text-[11px] font-mono whitespace-nowrap font-bold">
          100-Point Scale
        </span>
      </div>

      {/* Hero Score Showcase Card */}
      <div className="bg-canvas-white border border-edge rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          {/* Left: Score Gauge & Tier */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Big Circular Score Pill */}
            <div className="relative flex items-center justify-center w-32 h-32 rounded-3xl bg-canvas-subtle border-2 border-forest/30 flex-shrink-0">
              <div className="text-center">
                <span className="text-4xl font-bold font-mono text-forest tracking-tight block">
                  {total_score}
                </span>
                <span className="text-[11px] text-ink-muted uppercase font-semibold tracking-wider block mt-0.5">
                  / 100 PTS
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2.5 mb-1.5">
                <span className="px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-xs font-bold text-forest">
                  {tier_badge}
                </span>
                <span className="text-xs text-ink-muted font-mono">
                  {boardData?.cohort_benchmarks?.user_percentile || 'Top 15%'} Cohort Benchmark
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
                {tier}
              </h2>
              <p className="text-ink-muted text-xs mt-1 leading-relaxed max-w-xl">
                {tier_description}
              </p>
            </div>
          </div>

          {/* Right: Milestone Progress Barometer */}
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge flex flex-col justify-between max-w-md w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-ink-muted font-mono font-semibold uppercase">
                Milestone Progress
              </span>
              <span className="text-xs text-forest font-bold font-mono">
                {milestones.completed_count} of {milestones.total} Badges Unlocked
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-edge overflow-hidden mb-3">
              <div
                className="h-full bg-forest transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (milestones.completed_count / milestones.total) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-ink-muted">
              {boardData?.cohort_benchmarks?.ranking_rule}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Category Score Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-base font-bold text-ink tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-forest" />
            <span>Money Skills Score Breakdown (4 Areas)</span>
          </h3>
          <span className="text-xs text-ink-muted font-mono">100.0 Maximum Points</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Savings Progress (30 pts) */}
          <div 
            onClick={() => setSelectedPillarForDetails('savings_progress')}
            className="bg-canvas-white border border-edge rounded-2xl p-5 flex flex-col justify-between hover:border-olive/60 hover:shadow-md transition cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-olive/10 border border-olive/20 text-olive group-hover:scale-105 transition">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-olive">
                  {savings_progress.score} / {savings_progress.max_score} pts
                </span>
              </div>
              <h4 className="font-serif text-sm font-bold text-ink group-hover:text-olive transition">Saving Money</h4>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {savings_progress.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-edge space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Emergency Cushion (15 max):</span>
                <span className="font-mono font-bold text-olive">{savings_progress.emergency_points} pts</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Target Goals (15 max):</span>
                <span className="font-mono font-bold text-olive">{savings_progress.goal_points} pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-canvas-subtle overflow-hidden mt-1 border border-edge">
                <div
                  className="h-full bg-olive rounded-full"
                  style={{ width: `${savings_progress.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-olive block pt-1 font-semibold">Click to view rules & actions →</span>
            </div>
          </div>

          {/* Pillar 2: Financial Knowledge (25 pts) */}
          <div 
            onClick={() => setSelectedPillarForDetails('financial_knowledge')}
            className="bg-canvas-white border border-edge rounded-2xl p-5 flex flex-col justify-between hover:border-forest/60 hover:shadow-md transition cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-forest/10 border border-forest/20 text-forest group-hover:scale-105 transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-forest">
                  {financial_knowledge.score} / {financial_knowledge.max_score} pts
                </span>
              </div>
              <h4 className="font-serif text-sm font-bold text-ink group-hover:text-forest transition">Learning About Money</h4>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {financial_knowledge.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-edge space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-ink-muted">
                <span>15 Lessons Read (10 max):</span>
                <span className="font-mono font-bold text-forest">{financial_knowledge.reading_score} pts</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Quiz Mastery (15 max):</span>
                <span className="font-mono font-bold text-forest">{financial_knowledge.quiz_score} pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-canvas-subtle overflow-hidden mt-1 border border-edge">
                <div
                  className="h-full bg-forest rounded-full"
                  style={{ width: `${financial_knowledge.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-forest block pt-1 font-semibold">Click to view rules & actions →</span>
            </div>
          </div>

          {/* Pillar 3: Decision-Making (25 pts) */}
          <div 
            onClick={() => setSelectedPillarForDetails('decision_making')}
            className="bg-canvas-white border border-edge rounded-2xl p-5 flex flex-col justify-between hover:border-copper/60 hover:shadow-md transition cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-copper/10 border border-copper/20 text-copper group-hover:scale-105 transition">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-copper">
                  {decision_making.score} / {decision_making.max_score} pts
                </span>
              </div>
              <h4 className="font-serif text-sm font-bold text-ink group-hover:text-copper transition">Making Good Decisions</h4>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {decision_making.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-edge space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Scenarios Replayed ({decision_making.scenarios_explored}/5):</span>
                <span className="font-mono font-bold text-copper">{decision_making.scenarios_pts} pts</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Alternative Analyses:</span>
                <span className="font-mono font-bold text-copper">{decision_making.comparisons_pts} pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-canvas-subtle overflow-hidden mt-1 border border-edge">
                <div
                  className="h-full bg-copper rounded-full"
                  style={{ width: `${decision_making.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-copper block pt-1 font-semibold">Click to view rules & actions →</span>
            </div>
          </div>

          {/* Pillar 4: Investment Learning (20 pts) */}
          <div 
            onClick={() => setSelectedPillarForDetails('investment_learning')}
            className="bg-canvas-white border border-edge rounded-2xl p-5 flex flex-col justify-between hover:border-forest/60 hover:shadow-md transition cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-forest/10 border border-forest/20 text-forest group-hover:scale-105 transition">
                  <PieIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-forest">
                  {investment_learning.score} / {investment_learning.max_score} pts
                </span>
              </div>
              <h4 className="font-serif text-sm font-bold text-ink group-hover:text-forest transition">Learning About Investments</h4>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {investment_learning.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-edge space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Asset Class Diversity:</span>
                <span className="font-mono font-bold text-forest">{investment_learning.diversity_pts} pts</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Comprehension Check:</span>
                <span className="font-mono font-bold text-forest">{investment_learning.exam_pts} pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-canvas-subtle overflow-hidden mt-1 border border-edge">
                <div
                  className="h-full bg-forest rounded-full"
                  style={{ width: `${investment_learning.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-forest block pt-1 font-semibold">Click to view rules & actions →</span>
            </div>
          </div>
        </div>
      </div>

      {/* INVESTMENT LITERACY COMPREHENSION CHECK MODAL */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-canvas-white border border-edge rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-canvas-subtle">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-forest" />
                <h3 className="font-serif text-sm font-bold text-ink">Investment Literacy Comprehension Check</h3>
              </div>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {!examResult ? (
                <form onSubmit={handleSubmitExam} className="space-y-6">
                  <p className="text-ink-muted">
                    Complete this 4-question check on asset allocation and market drawdowns to earn +4.0 points toward your Financial Resilience Score. You must answer at least 3 correctly to pass.
                  </p>

                  <div className="space-y-6">
                    {examQuestions.map((q, idx) => (
                      <div key={q.id} className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-3">
                        <span className="text-xs font-bold text-ink block font-serif">
                          Question {idx + 1}: {q.question}
                        </span>

                        <div className="space-y-2">
                          {q.options.map(opt => {
                            const isSelected = userAnswers[q.id] === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectExamOption(q.id, opt.id)}
                                className={`w-full p-2.5 rounded-lg border text-left flex items-start space-x-2.5 transition text-xs ${
                                  isSelected
                                    ? 'bg-forest/10 border-forest text-forest font-semibold'
                                    : 'bg-canvas-white border-edge text-ink hover:border-edge-dark'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                  isSelected ? 'bg-forest text-canvas-white' : 'bg-canvas-subtle text-ink-muted'
                                }`}>
                                  {opt.id}
                                </span>
                                <span>{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-edge">
                    <button
                      type="button"
                      onClick={() => setIsExamModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-ink-muted hover:text-ink transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingExam || Object.keys(userAnswers).length < examQuestions.length}
                      className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light disabled:opacity-40 text-canvas-white font-bold transition flex items-center space-x-2"
                    >
                      {submittingExam && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Submit & Grade Answers</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl border text-center ${
                    examResult.passed
                      ? 'bg-forest/10 border-forest text-forest'
                      : 'bg-copper/10 border-copper text-copper'
                  }`}>
                    <h4 className="font-serif text-base font-bold">
                      {examResult.passed ? 'Comprehension Check Passed!' : 'Need More Practice'}
                    </h4>
                    <p className="text-xs mt-1 text-ink-muted">
                      Score: {examResult.score} of {examResult.total_questions} correct ({examResult.percentage}%).
                      {examResult.passed ? ' +4.0 Points credited to Investment Learning!' : ' You need 3 correct answers to earn the badge.'}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-edge">
                    <button
                      onClick={() => setIsExamModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white font-bold transition"
                    >
                      Close & Return to Score
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PILLAR DETAILS INTERACTIVE MODAL */}
      {selectedPillarForDetails && (() => {
        const pillarKey = selectedPillarForDetails;
        const pillarData = breakdown[pillarKey];
        if (!pillarData) return null;

        const pillarMeta = {
          savings_progress: {
            title: 'Savings Progress & Emergency Cushion',
            maxPts: 30.0,
            icon: Target,
            tab: 'SAVINGS',
            actionText: 'Go to Savings & Reserves',
            rules: [
              { label: 'Emergency Cushion (15.0 pts max)', desc: 'Scored strictly by percentage funded of your emergency target. A full 3-6 month buffer awards maximum points.' },
              { label: 'Target-Based Goals (15.0 pts max)', desc: 'Rewards purposeful allocations toward education, technology, and vehicles. Unfunded or empty goals award 0 points.' },
              { label: 'Wealth Independence Rule', desc: 'Adding liquid cash to your wallet awards 0 points. Scoring strictly measures intentional savings behavior.' }
            ]
          },
          financial_knowledge: {
            title: 'Financial Knowledge & Academy Mastery',
            maxPts: 25.0,
            icon: GraduationCap,
            tab: 'ACADEMY',
            actionText: 'Go to Knowledge Center',
            rules: [
              { label: '15 Structured Lessons (10.0 pts max)', desc: 'Read and master core financial modules spanning budgeting, compounding, inflation, and strategy.' },
              { label: 'Server-Graded Quizzes (15.0 pts max)', desc: 'Earn up to 1.0 pt per passed quiz. Evaluated strictly on the server; retakes only count if your score improves.' },
              { label: 'Financial Integrity Rule', desc: 'Academy learning never impacts your wallet balance or savings. Learning is purely merit-based.' }
            ]
          },
          decision_making: {
            title: 'Decision-Making & Scenario Replay',
            maxPts: 25.0,
            icon: Compass,
            tab: 'SIMULATION',
            actionText: 'Launch Decision Lab',
            rules: [
              { label: '5 Life Scenarios (15.0 pts max)', desc: 'Experience medical shocks, pay cuts, goal deadlines, market downturns, and windfalls.' },
              { label: 'Alternative Comparisons (10.0 pts max)', desc: 'Compare side-by-side decision trade-offs against an immutable financial snapshot.' },
              { label: 'Non-Destructive Sandbox Rule', desc: 'Running replays tests your judgement with zero risk to your actual portfolio.' }
            ]
          },
          investment_learning: {
            title: 'Investment Learning & Asset Allocation',
            maxPts: 20.0,
            icon: PieIcon,
            tab: 'MARKET',
            actionText: 'Explore Investment Exchange',
            rules: [
              { label: 'Asset Class Diversity (8.0 pts max)', desc: 'Hold and understand 3 distinct asset classes: Equities & ETFs, Fixed Income & Bonds, and Gold.' },
              { label: 'Portfolio Allocation (8.0 pts max)', desc: 'Maintain disciplined asset allocation across liquid cash, debt securities, and growth assets.' },
              { label: 'Comprehension Exam (4.0 pts max)', desc: 'Pass the 4-question Investment Literacy Check exam on the server.' },
              { label: 'Zero Speculation Rule', desc: 'Higher portfolio valuation or trading volume awards 0 score points. Only disciplined diversification counts.' }
            ]
          }
        }[pillarKey];

        const Icon = pillarMeta.icon;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedPillarForDetails(null)}
          >
            <div
              className="w-full max-w-xl bg-canvas-white border border-edge rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-edge bg-canvas-subtle flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-forest/10 text-forest border border-forest/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-base font-bold text-ink">
                      {pillarMeta.title}
                    </h2>
                    <span className="text-xs text-ink-muted font-mono">
                      Current Score: <strong className="text-forest font-bold">{pillarData.score}</strong> / {pillarMeta.maxPts} pts ({pillarData.percentage}%)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPillarForDetails(null)}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs text-ink">
                <p className="text-xs leading-relaxed text-ink-muted bg-canvas-subtle p-3.5 rounded-xl border border-edge">
                  {pillarData.description}
                </p>

                {/* Rules & Calculation Breakdown */}
                <div className="space-y-2.5">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-forest" />
                    <span>Exact Rubric Calculation Rules</span>
                  </h4>
                  <div className="space-y-2">
                    {pillarMeta.rules.map((rule, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                        <span className="font-semibold text-ink block">{rule.label}</span>
                        <p className="text-[11px] text-ink-muted leading-relaxed">{rule.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How to Improve Action Box */}
                <div className="p-4 rounded-xl bg-forest/10 border border-forest/20 space-y-2">
                  <span className="font-serif font-bold text-ink text-xs block">
                    How to improve this score:
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Take concrete actions in the FINOVA platform. Your progress updates deterministically upon completion.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedPillarForDetails(null);
                      if (onNavigateTab) onNavigateTab(pillarMeta.tab);
                    }}
                    className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
                  >
                    <span>{pillarMeta.actionText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-edge bg-canvas-subtle flex justify-end">
                <button
                  onClick={() => setSelectedPillarForDetails(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
