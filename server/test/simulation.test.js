import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getWallet } from '../src/services/walletService.js';
import { getGoals } from '../src/services/goalService.js';
import { getPortfolio } from '../src/services/marketService.js';
import {
  getScenarios,
  getFinancialSnapshot,
  evaluateScenario,
  evaluateChoice
} from '../src/services/simulationService.js';
import { DEMO_USER_ID } from '../src/db/schema.js';

describe('FINOVA Phase 6: Financial-Life Simulation & Decision Replay Test Suite', () => {

  test('Simulation: Catalog returns all 5 deterministic educational scenarios', () => {
    const scenarios = getScenarios();
    assert.equal(scenarios.length, 5);

    const ids = scenarios.map(s => s.id);
    assert.ok(ids.includes('SCN_UNEXPECTED_EXPENSE'), 'Must include Unexpected Expense');
    assert.ok(ids.includes('SCN_INCOME_SHOCK'), 'Must include Income Shock');
    assert.ok(ids.includes('SCN_GOAL_DEADLINE'), 'Must include Goal Deadline');
    assert.ok(ids.includes('SCN_MARKET_DOWNTURN'), 'Must include Market Downturn');
    assert.ok(ids.includes('SCN_FINANCIAL_WINDFALL'), 'Must include Financial Opportunity');

    for (const s of scenarios) {
      assert.ok(s.title && s.title.length > 5);
      assert.ok(s.learning_objective);
      assert.ok(s.choices.length >= 3);
      for (const c of s.choices) {
        assert.ok(['Goal-Aligned', 'Budget-Aware', 'Goal Trade-Off', 'Liquidity Preserved', 'Learning Opportunity'].includes(c.label));
      }
    }
  });

  test('Simulation: Snapshot captures complete financial state without altering accounts', () => {
    const walletBefore = getWallet(DEMO_USER_ID);
    const goalsBefore = getGoals(DEMO_USER_ID);
    const portfolioBefore = getPortfolio(DEMO_USER_ID);

    const snapshot = getFinancialSnapshot(DEMO_USER_ID);

    // Verify snapshot fields match active state
    assert.equal(snapshot.cash_paise, walletBefore.balances.current_balance_paise);
    assert.equal(snapshot.savings_paise, walletBefore.balances.savings_balance_paise);
    assert.equal(snapshot.investments_market_value_paise, portfolioBefore.valuation.total_investments_market_value_paise);
    assert.equal(snapshot.total_virtual_wealth_paise, portfolioBefore.valuation.total_virtual_wealth_paise);

    // Verify database accounts are untouched
    const walletAfter = getWallet(DEMO_USER_ID);
    assert.equal(walletAfter.balances.current_balance_paise, walletBefore.balances.current_balance_paise);
  });

  test('Simulation: Unexpected Expense evaluates alternative choices from identical snapshot', () => {
    const result = evaluateScenario(DEMO_USER_ID, 'SCN_UNEXPECTED_EXPENSE');
    assert.ok(result.snapshot);
    assert.equal(result.side_by_side_evaluations.length, 3);

    const choiceA1 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_A1');
    const choiceA2 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_A2');
    const choiceA3 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_A3');

    // Choice A1: Uses savings cushion -> Cash is preserved, savings decreases
    assert.equal(choiceA1.deltas.cash_delta_paise, 0);
    assert.equal(choiceA1.deltas.savings_delta_paise, -800000);
    assert.equal(choiceA1.label, 'Liquidity Preserved');

    // Choice A2: Uses liquid cash -> Cash decreases, savings is preserved
    assert.equal(choiceA2.deltas.cash_delta_paise, -800000);
    assert.equal(choiceA2.deltas.savings_delta_paise, 0);
    assert.equal(choiceA2.label, 'Budget-Aware');

    // Choice A3: Liquidates investments -> Learning opportunity
    assert.equal(choiceA3.label, 'Learning Opportunity');
    assert.ok(choiceA3.educational_verdict.length > 10);
  });

  test('Simulation: Income Reduction correctly calculates discretionary expense adjustments', () => {
    const result = evaluateScenario(DEMO_USER_ID, 'SCN_INCOME_SHOCK', 'CHOICE_B1');
    assert.equal(result.selected_choice_id, 'CHOICE_B1');
    assert.ok(result.selected_evaluation);

    // Choice B1 trims non-essentials: net cash impact is only -₹3,000 instead of -₹10,000
    assert.equal(result.selected_evaluation.deltas.cash_delta_paise, -300000);
    assert.equal(result.selected_evaluation.deltas.savings_delta_paise, 0);
    assert.equal(result.selected_evaluation.label, 'Budget-Aware');

    // Choice B2 draws from savings
    const choiceB2 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_B2');
    assert.equal(choiceB2.deltas.savings_delta_paise, -1000000);
    assert.equal(choiceB2.label, 'Liquidity Preserved');
  });

  test('Simulation: Savings Goal Deadline evaluates timeline extension vs emergency cushion raiding', () => {
    const result = evaluateScenario(DEMO_USER_ID, 'SCN_GOAL_DEADLINE');

    // Choice C1: Funds goal from cash
    const choiceC1 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_C1');
    assert.equal(choiceC1.deltas.cash_delta_paise, -1200000);
    assert.equal(choiceC1.deltas.savings_delta_paise, 1200000);
    assert.equal(choiceC1.deltas.wealth_delta_paise, 0, 'Wealth preserved at transfer');
    assert.equal(choiceC1.goal_progress.completed, true);
    assert.equal(choiceC1.label, 'Goal-Aligned');

    // Choice C2: Extends deadline by 60 days
    const choiceC2 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_C2');
    assert.equal(choiceC2.deltas.cash_delta_paise, 0);
    assert.equal(choiceC2.deltas.savings_delta_paise, 0);
    assert.equal(choiceC2.goal_progress.extended_days, 60);
    assert.equal(choiceC2.label, 'Goal Trade-Off');

    // Choice C3: Raids emergency cushion
    const choiceC3 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_C3');
    assert.equal(choiceC3.label, 'Learning Opportunity');
  });

  test('Simulation: Simulated Market Downturn evaluates buy-the-dip vs panic selling', () => {
    const result = evaluateScenario(DEMO_USER_ID, 'SCN_MARKET_DOWNTURN');

    const choiceD1 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_D1');
    const choiceD2 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_D2');
    const choiceD3 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_D3');

    // D1: Hold course -> Paper drop, zero cash change
    assert.equal(choiceD1.deltas.cash_delta_paise, 0);
    assert.equal(choiceD1.label, 'Goal-Aligned');

    // D2: Buy the dip -> Cash decreases by ₹10,000, invested into discounted units
    assert.equal(choiceD2.deltas.cash_delta_paise, -1000000);
    assert.equal(choiceD2.label, 'Budget-Aware');

    // D3: Panic sell -> Realizes losses, liquidates equity to cash
    assert.ok(choiceD3.deltas.cash_delta_paise > 0);
    assert.equal(choiceD3.label, 'Learning Opportunity');
    assert.ok(choiceD3.educational_verdict.includes('Panic-selling') || choiceD3.educational_verdict.includes('panic'));
  });

  test('Simulation: Financial Opportunity windfall tests 100% emergency vs balanced split', () => {
    const result = evaluateScenario(DEMO_USER_ID, 'SCN_FINANCIAL_WINDFALL');

    const choiceE1 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_E1');
    const choiceE2 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_E2');
    const choiceE3 = result.side_by_side_evaluations.find(e => e.choice_id === 'CHOICE_E3');

    // All choices increase total wealth by the windfall amount (+₹25,000 = +2,500,000 paise)
    assert.equal(choiceE1.deltas.wealth_delta_paise, 2500000);
    assert.equal(choiceE2.deltas.wealth_delta_paise, 2500000);
    assert.equal(choiceE3.deltas.wealth_delta_paise, 2500000);

    // E1 is 100% savings buffer
    assert.equal(choiceE1.deltas.savings_delta_paise, 2500000);
    assert.equal(choiceE1.label, 'Liquidity Preserved');

    // E2 is 50/50 split (12,500 savings + 12,500 investments)
    assert.equal(choiceE2.deltas.savings_delta_paise, 1250000);
    assert.equal(choiceE2.deltas.investments_delta_paise, 1250000);
    assert.equal(choiceE2.label, 'Goal-Aligned');

    // E3 is 100% equity investments
    assert.equal(choiceE3.deltas.investments_delta_paise, 2500000);
  });

  test('Simulation Data Integrity: Evaluating scenarios never modifies actual wallet, goals, or ledger', () => {
    const walletBefore = getWallet(DEMO_USER_ID);
    const portfolioBefore = getPortfolio(DEMO_USER_ID);
    const goalsBefore = getGoals(DEMO_USER_ID);

    // Evaluate all 5 scenarios multiple times
    evaluateScenario(DEMO_USER_ID, 'SCN_UNEXPECTED_EXPENSE', 'CHOICE_A2');
    evaluateScenario(DEMO_USER_ID, 'SCN_INCOME_SHOCK', 'CHOICE_B2');
    evaluateScenario(DEMO_USER_ID, 'SCN_GOAL_DEADLINE', 'CHOICE_C1');
    evaluateScenario(DEMO_USER_ID, 'SCN_MARKET_DOWNTURN', 'CHOICE_D3');
    evaluateScenario(DEMO_USER_ID, 'SCN_FINANCIAL_WINDFALL', 'CHOICE_E1');

    const walletAfter = getWallet(DEMO_USER_ID);
    const portfolioAfter = getPortfolio(DEMO_USER_ID);
    const goalsAfter = getGoals(DEMO_USER_ID);

    // Absolute zero deviation
    assert.equal(walletAfter.balances.current_balance_paise, walletBefore.balances.current_balance_paise);
    assert.equal(walletAfter.balances.savings_balance_paise, walletBefore.balances.savings_balance_paise);
    assert.equal(portfolioAfter.valuation.total_investments_market_value_paise, portfolioBefore.valuation.total_investments_market_value_paise);
    assert.equal(portfolioAfter.holdings.length, portfolioBefore.holdings.length);
    assert.equal(goalsAfter.summary.total_saved_paise, goalsBefore.summary.total_saved_paise);
  });

});
