import { Router } from 'express';
import {
  calculateLiteracyScore,
  recordInvestmentLearningActivity,
  submitInvestmentLiteracyCheck,
  INVESTMENT_LITERACY_CHECK_QUESTIONS
} from '../services/scoreService.js';
import { DEMO_USER_ID } from '../db/schema.js';

const router = Router();

/**
 * GET /api/score
 * Returns the authoritative 100-point Financial Literacy Score and category breakdowns.
 */
router.get('/score', (req, res, next) => {
  try {
    const scoreData = calculateLiteracyScore(DEMO_USER_ID);
    res.json({
      success: true,
      data: scoreData
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/leaderboard
 * Returns the personal progress board and educational milestone roadmap.
 */
router.get('/leaderboard', (req, res, next) => {
  try {
    const scoreData = calculateLiteracyScore(DEMO_USER_ID);

    // Personal Progress Board formatted response
    res.json({
      success: true,
      board: {
        user_id: DEMO_USER_ID,
        user_name: 'FINOVA Learner (Demo Session)',
        total_score: scoreData.total_score,
        max_score: 100.0,
        tier: scoreData.tier,
        tier_badge: scoreData.tier_badge,
        tier_description: scoreData.tier_description,
        score_delta: scoreData.score_delta,
        categories: [
          scoreData.breakdown.savings_progress,
          scoreData.breakdown.financial_knowledge,
          scoreData.breakdown.decision_making,
          scoreData.breakdown.investment_learning
        ],
        milestones: scoreData.milestones,
        cohort_benchmarks: {
          cohort_name: 'FINOVA Financial Literacy Cohort',
          average_score: 42.5,
          user_percentile: scoreData.total_score >= 80 ? 'Top 5%' : scoreData.total_score >= 60 ? 'Top 15%' : scoreData.total_score >= 40 ? 'Top 35%' : 'Top 50%',
          ranking_rule: 'Ranked purely by verified learning milestones, conceptual quizzes, and scenario replays. Portfolio wealth and trading returns NEVER alter standing.'
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/score/record-activity
 * Records an educational investment learning action (idempotent).
 *
 * Body: { activity_type: string, activity_key: string }
 */
router.post('/score/record-activity', (req, res, next) => {
  try {
    const { activity_type, activity_key } = req.body;

    if (!activity_type || !activity_key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: "activity_type" and "activity_key".'
      });
    }

    recordInvestmentLearningActivity(DEMO_USER_ID, activity_type, activity_key);

    const updatedScore = calculateLiteracyScore(DEMO_USER_ID);

    res.json({
      success: true,
      message: `Recorded learning activity "${activity_type}:${activity_key}".`,
      data: updatedScore
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/score/literacy-check
 * Retrieves the 4 sanitized Investment Literacy Comprehension Check questions.
 */
router.get('/score/literacy-check', (req, res, next) => {
  try {
    // Sanitize questions so correct answers are not leaked to client
    const sanitizedQuestions = INVESTMENT_LITERACY_CHECK_QUESTIONS.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    res.json({
      success: true,
      total_questions: sanitizedQuestions.length,
      questions: sanitizedQuestions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/score/literacy-check
 * Evaluates submitted comprehension check answers on the backend.
 *
 * Body: { answers: { [questionId: string]: string } }
 */
router.post('/score/literacy-check', (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Answers must be provided as an object mapping question IDs to option IDs.'
      });
    }

    const result = submitInvestmentLiteracyCheck(DEMO_USER_ID, answers);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
