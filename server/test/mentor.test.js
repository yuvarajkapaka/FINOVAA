import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOllamaStatus,
  buildVerifiedFinancialContext,
  getEducationalFallback,
  handleMentorChat
} from '../src/services/mentorService.js';
import { getWallet } from '../src/services/walletService.js';
import { getGoals } from '../src/services/goalService.js';
import { getPortfolio } from '../src/services/marketService.js';
import { calculateLiteracyScore } from '../src/services/scoreService.js';
import { getDatabase } from '../src/db/database.js';
import { DEMO_USER_ID } from '../src/db/schema.js';

describe('FINOVA Phase 8: AI Financial Mentor Test Suite', () => {

  test('Mentor Status: Returns dynamic model inspection and suggested questions', async () => {
    const status = await getOllamaStatus();

    assert.ok(typeof status.isAvailable === 'boolean', 'isAvailable must be boolean');
    assert.ok(Array.isArray(status.availableModels), 'availableModels must be an array');
    assert.ok(typeof status.statusMessage === 'string', 'statusMessage must be string');

    if (status.isAvailable && status.availableModels.length > 0) {
      assert.ok(status.activeModel, 'Must identify an active model when available');
    }
  });

  test('Verified Context Builder: Pulls authoritative read-only state from core services', () => {
    const context = buildVerifiedFinancialContext(DEMO_USER_ID);

    assert.equal(context.userId, DEMO_USER_ID);
    assert.ok(typeof context.liquidCashPaise === 'number');
    assert.ok(typeof context.liquidCashFormatted === 'string');
    assert.ok(context.liquidCashFormatted.includes('₹'));

    assert.ok(typeof context.totalWealthPaise === 'number');
    assert.ok(typeof context.investmentsMarketValuePaise === 'number');
    assert.ok(typeof context.allocation === 'object');
    assert.ok(typeof context.literacyScore.totalScore === 'number');
    assert.ok(context.literacyScore.totalScore >= 0 && context.literacyScore.totalScore <= 100);
  });

  test('Input Validation: Rejects empty, whitespace, and oversized messages', async () => {
    // 1. Empty message
    await assert.rejects(
      async () => handleMentorChat(DEMO_USER_ID, ''),
      /cannot be empty/i
    );

    // 2. Whitespace-only message
    await assert.rejects(
      async () => handleMentorChat(DEMO_USER_ID, '     '),
      /cannot be empty/i
    );

    // 3. Null / Non-string
    await assert.rejects(
      async () => handleMentorChat(DEMO_USER_ID, null),
      /must be a string/i
    );

    // 4. Oversized message (> 1000 chars)
    const longMessage = 'A'.repeat(1001);
    await assert.rejects(
      async () => handleMentorChat(DEMO_USER_ID, longMessage),
      /exceeds maximum allowed length/i
    );
  });

  test('Educational Fallback Engine: Provides accurate, beginner-friendly explanations for core topics', () => {
    const context = buildVerifiedFinancialContext(DEMO_USER_ID);

    // Compound interest
    const compoundReply = getEducationalFallback('What is compound interest?', context);
    assert.ok(compoundReply.includes('Compound interest'), 'Must explain compound interest');
    assert.ok(compoundReply.includes('₹'), 'Must include Indian Rupee examples');

    // Diversification
    const diverReply = getEducationalFallback('Explain diversification and asset allocation', context);
    assert.ok(diverReply.includes('Diversification') || diverReply.includes('diversif'));
    assert.ok(diverReply.includes('Equities') && diverReply.includes('Debt'));

    // Portfolio
    const portReply = getEducationalFallback('Explain my portfolio allocation', context);
    assert.ok(portReply.includes(context.totalWealthFormatted));
    assert.ok(portReply.includes(context.liquidCashFormatted));

    // Literacy score
    const scoreReply = getEducationalFallback('How can I improve my financial knowledge score?', context);
    assert.ok(scoreReply.includes(String(context.literacyScore.totalScore)));
    assert.ok(scoreReply.includes('Savings Progress') && scoreReply.includes('Financial Knowledge'));

    // Emergency fund
    const efReply = getEducationalFallback('Why do I need an emergency fund?', context);
    assert.ok(efReply.includes('Emergency Fund') && efReply.includes('months'));

    // Inflation
    const inflReply = getEducationalFallback('What is inflation?', context);
    assert.ok(inflReply.includes('Inflation') && inflReply.includes('purchasing power'));
  });

  test('State Invariant: Mentor queries NEVER mutate wallet, goals, holdings, or ledger', async () => {
    const db = getDatabase();

    // 1. Snapshot raw table row counts and wallet balance
    const walletBefore = db.prepare('SELECT current_balance, savings_balance FROM wallets WHERE user_id = ?').get(DEMO_USER_ID);
    const txCountBefore = db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE wallet_id = 1').get().cnt;
    const invTxCountBefore = db.prepare('SELECT COUNT(*) as cnt FROM investment_transactions WHERE wallet_id = 1').get().cnt;
    const goalsCountBefore = db.prepare('SELECT COUNT(*) as cnt FROM savings_goals WHERE wallet_id = 1').get().cnt;
    const holdingsCountBefore = db.prepare('SELECT COUNT(*) as cnt FROM investment_holdings WHERE wallet_id = 1').get().cnt;

    // 2. Invoke mentor chat (testing educational query)
    const context = buildVerifiedFinancialContext(DEMO_USER_ID);
    const fallbackResponse = getEducationalFallback('What is compound interest?', context);
    assert.ok(fallbackResponse.length > 50);

    const chatResult = await handleMentorChat(DEMO_USER_ID, 'What is diversification?');
    assert.ok(chatResult.success);
    assert.ok(chatResult.reply.length > 0);

    // 3. Verify zero database mutations took place
    const walletAfter = db.prepare('SELECT current_balance, savings_balance FROM wallets WHERE user_id = ?').get(DEMO_USER_ID);
    const txCountAfter = db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE wallet_id = 1').get().cnt;
    const invTxCountAfter = db.prepare('SELECT COUNT(*) as cnt FROM investment_transactions WHERE wallet_id = 1').get().cnt;
    const goalsCountAfter = db.prepare('SELECT COUNT(*) as cnt FROM savings_goals WHERE wallet_id = 1').get().cnt;
    const holdingsCountAfter = db.prepare('SELECT COUNT(*) as cnt FROM investment_holdings WHERE wallet_id = 1').get().cnt;

    assert.equal(walletAfter.current_balance, walletBefore.current_balance, 'Wallet cash balance must not change');
    assert.equal(walletAfter.savings_balance, walletBefore.savings_balance, 'Savings balance must not change');
    assert.equal(txCountAfter, txCountBefore, 'Cash ledger transaction count must remain unchanged');
    assert.equal(invTxCountAfter, invTxCountBefore, 'Investment trade count must remain unchanged');
    assert.equal(goalsCountAfter, goalsCountBefore, 'Goals count must remain unchanged');
    assert.equal(holdingsCountAfter, holdingsCountBefore, 'Holdings count must remain unchanged');
  });

});
