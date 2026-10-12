import { getDatabase } from '../db/database.js';
import { DEMO_USER_ID } from '../db/schema.js';
import { getGoals } from './goalService.js';
import { calculateKnowledgeScore } from './academyService.js';
import { SCENARIOS } from '../data/scenariosData.js';

// Predefined Investment Literacy Comprehension Check Questions (Server-Graded)
export const INVESTMENT_LITERACY_CHECK_QUESTIONS = [
  {
    id: 'IL_Q1',
    question: 'Why does asset allocation across equities, debt, and gold reduce overall portfolio risk?',
    options: [
      { id: 'A', text: 'Different asset classes react differently to economic cycles, dampening overall volatility.' },
      { id: 'B', text: 'It guarantees that you will never experience any paper losses.' },
      { id: 'C', text: 'It doubles your investment returns instantly.' },
      { id: 'D', text: 'It eliminates the need for an emergency fund.' }
    ],
    correct_option: 'A',
    explanation: 'Uncorrelated or negatively correlated asset classes behave differently in different economic environments, smoothing portfolio returns.'
  },
  {
    id: 'IL_Q2',
    question: 'What is the primary difference between an unrealized paper loss and a realized loss?',
    options: [
      { id: 'A', text: 'There is no difference; both permanently deduct cash from your wallet.' },
      { id: 'B', text: 'An unrealized loss is a temporary market value fluctuation on paper; it only becomes permanent when you sell.' },
      { id: 'C', text: 'An unrealized loss cannot be recovered even if the market rebounds.' },
      { id: 'D', text: 'Realized losses are automatically refunded by the market.' }
    ],
    correct_option: 'B',
    explanation: 'A market downturn reduces portfolio valuation on paper. Selling in panic locks in the loss permanently.'
  },
  {
    id: 'IL_Q3',
    question: 'Why does having more money NOT grant a higher Financial Literacy Score in FINOVA?',
    options: [
      { id: 'A', text: 'Financial literacy measures sound habits, understanding, and disciplined decisions—not arbitrary wealth.' },
      { id: 'B', text: 'FINOVA randomly assigns scores to all users.' },
      { id: 'C', text: 'Higher wealth always indicates poor decision-making.' },
      { id: 'D', text: 'Wealthy users are disqualified from the leaderboard.' }
    ],
    correct_option: 'A',
    explanation: 'True financial capability is built on principles, consistent goal progress, and prudent decision-making, regardless of initial capital.'
  },
  {
    id: 'IL_Q4',
    question: 'When a market correction causes asset prices to drop, what is the effect of dollar-cost averaging / buying the dip?',
    options: [
      { id: 'A', text: 'It guarantees that prices will rebound within 24 hours.' },
      { id: 'B', text: 'It lowers your average purchase cost per unit over time, positioning you for higher recovery upside.' },
      { id: 'C', text: 'It converts liquid cash into immediate debt.' },
      { id: 'D', text: 'It increases your risk of catastrophic liquidation.' }
    ],
    correct_option: 'B',
    explanation: 'Accumulating quality index units at lower prices reduces your cost basis and accelerates recovery compounding.'
  }
];

/**
 * Calculates the complete, transparent Financial Literacy & Smart Decisions Score
 * out of 100.0, strictly backend-verified from underlying database progress.
 *
 * Scoring Rubric (100.0 Max):
 * A. Savings Progress: 30.0 pts (Goal progress %, Emergency cushion, independent of raw wealth)
 * B. Financial Knowledge: 25.0 pts (Academy lesson reading completion + quiz mastery)
 * C. Decision-Making: 25.0 pts (Life simulation scenario replays & trade-off comparisons)
 * D. Investment Learning: 20.0 pts (Asset class review, allocation audit, cycle literacy check)
 */
