import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getWallet } from '../src/services/walletService.js';
import {
  getGoals,
  getEmergencyFund,
  createGoal,
  updateGoal,
  contributeToGoal,
  withdrawFromGoal,
  deleteGoal
} from '../src/services/goalService.js';
import { DEMO_USER_ID } from '../src/db/schema.js';

describe('FINOVA Phase 3: Savings Goals & Emergency Fund Test Suite', () => {

  test('Emergency Fund: Dedicated emergency goal is initialized with education', () => {
    const efData = getEmergencyFund(DEMO_USER_ID);
    assert.ok(efData.goal, 'Emergency fund goal should exist');
    assert.equal(efData.goal.is_emergency_fund, true);
    assert.equal(efData.goal.category, 'Emergency');
    assert.ok(efData.education.description.includes('emergency fund'));
    assert.ok(efData.education.key_principles.length > 0);
  });

  test('Goal Creation: Creating a goal starts with 0 funds and preserves total capital', () => {
    const beforeWallet = getWallet(DEMO_USER_ID);
    const beforeTotal = beforeWallet.balances.total_balance_paise;

    const res = createGoal(DEMO_USER_ID, {
      name: 'Tech Upgrade Laptop',
      target_amount: 50000,
      target_date: '2026-11-30',
      category: 'Gadget & Tech'
    });

    assert.equal(res.success, true);
    assert.ok(res.goal_id > 0);

    const afterWallet = getWallet(DEMO_USER_ID);
    // INVARIANT: Creating a goal MUST NOT alter balances or mint money
    assert.equal(afterWallet.balances.total_balance_paise, beforeTotal);
    assert.equal(afterWallet.balances.current_balance_paise, beforeWallet.balances.current_balance_paise);
  });

  test('Goal Update: Editing name and target amount recalculates progress', () => {
    const allGoals = getGoals(DEMO_USER_ID);
    const customGoal = allGoals.goals.find(g => !g.is_emergency_fund);
    assert.ok(customGoal, 'Custom goal should exist');

    const updateRes = updateGoal(DEMO_USER_ID, customGoal.id, {
      name: 'M4 MacBook Pro Fund',
      target_amount: 60000
    });

    assert.equal(updateRes.success, true);
    const updatedGoals = getGoals(DEMO_USER_ID);
    const targetGoal = updatedGoals.goals.find(g => g.id === customGoal.id);
    assert.equal(targetGoal.name, 'M4 MacBook Pro Fund');
    assert.equal(targetGoal.target_amount_inr, 60000);
  });

  test('Goal Contribution from Cash: Deducts cash, increases goal funds, preserves total capital', () => {
    const beforeWallet = getWallet(DEMO_USER_ID);
    const beforeTotal = beforeWallet.balances.total_balance_paise;
    const beforeCash = beforeWallet.balances.current_balance_paise;

    const allGoals = getGoals(DEMO_USER_ID);
    const goal = allGoals.goals.find(g => !g.is_emergency_fund);
    const beforeGoalSaved = goal.current_amount_paise;

    const contributeAmount = 5000; // ₹5,000 = 500,000 paise
    const res = contributeToGoal(DEMO_USER_ID, goal.id, {
      amount: contributeAmount,
      source: 'CASH'
    });

    assert.equal(res.success, true);
    const afterWallet = getWallet(DEMO_USER_ID);
    const afterGoals = getGoals(DEMO_USER_ID);
    const afterGoal = afterGoals.goals.find(g => g.id === goal.id);

    // INVARIANT: Total Virtual Capital invariant
    assert.equal(afterWallet.balances.total_balance_paise, beforeTotal);
    // Cash decreases by 500,000 paise
    assert.equal(afterWallet.balances.current_balance_paise, beforeCash - 500000);
    // Goal amount increases by 500,000 paise
    assert.equal(afterGoal.current_amount_paise, beforeGoalSaved + 500000);
    assert.equal(afterGoal.remaining_amount_paise, afterGoal.target_amount_paise - afterGoal.current_amount_paise);
  });

  test('Goal Contribution Validation: Rejects negative amounts and excess cash', () => {
    const allGoals = getGoals(DEMO_USER_ID);
    const goal = allGoals.goals[0];

    assert.throws(() => {
      contributeToGoal(DEMO_USER_ID, goal.id, { amount: 0, source: 'CASH' });
    }, /Contribution amount must be a positive number/);

    assert.throws(() => {
      contributeToGoal(DEMO_USER_ID, goal.id, { amount: 999999999, source: 'CASH' });
    }, /Insufficient available cash/);
  });

  test('Goal Withdrawal: Returns funds to liquid cash and preserves total capital', () => {
    const beforeWallet = getWallet(DEMO_USER_ID);
    const beforeTotal = beforeWallet.balances.total_balance_paise;
    const beforeCash = beforeWallet.balances.current_balance_paise;

    const allGoals = getGoals(DEMO_USER_ID);
    const goal = allGoals.goals.find(g => g.current_amount_paise >= 200000) || allGoals.goals.find(g => g.current_amount_paise > 0);
    assert.ok(goal, 'Goal with funds should exist');

    const withdrawAmount = 2000; // ₹2,000
    const res = withdrawFromGoal(DEMO_USER_ID, goal.id, {
      amount: withdrawAmount,
      destination: 'CASH'
    });

    assert.equal(res.success, true);
    const afterWallet = getWallet(DEMO_USER_ID);
    const afterGoals = getGoals(DEMO_USER_ID);
    const afterGoal = afterGoals.goals.find(g => g.id === goal.id);

    // Invariant check
    assert.equal(afterWallet.balances.total_balance_paise, beforeTotal);
    assert.equal(afterWallet.balances.current_balance_paise, beforeCash + 200000);
    assert.equal(afterGoal.current_amount_paise, goal.current_amount_paise - 200000);
  });

  test('Goal Deletion: Safeguards saved funds by refunding to liquid cash, protects Emergency Fund', () => {
    // 1. Attempt to delete primary emergency fund should be rejected
    const allGoals = getGoals(DEMO_USER_ID);
    const emergencyGoal = allGoals.goals.find(g => g.is_emergency_fund);
    assert.throws(() => {
      deleteGoal(DEMO_USER_ID, emergencyGoal.id);
    }, /Emergency Buffer Fund cannot be deleted/);

    // 2. Safe delete of a custom goal with funds
    const customGoal = allGoals.goals.find(g => !g.is_emergency_fund);
    const beforeWallet = getWallet(DEMO_USER_ID);
    const beforeTotal = beforeWallet.balances.total_balance_paise;
    const remainingInGoal = customGoal.current_amount_paise;

    const deleteRes = deleteGoal(DEMO_USER_ID, customGoal.id);
    assert.equal(deleteRes.success, true);

    const afterWallet = getWallet(DEMO_USER_ID);
    // Funds refunded to cash!
    assert.equal(afterWallet.balances.current_balance_paise, beforeWallet.balances.current_balance_paise + remainingInGoal);
    assert.equal(afterWallet.balances.total_balance_paise, beforeTotal);
  });

});
