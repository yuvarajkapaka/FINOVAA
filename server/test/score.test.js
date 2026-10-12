import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLiteracyScore,
  recordSimulationActivity,
  recordInvestmentLearningActivity,
  submitInvestmentLiteracyCheck,
  INVESTMENT_LITERACY_CHECK_QUESTIONS
} from '../src/services/scoreService.js';
import { buyAsset, getPortfolio, getMarketAssets } from '../src/services/marketService.js';
import { getWallet, addIncome } from '../src/services/walletService.js';
import { createGoal } from '../src/services/goalService.js';
import { DEMO_USER_ID } from '../src/db/schema.js';

describe('FINOVA Phase 7: Financial Literacy Score & Leaderboard Test Suite', () => {

  test('Score Engine: Calculates 4 explicit categories with authoritative total <= 100', () => {
    const scoreData = calculateLiteracyScore(DEMO_USER_ID);

    assert.ok(scoreData.total_score >= 0 && scoreData.total_score <= 100.0, 'Total score must be between 0 and 100');
    assert.equal(scoreData.max_score, 100.0);

    const { savings_progress, financial_knowledge, decision_making, investment_learning } = scoreData.breakdown;

    // Verify Category A: Savings Progress (Max 30)
    assert.ok(savings_progress.score >= 0 && savings_progress.score <= 30.0);
    assert.equal(savings_progress.max_score, 30.0);

    // Verify Category B: Financial Knowledge (Max 25)
    assert.ok(financial_knowledge.score >= 0 && financial_knowledge.score <= 25.0);
    assert.equal(financial_knowledge.max_score, 25.0);

    // Verify Category C: Decision-Making (Max 25)
    assert.ok(decision_making.score >= 0 && decision_making.score <= 25.0);
    assert.equal(decision_making.max_score, 25.0);

    // Verify Category D: Investment Learning (Max 20)
    assert.ok(investment_learning.score >= 0 && investment_learning.score <= 20.0);
    assert.equal(investment_learning.max_score, 20.0);

    // Verify Sum Invariant
    const expectedTotal = Number((savings_progress.score + financial_knowledge.score + decision_making.score + investment_learning.score).toFixed(1));
    assert.equal(scoreData.total_score, expectedTotal);
  });

  test('Score Engine: Category maximums and total 100 cap cannot be breached', () => {
    const scoreData = calculateLiteracyScore(DEMO_USER_ID);

    assert.ok(scoreData.breakdown.savings_progress.score <= 30.0);
    assert.ok(scoreData.breakdown.financial_knowledge.score <= 25.0);
    assert.ok(scoreData.breakdown.decision_making.score <= 25.0);
    assert.ok(scoreData.breakdown.investment_learning.score <= 20.0);
    assert.ok(scoreData.total_score <= 100.0);
  });

  test('Savings Progress Fairness: Percentage-based milestone rewards, ignores empty goals', () => {
    const initialScore = calculateLiteracyScore(DEMO_USER_ID);
    const initialSavingsPts = initialScore.breakdown.savings_progress.score;

    // Creating a goal with 0 saved money should NOT inflate the score
    createGoal(DEMO_USER_ID, {
      name: 'Unfunded Empty Goal Test',
      target_amount: 50000,
      category: 'General'
    });

    const scoreAfterEmptyGoal = calculateLiteracyScore(DEMO_USER_ID);
    // Score should not increase simply because an empty goal was created!
    assert.ok(scoreAfterEmptyGoal.breakdown.savings_progress.score <= initialSavingsPts + 0.1);
  });

  test('Duplicate Prevention: Repeatedly recording the same simulation choice does not inflate score', () => {
    // Record action 1 time
    recordSimulationActivity(DEMO_USER_ID, 'SCN_UNEXPECTED_EXPENSE', 'CHOICE_A1', true);
    const score1 = calculateLiteracyScore(DEMO_USER_ID);

    // Record the exact same action 10 more times
    for (let i = 0; i < 10; i++) {
      recordSimulationActivity(DEMO_USER_ID, 'SCN_UNEXPECTED_EXPENSE', 'CHOICE_A1', true);
    }
    const score2 = calculateLiteracyScore(DEMO_USER_ID);

    // Points must be identical (strictly idempotent)
    assert.equal(score2.breakdown.decision_making.score, score1.breakdown.decision_making.score);
  });

  test('Duplicate Prevention: Repeatedly recording investment learning actions does not inflate score', () => {
    recordInvestmentLearningActivity(DEMO_USER_ID, 'EXPLORE_ASSET', 'EQUITY');
    const score1 = calculateLiteracyScore(DEMO_USER_ID);

    // Spam recording the exact same asset exploration
    for (let i = 0; i < 5; i++) {
      recordInvestmentLearningActivity(DEMO_USER_ID, 'EXPLORE_ASSET', 'EQUITY');
    }
    const score2 = calculateLiteracyScore(DEMO_USER_ID);

    assert.equal(score2.breakdown.investment_learning.score, score1.breakdown.investment_learning.score);
  });

  test('Wealth Independence: Adding cash or buying more investments gives 0 score increase', () => {
    const beforeScore = calculateLiteracyScore(DEMO_USER_ID);

    // Add ₹50,000 to wallet
    addIncome(DEMO_USER_ID, {
      amount: 50000,
      category: 'Bonus',
      description: 'Wealth Independence Test'
    });

    const afterCashScore = calculateLiteracyScore(DEMO_USER_ID);
    // Literacy score must NOT increase from having more money!
    assert.equal(afterCashScore.total_score, beforeScore.total_score);
    assert.equal(afterCashScore.breakdown.savings_progress.score, beforeScore.breakdown.savings_progress.score);
    assert.equal(afterCashScore.breakdown.investment_learning.score, beforeScore.breakdown.investment_learning.score);
  });

  test('Portfolio Independence: Higher investment market value or trading gives 0 score increase', () => {
    const beforeScore = calculateLiteracyScore(DEMO_USER_ID);

    const market = getMarketAssets();
    const asset = market.assets[0];

    // Buy units of the asset
    buyAsset(DEMO_USER_ID, {
      asset_id: asset.id,
      quantity: 5
    });

    const afterTradeScore = calculateLiteracyScore(DEMO_USER_ID);
    // Trading volume and portfolio holdings must NOT boost the Financial Literacy Score!
    assert.equal(afterTradeScore.breakdown.investment_learning.score, beforeScore.breakdown.investment_learning.score);
    assert.equal(afterTradeScore.total_score, beforeScore.total_score);
  });

  test('Investment Literacy Comprehension Check: Evaluates and grades answers on server', () => {
    // 1. Submit passing answers (all 4 correct)
    const passingResult = submitInvestmentLiteracyCheck(DEMO_USER_ID, {
      IL_Q1: 'A',
      IL_Q2: 'B',
      IL_Q3: 'A',
      IL_Q4: 'B'
    });

    assert.equal(passingResult.success, true);
    assert.equal(passingResult.passed, true);
    assert.equal(passingResult.score, 4);
    assert.equal(passingResult.total_questions, 4);

    // Verify investment score received the 4.0 literacy check points
    const score = calculateLiteracyScore(DEMO_USER_ID);
    assert.equal(score.breakdown.investment_learning.has_passed_check, true);
    assert.equal(score.breakdown.investment_learning.literacy_check_pts, 4.0);

    // 2. Submit failing answers
    const failingResult = submitInvestmentLiteracyCheck(DEMO_USER_ID, {
      IL_Q1: 'C',
      IL_Q2: 'C',
      IL_Q3: 'C',
      IL_Q4: 'C'
    });
    assert.equal(failingResult.passed, false);
    assert.equal(failingResult.score, 0);
  });

  test('Milestones: Returns transparent completed milestones and next recommendations', () => {
    const scoreData = calculateLiteracyScore(DEMO_USER_ID);

    assert.ok(scoreData.milestones.total >= 8);
    assert.ok(typeof scoreData.milestones.completed_count === 'number');
    assert.ok(Array.isArray(scoreData.milestones.all));
    assert.ok(Array.isArray(scoreData.milestones.next_recommendations));
    assert.ok(scoreData.disclaimer.includes('educational progress'));
  });

});