export function calculateLiteracyScore(userId = DEMO_USER_ID) {
  const db = getDatabase();

  // =========================================================================
  // CATEGORY A: SAVINGS PROGRESS (30.0 POINTS MAX)
  // =========================================================================
  const goalsData = getGoals(userId);
  const emergencyGoal = goalsData.goals.find(g => g.is_emergency_fund) || null;
  const nonEmergencyGoals = goalsData.goals.filter(g => !g.is_emergency_fund && g.target_amount_paise > 0);

  // 1. Emergency Fund Anchor (15.0 pts max)
  let emergencyProgressPct = 0;
  let emergencyPoints = 0;
  if (emergencyGoal && emergencyGoal.target_amount_paise > 0) {
    const savedPaise = emergencyGoal.current_amount_paise || emergencyGoal.saved_amount_paise || 0;
    emergencyProgressPct = Math.min(100, (savedPaise / emergencyGoal.target_amount_paise) * 100);
    emergencyPoints = Math.min(15.0, Number(((emergencyProgressPct / 100) * 15.0).toFixed(1)));
  }

  // 2. Active Goal Progress (15.0 pts max)
  // Ignore empty goals (0% progress earns 0 pts; creating empty goals yields 0 advantage)
  let nonEmergencyPoints = 0;
  let avgGoalProgressPct = 0;
  if (nonEmergencyGoals.length > 0) {
    const totalProgressPct = nonEmergencyGoals.reduce((sum, g) => {
      const savedPaise = g.current_amount_paise || g.saved_amount_paise || 0;
      const pct = Math.min(100, (savedPaise / g.target_amount_paise) * 100);
      return sum + pct;
    }, 0);
    avgGoalProgressPct = totalProgressPct / nonEmergencyGoals.length;
    nonEmergencyPoints = Math.min(15.0, Number(((avgGoalProgressPct / 100) * 15.0).toFixed(1)));
  }

  const categoryASavingsScore = Math.min(30.0, Number((emergencyPoints + nonEmergencyPoints).toFixed(1)));

  // =========================================================================
  // CATEGORY B: FINANCIAL KNOWLEDGE (25.0 POINTS MAX)
  // =========================================================================
  const academyProgress = calculateKnowledgeScore(userId);
  const categoryBKnowledgeScore = Math.min(25.0, Number(academyProgress.financial_knowledge_score.toFixed(1)));

  // =========================================================================
  // CATEGORY C: DECISION-MAKING & LIFE SIMULATOR (25.0 POINTS MAX)
  // =========================================================================
  // 1. Unique Scenarios Explored (15.0 pts max: 5 scenarios * 3.0 pts)
  const distinctScenariosRow = db.prepare(`
    SELECT COUNT(DISTINCT scenario_id) as count
    FROM simulation_completed_actions
    WHERE user_id = ?
  `).get(userId);
  const distinctScenariosCount = distinctScenariosRow ? distinctScenariosRow.count : 0;
  const scenarioExplorationPoints = Math.min(15.0, Number((distinctScenariosCount * 3.0).toFixed(1)));

  // 2. Trade-Off Comparison Exploration (10.0 pts max: 5 scenarios * 2.0 pts)
  // Awards points when user has explored at least 2 distinct choices in a scenario
  const scenarioChoicesCounts = db.prepare(`
    SELECT scenario_id, COUNT(DISTINCT choice_id) as choices_count
    FROM simulation_completed_actions
    WHERE user_id = ?
    GROUP BY scenario_id
  `).all(userId);

  const comparedScenariosCount = scenarioChoicesCounts.filter(r => r.choices_count >= 2).length;
  const tradeoffComparisonPoints = Math.min(10.0, Number((comparedScenariosCount * 2.0).toFixed(1)));

  const categoryCDecisionScore = Math.min(25.0, Number((scenarioExplorationPoints + tradeoffComparisonPoints).toFixed(1)));

  // =========================================================================
  // CATEGORY D: INVESTMENT LEARNING (20.0 POINTS MAX)
  // =========================================================================
  const learningActions = db.prepare(`
    SELECT activity_type, activity_key
    FROM investment_learning_actions
    WHERE user_id = ?
  `).all(userId);

  // 1. Asset Class Explorations (8.0 pts max: 4 categories * 2.0 pts)
  const exploredAssetClasses = new Set(
    learningActions.filter(a => a.activity_type === 'EXPLORE_ASSET').map(a => a.activity_key)
  );
  const assetClassPoints = Math.min(8.0, Number((exploredAssetClasses.size * 2.0).toFixed(1)));

  // 2. Asset Allocation & Diversification Audit (4.0 pts max)
  const hasAuditedAllocation = learningActions.some(a => a.activity_type === 'AUDIT_ALLOCATION');
  const allocationAuditPoints = hasAuditedAllocation ? 4.0 : 0.0;

  // 3. Market Cycle Review & Advance (4.0 pts max)
  const hasReviewedCycle = learningActions.some(a => a.activity_type === 'ADVANCE_CYCLE');
  const marketCyclePoints = hasReviewedCycle ? 4.0 : 0.0;

  // 4. Investment Literacy Comprehension Check (4.0 pts max)
  const hasPassedLiteracyCheck = learningActions.some(a => a.activity_type === 'LITERACY_CHECK');
  const literacyCheckPoints = hasPassedLiteracyCheck ? 4.0 : 0.0;

  const categoryDInvestmentScore = Math.min(
    20.0,
    Number((assetClassPoints + allocationAuditPoints + marketCyclePoints + literacyCheckPoints).toFixed(1))
  );

  // =========================================================================
  // TOTAL FINANCIAL LITERACY SCORE (100.0 POINTS MAX)
  // =========================================================================
  const totalScore = Math.min(
    100.0,
    Number((categoryASavingsScore + categoryBKnowledgeScore + categoryCDecisionScore + categoryDInvestmentScore).toFixed(1))
  );

  // Determine Tier and Mastery Badge
  let tier = 'Financial Novice';
  let tierBadge = 'Novice';
  let tierDescription = 'Building financial awareness and understanding core money basics.';
  let tierColor = 'text-slate-400';

  if (totalScore >= 85.0) {
    tier = 'Financial Strategist';
    tierBadge = 'Master Strategist';
    tierDescription = 'Exemplary mastery across emergency defense, diversification, and rational decision-making.';
    tierColor = 'text-emerald-400';
  } else if (totalScore >= 65.0) {
    tier = 'Smart Planner';
    tierBadge = 'Advanced Planner';
    tierDescription = 'Strong financial discipline with healthy emergency buffers and structured goals.';
    tierColor = 'text-teal-400';
  } else if (totalScore >= 40.0) {
    tier = 'Prudent Apprentice';
    tierBadge = 'Apprentice';
    tierDescription = 'Solid foundational money habits with growing investment literacy.';
    tierColor = 'text-indigo-400';
  }

  // Calculate Progress Since Last Recorded Score
  const lastScoreRow = db.prepare(`
    SELECT total_score, recorded_at
    FROM score_history
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(userId);

  const previousScore = lastScoreRow ? lastScoreRow.total_score : totalScore;
  const scoreDelta = Number((totalScore - previousScore).toFixed(1));

  // Record this score milestone in history
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO score_history (user_id, total_score, savings_score, knowledge_score, decision_score, investment_score, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, totalScore, categoryASavingsScore, categoryBKnowledgeScore, categoryCDecisionScore, categoryDInvestmentScore, now);

  // Milestones Progress List
  const milestones = [
    {
      id: 'MS_EMERGENCY_START',
      title: 'Emergency Cushion Activated',
      category: 'Savings',
      points: 5.0,
      completed: emergencyProgressPct > 0,
      description: 'Start funding a dedicated emergency fund goal.'
    },
    {
      id: 'MS_EMERGENCY_FULL',
      title: 'Full Emergency Shield (100%)',
      category: 'Savings',
      points: 15.0,
      completed: emergencyProgressPct >= 100,
      description: 'Complete 100% of your emergency buffer goal.'
    },
    {
      id: 'MS_ACADEMY_FIRST',
      title: 'First Lesson Completed',
      category: 'Knowledge',
      points: 1.0,
      completed: academyProgress.completed_lessons_count >= 1,
      description: 'Read your first lesson in the Invest Academy.'
    },
    {
      id: 'MS_ACADEMY_HALF',
      title: 'Academy Midpoint (8+ Lessons)',
      category: 'Knowledge',
      points: 12.5,
      completed: academyProgress.completed_lessons_count >= 8,
      description: 'Complete at least 8 curated financial lessons.'
    },
    {
      id: 'MS_ACADEMY_MASTER',
      title: 'Academy Scholar (All 15 Lessons)',
      category: 'Knowledge',
      points: 25.0,
      completed: academyProgress.completed_lessons_count >= 15 && academyProgress.financial_knowledge_score >= 20,
      description: 'Complete all 15 lessons and score high on quizzes.'
    },
    {
      id: 'MS_SIM_FIRST',
      title: 'First Scenario Replay',
      category: 'Decision-Making',
      points: 3.0,
      completed: distinctScenariosCount >= 1,
      description: 'Replay your first dilemma in the Life Simulator.'
    },
    {
      id: 'MS_SIM_ALL',
      title: 'Scenario Mastery (All 5 Replayed)',
      category: 'Decision-Making',
      points: 15.0,
      completed: distinctScenariosCount >= 5,
      description: 'Experience all 5 deterministic life scenarios.'
    },
    {
      id: 'MS_SIM_TRADEOFFS',
      title: 'Trade-Off Analyst',
      category: 'Decision-Making',
      points: 10.0,
      completed: comparedScenariosCount >= 3,
      description: 'Compare side-by-side decisions across 3+ scenarios.'
    },
    {
      id: 'MS_ASSET_EXPLORER',
      title: 'Asset Class Explorer',
      category: 'Investment Learning',
      points: 8.0,
      completed: exploredAssetClasses.size >= 4,
      description: 'Explore Equity, Debt, Gold, and ETF asset classes.'
    },
    {
      id: 'MS_ALLOCATION_AUDIT',
      title: 'Portfolio Allocation Review',
      category: 'Investment Learning',
      points: 4.0,
      completed: hasAuditedAllocation,
      description: 'Review portfolio asset allocation breakdown.'
    },
    {
      id: 'MS_LITERACY_CHECK',
      title: 'Investment Literacy Certified',
      category: 'Investment Learning',
      points: 4.0,
      completed: hasPassedLiteracyCheck,
      description: 'Pass the Investment Literacy Comprehension Check.'
    }
  ];

  const completedMilestonesCount = milestones.filter(m => m.completed).length;
  const nextMilestones = milestones.filter(m => !m.completed).slice(0, 3);

  return {
    total_score: totalScore,
    max_score: 100.0,
    score_percentage: Math.round(totalScore),
    score_delta: scoreDelta,
    tier,
    tier_badge: tierBadge,
    tier_description: tierDescription,
    tier_color: tierColor,
    breakdown: {
      savings_progress: {
        category_name: 'Savings Progress',
        score: categoryASavingsScore,
        max_score: 30.0,
        percentage: Math.round((categoryASavingsScore / 30.0) * 100),
        emergency_points: emergencyPoints,
        emergency_max: 15.0,
        emergency_progress_pct: Math.round(emergencyProgressPct),
        goal_points: nonEmergencyPoints,
        goal_max: 15.0,
        avg_goal_progress_pct: Math.round(avgGoalProgressPct),
        description: 'Measures progress toward your emergency cushion and target goals using percentage milestones, completely independent of total starting money.'
      },
      financial_knowledge: {
        category_name: 'Financial Knowledge',
        score: categoryBKnowledgeScore,
        max_score: 25.0,
        percentage: Math.round((categoryBKnowledgeScore / 25.0) * 100),
        reading_score: academyProgress.lesson_reading_score,
        reading_max: 10.0,
        quiz_score: academyProgress.quiz_mastery_score,
        quiz_max: 15.0,
        completed_lessons: academyProgress.completed_lessons_count,
        total_lessons: 15,
        description: 'Directly derived from the 15 Academy curriculum lessons and server-graded quiz comprehension.'
      },
      decision_making: {
        category_name: 'Decision-Making',
        score: categoryCDecisionScore,
        max_score: 25.0,
        percentage: Math.round((categoryCDecisionScore / 25.0) * 100),
        scenarios_explored: distinctScenariosCount,
        total_scenarios: 5,
        scenarios_pts: scenarioExplorationPoints,
        scenarios_max: 15.0,
        comparisons_made: comparedScenariosCount,
        comparisons_pts: tradeoffComparisonPoints,
        comparisons_max: 10.0,
        description: 'Rewards evaluating real-world dilemma scenarios and exploring side-by-side decision trade-offs.'
      },
      investment_learning: {
        category_name: 'Investment Learning',
        score: categoryDInvestmentScore,
        max_score: 20.0,
        percentage: Math.round((categoryDInvestmentScore / 20.0) * 100),
        asset_classes_explored: exploredAssetClasses.size,
        asset_classes_max: 4,
        asset_class_pts: assetClassPoints,
        asset_class_max: 8.0,
        has_audited_allocation: hasAuditedAllocation,
        allocation_pts: allocationAuditPoints,
        allocation_max: 4.0,
        has_reviewed_cycle: hasReviewedCycle,
        cycle_pts: marketCyclePoints,
        cycle_max: 4.0,
        has_passed_check: hasPassedLiteracyCheck,
        literacy_check_pts: literacyCheckPoints,
        literacy_check_max: 4.0,
        description: 'Rewards reviewing asset classes, auditing allocation, and mastering market dynamics. Zero points for portfolio wealth or trading volume.'
      }
    },
    milestones: {
      total: milestones.length,
      completed_count: completedMilestonesCount,
      all: milestones,
      next_recommendations: nextMilestones
    },
    disclaimer: 'The Financial Literacy Score measures educational progress, conceptual understanding, and disciplined habits. It is strictly non-monetary and does not reflect investment return or guarantee future financial outcomes.'
  };
}

/**
 * Records a completed simulation replay action with duplicate prevention.
 */
export function recordSimulationActivity(userId = DEMO_USER_ID, scenarioId, choiceId, reviewedTradeoffs = true) {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO simulation_completed_actions (user_id, scenario_id, choice_id, reviewed_tradeoffs, completed_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(userId, scenarioId, choiceId, reviewedTradeoffs ? 1 : 0, now);
}

/**
 * Records an investment learning activity with duplicate prevention.
 */
export function recordInvestmentLearningActivity(userId = DEMO_USER_ID, activityType, activityKey) {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO investment_learning_actions (user_id, activity_type, activity_key, completed_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(userId, activityType, activityKey, now);
}

/**
 * Submits and server-grades the Investment Literacy Comprehension Check.
 */
export function submitInvestmentLiteracyCheck(userId = DEMO_USER_ID, answers = {}) {
  const db = getDatabase();
  let correctCount = 0;
  const questionsCount = INVESTMENT_LITERACY_CHECK_QUESTIONS.length;
  const feedback = [];

  for (const q of INVESTMENT_LITERACY_CHECK_QUESTIONS) {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.correct_option;
    if (isCorrect) correctCount++;

    feedback.push({
      question_id: q.id,
      question: q.question,
      user_answer: userAnswer || null,
      correct_answer: q.correct_option,
      is_correct: isCorrect,
      explanation: q.explanation
    });
  }

  const passed = correctCount >= Math.ceil(questionsCount * 0.75); // 75% passing threshold (3 of 4)

  if (passed) {
    recordInvestmentLearningActivity(userId, 'LITERACY_CHECK', 'COMPREHENSION_EXAM');
  }

  return {
    success: true,
    passed,
    score: correctCount,
    total_questions: questionsCount,
    percentage: Math.round((correctCount / questionsCount) * 100),
    feedback,
    updated_literacy_score: calculateLiteracyScore(userId)
  };
}
