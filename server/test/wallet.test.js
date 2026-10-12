import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { parseRupeesToPaise, formatPaiseToINR, paiseToRupees } from '../src/utils/currency.js';
import {
  getWallet,
  getTransactions,
  addIncome,
  addExpense,
  transferToSavings,
  withdrawFromSavings,
  VALID_INCOME_CATEGORIES,
  VALID_EXPENSE_CATEGORIES
} from '../src/services/walletService.js';
import { DEMO_USER_ID, INITIAL_VIRTUAL_CAPITAL_PAISE } from '../src/db/schema.js';

describe('FINOVA Phase 2: Virtual Wallet & Ledger Test Suite', () => {

  test('Currency Utility: parseRupeesToPaise handles precision and validation', () => {
    // Valid numbers and strings
    assert.equal(parseRupeesToPaise(100000), 10000000);
    assert.equal(parseRupeesToPaise(100), 10000);
    assert.equal(parseRupeesToPaise('100.50'), 10050);
    assert.equal(parseRupeesToPaise('100.5'), 10050);
    assert.equal(parseRupeesToPaise('0.75'), 75);
    assert.equal(parseRupeesToPaise(0.01), 1);

    // Invalid numbers and strings
    assert.equal(parseRupeesToPaise(0), null);
    assert.equal(parseRupeesToPaise(-100), null);
    assert.equal(parseRupeesToPaise('-50.00'), null);
    assert.equal(parseRupeesToPaise('abc'), null);
    assert.equal(parseRupeesToPaise(''), null);
    assert.equal(parseRupeesToPaise(null), null);
    assert.equal(parseRupeesToPaise(undefined), null);
  });

  test('Currency Utility: formatPaiseToINR formats according to Indian numbering system', () => {
    assert.equal(formatPaiseToINR(10000000), '₹1,00,000.00');
    assert.equal(formatPaiseToINR(10050), '₹100.50');
    assert.equal(formatPaiseToINR(50000000), '₹5,00,000.00');
    assert.equal(formatPaiseToINR(0), '₹0.00');
  });

  test('Wallet Service: Initial wallet retrieval', () => {
    const wallet = getWallet(DEMO_USER_ID);
    assert.equal(wallet.user_id, DEMO_USER_ID);
    assert.equal(wallet.is_virtual, true);
    assert.ok(wallet.balances.current_balance_paise >= 0);
    assert.ok(wallet.balances.total_balance_paise >= 0);
  });

  test('Wallet Service: Income addition credits cash and records transaction', () => {
    const initialWallet = getWallet(DEMO_USER_ID);
    const initialCash = initialWallet.balances.current_balance_paise;
    const initialSavings = initialWallet.balances.savings_balance_paise;

    const incomeAmountRupees = 5000;
    const res = addIncome(DEMO_USER_ID, {
      amount: incomeAmountRupees,
      category: 'Freelance',
      description: 'Consulting gig'
    });

    assert.equal(res.success, true);
    assert.ok(res.transaction_id > 0);

    const updatedWallet = getWallet(DEMO_USER_ID);
    assert.equal(updatedWallet.balances.current_balance_paise, initialCash + 500000);
    assert.equal(updatedWallet.balances.savings_balance_paise, initialSavings);
  });

  test('Wallet Service: Expense deduction debits cash and prevents overdraft', () => {
    const initialWallet = getWallet(DEMO_USER_ID);
    const initialCash = initialWallet.balances.current_balance_paise;

    // Successful expense
    const res = addExpense(DEMO_USER_ID, {
      amount: 1500,
      category: 'Food & Groceries',
      description: 'Weekly grocery store'
    });

    assert.equal(res.success, true);
    const updatedWallet = getWallet(DEMO_USER_ID);
    assert.equal(updatedWallet.balances.current_balance_paise, initialCash - 150000);

    // Overdraft attempt: try spending 10x available balance
    assert.throws(() => {
      addExpense(DEMO_USER_ID, {
        amount: 999999999,
        category: 'Shopping',
        description: 'Luxury super-car'
      });
    }, /Insufficient available cash/);
  });

  test('Wallet Service: Transfer to savings preserves total money', () => {
    const beforeWallet = getWallet(DEMO_USER_ID);
    const beforeTotal = beforeWallet.balances.total_balance_paise;
    const transferRupees = 2000;

    const res = transferToSavings(DEMO_USER_ID, {
      amount: transferRupees,
      description: 'Emergency fund contribution'
    });

    assert.equal(res.success, true);
    const afterWallet = getWallet(DEMO_USER_ID);

    // Invariant: total virtual money MUST not change
    assert.equal(afterWallet.balances.total_balance_paise, beforeTotal);
    assert.equal(afterWallet.balances.current_balance_paise, beforeWallet.balances.current_balance_paise - 200000);
    assert.equal(afterWallet.balances.savings_balance_paise, beforeWallet.balances.savings_balance_paise + 200000);
  });

  test('Wallet Service: Withdrawal from savings moves funds back without money creation', () => {
    const beforeWallet = getWallet(DEMO_USER_ID);
    const beforeTotal = beforeWallet.balances.total_balance_paise;
    const withdrawRupees = 1000;

    const res = withdrawFromSavings(DEMO_USER_ID, {
      amount: withdrawRupees,
      description: 'Emergency expense withdrawal'
    });

    assert.equal(res.success, true);
    const afterWallet = getWallet(DEMO_USER_ID);

    // Invariant: total virtual money MUST not change
    assert.equal(afterWallet.balances.total_balance_paise, beforeTotal);
    assert.equal(afterWallet.balances.current_balance_paise, beforeWallet.balances.current_balance_paise + 100000);
    assert.equal(afterWallet.balances.savings_balance_paise, beforeWallet.balances.savings_balance_paise - 100000);
  });

  test('Wallet Service: Rejects invalid withdrawal exceeding savings balance', () => {
    const wallet = getWallet(DEMO_USER_ID);
    const excessRupees = (wallet.balances.savings_balance_paise / 100) + 50000;

    assert.throws(() => {
      withdrawFromSavings(DEMO_USER_ID, {
        amount: excessRupees,
        description: 'Excessive withdrawal'
      });
    }, /Insufficient savings balance/);
  });

  test('Wallet Service: Rejects negative, zero, and missing amounts', () => {
    assert.throws(() => addIncome(DEMO_USER_ID, { amount: 0, category: 'Salary' }), /Invalid amount/);
    assert.throws(() => addIncome(DEMO_USER_ID, { amount: -500, category: 'Salary' }), /Invalid amount/);
    assert.throws(() => addExpense(DEMO_USER_ID, { amount: 0, category: 'Utilities' }), /Invalid amount/);
    assert.throws(() => transferToSavings(DEMO_USER_ID, { amount: -100 }), /Invalid amount/);
    assert.throws(() => withdrawFromSavings(DEMO_USER_ID, { amount: 0 }), /Invalid amount/);
  });

  test('Wallet Service: Transaction History returns sorted ledger entries', () => {
    const history = getTransactions(DEMO_USER_ID, { limit: 10 });
    assert.ok(Array.isArray(history.transactions));
    assert.ok(history.transactions.length > 0);
    assert.ok(history.total_count >= history.transactions.length);

    // Verify ordering: newest first (descending ID)
    for (let i = 0; i < history.transactions.length - 1; i++) {
      assert.ok(history.transactions[i].id >= history.transactions[i + 1].id);
    }
  });

});
