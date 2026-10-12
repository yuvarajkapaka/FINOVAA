import { getDatabase } from '../db/database.js';
import { DEMO_USER_ID } from '../db/schema.js';
import { parseRupeesToPaise, formatPaiseToINR, paiseToRupees } from '../utils/currency.js';

export const VALID_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Stipend',
  'Gift',
  'Investment Return',
  'Cashback & Rewards',
  'Bonus',
  'Other Income'
];

export const VALID_EXPENSE_CATEGORIES = [
  'Housing & Rent',
  'Food & Groceries',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare & Medical',
  'Education',
  'Shopping',
  'Emergency',
  'Subscriptions',
  'Dining Out',
  'Other Expense'
];

/**
 * Retrieves the wallet by user_id with formatted currency and summary breakdowns.
 */
export function getWallet(userId = DEMO_USER_ID) {
  const db = getDatabase();
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  if (!wallet) {
    throw new Error(`Wallet not found for user "${userId}".`);
  }

  const totalPaise = wallet.current_balance + wallet.savings_balance;

  return {
    id: wallet.id,
    user_id: wallet.user_id,
    currency: 'INR',
    is_virtual: true,
    balances: {
      current_balance_paise: wallet.current_balance,
      savings_balance_paise: wallet.savings_balance,
      initial_balance_paise: wallet.initial_balance,
      total_balance_paise: totalPaise,
      // Numeric INR equivalents
      current_balance_inr: paiseToRupees(wallet.current_balance),
      savings_balance_inr: paiseToRupees(wallet.savings_balance),
      initial_balance_inr: paiseToRupees(wallet.initial_balance),
      total_balance_inr: paiseToRupees(totalPaise),
      // Formatted INR strings with commas
      formatted_available_cash: formatPaiseToINR(wallet.current_balance),
      formatted_savings: formatPaiseToINR(wallet.savings_balance),
      formatted_initial_balance: formatPaiseToINR(wallet.initial_balance),
      formatted_total_balance: formatPaiseToINR(totalPaise)
    },
    created_at: wallet.created_at,
    updated_at: wallet.updated_at
  };
}

/**
 * Retrieves transaction history for the user's wallet with pagination and formatting.
 */
export function getTransactions(userId = DEMO_USER_ID, { limit = 50, offset = 0, type } = {}) {
  const db = getDatabase();
  const wallet = db.prepare('SELECT id FROM wallets WHERE user_id = ?').get(userId);

  if (!wallet) {
    throw new Error(`Wallet not found for user "${userId}".`);
  }

  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  let querySql = 'SELECT * FROM transactions WHERE wallet_id = ?';
  let countSql = 'SELECT COUNT(*) as total FROM transactions WHERE wallet_id = ?';
  const queryParams = [wallet.id];
  const countParams = [wallet.id];

  if (type) {
    querySql += ' AND transaction_type = ?';
    countSql += ' AND transaction_type = ?';
    queryParams.push(type);
    countParams.push(type);
  }

  querySql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  queryParams.push(safeLimit, safeOffset);

  const transactions = db.prepare(querySql).all(...queryParams);
  const totalCountRow = db.prepare(countSql).get(...countParams);

  const mapped = transactions.map(tx => ({
    id: tx.id,
    wallet_id: tx.wallet_id,
    transaction_type: tx.transaction_type,
    amount_paise: tx.amount,
    amount_inr: paiseToRupees(tx.amount),
    formatted_amount: formatPaiseToINR(tx.amount),
    category: tx.category,
    description: tx.description,
    balance_after_paise: tx.balance_after,
    balance_after_inr: paiseToRupees(tx.balance_after),
    formatted_balance_after: formatPaiseToINR(tx.balance_after),
    savings_balance_after_paise: tx.savings_balance_after,
    formatted_savings_after: formatPaiseToINR(tx.savings_balance_after),
    created_at: tx.created_at
  }));

  return {
    transactions: mapped,
    total_count: totalCountRow ? totalCountRow.total : mapped.length,
    limit: safeLimit,
    offset: safeOffset
  };
}

/**
 * Record a simulated income transaction within an atomic database transaction.
 */
export function addIncome(userId = DEMO_USER_ID, { amount, category, description }) {
  const amountPaise = parseRupeesToPaise(amount);
  if (!amountPaise || amountPaise <= 0) {
    throw new Error('Invalid amount. Please provide a positive amount in Rupees.');
  }

  if (!category || typeof category !== 'string' || !VALID_INCOME_CATEGORIES.includes(category.trim())) {
    throw new Error(`Invalid income category. Allowed categories: ${VALID_INCOME_CATEGORIES.join(', ')}.`);
  }

  const cleanDescription = (description && typeof description === 'string' && description.trim()) 
    ? description.trim() 
    : `${category} Income`;

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user "${userId}".`);
    }

    const newCurrentBalance = wallet.current_balance + amountPaise;
    const now = new Date().toISOString();

    db.prepare('UPDATE wallets SET current_balance = ?, updated_at = ? WHERE id = ?')
      .run(newCurrentBalance, now, wallet.id);

    const insertTx = db.prepare(`
      INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
      VALUES (?, 'INCOME', ?, ?, ?, ?, ?, ?)
    `);
    
    const txResult = insertTx.run(
      wallet.id,
      amountPaise,
      category.trim(),
      cleanDescription,
      newCurrentBalance,
      wallet.savings_balance,
      now
    );

    db.exec('COMMIT');

    return {
      success: true,
      transaction_id: txResult.lastInsertRowid,
      message: `Successfully credited ${formatPaiseToINR(amountPaise)} to available cash.`,
      wallet: getWallet(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Record a simulated expense transaction with balance validation and rollback.
 */
export function addExpense(userId = DEMO_USER_ID, { amount, category, description }) {
  const amountPaise = parseRupeesToPaise(amount);
  if (!amountPaise || amountPaise <= 0) {
    throw new Error('Invalid amount. Please provide a positive amount in Rupees.');
  }

  if (!category || typeof category !== 'string' || !VALID_EXPENSE_CATEGORIES.includes(category.trim())) {
    throw new Error(`Invalid expense category. Allowed categories: ${VALID_EXPENSE_CATEGORIES.join(', ')}.`);
  }

  const cleanDescription = (description && typeof description === 'string' && description.trim()) 
    ? description.trim() 
    : `${category} Expense`;

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user "${userId}".`);
    }

    if (wallet.current_balance < amountPaise) {
      const availableStr = formatPaiseToINR(wallet.current_balance);
      const requestedStr = formatPaiseToINR(amountPaise);
      throw new Error(`Insufficient available cash. You have ${availableStr} available, but this expense requires ${requestedStr}.`);
    }

    const newCurrentBalance = wallet.current_balance - amountPaise;
    const now = new Date().toISOString();

    db.prepare('UPDATE wallets SET current_balance = ?, updated_at = ? WHERE id = ?')
      .run(newCurrentBalance, now, wallet.id);

    const insertTx = db.prepare(`
      INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
      VALUES (?, 'EXPENSE', ?, ?, ?, ?, ?, ?)
    `);

    const txResult = insertTx.run(
      wallet.id,
      amountPaise,
      category.trim(),
      cleanDescription,
      newCurrentBalance,
      wallet.savings_balance,
      now
    );

    db.exec('COMMIT');

    return {
      success: true,
      transaction_id: txResult.lastInsertRowid,
      message: `Successfully recorded expense of ${formatPaiseToINR(amountPaise)}.`,
      wallet: getWallet(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Transfer funds from available cash to savings.
 * Strictly guarantees conservation of money: total virtual money remains invariant.
 */
export function transferToSavings(userId = DEMO_USER_ID, { amount, description }) {
  const amountPaise = parseRupeesToPaise(amount);
  if (!amountPaise || amountPaise <= 0) {
    throw new Error('Invalid amount. Please provide a positive amount in Rupees.');
  }

  const cleanDescription = (description && typeof description === 'string' && description.trim())
    ? description.trim()
    : 'Allocation to Savings';

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user "${userId}".`);
    }

    if (wallet.current_balance < amountPaise) {
      const availableStr = formatPaiseToINR(wallet.current_balance);
      const requestedStr = formatPaiseToINR(amountPaise);
      throw new Error(`Insufficient available cash to transfer to savings. You have ${availableStr} in cash, but tried to transfer ${requestedStr}.`);
    }

    const newCurrentBalance = wallet.current_balance - amountPaise;
    const newSavingsBalance = wallet.savings_balance + amountPaise;
    const now = new Date().toISOString();

    db.prepare('UPDATE wallets SET current_balance = ?, savings_balance = ?, updated_at = ? WHERE id = ?')
      .run(newCurrentBalance, newSavingsBalance, now, wallet.id);

    const insertTx = db.prepare(`
      INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
      VALUES (?, 'TRANSFER_TO_SAVINGS', ?, 'Savings', ?, ?, ?, ?)
    `);

    const txResult = insertTx.run(
      wallet.id,
      amountPaise,
      cleanDescription,
      newCurrentBalance,
      newSavingsBalance,
      now
    );

    db.exec('COMMIT');

    return {
      success: true,
      transaction_id: txResult.lastInsertRowid,
      message: `Transferred ${formatPaiseToINR(amountPaise)} from available cash to savings.`,
      wallet: getWallet(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Transfer funds from savings back to available cash.
 * Guarantees conservation of money: total virtual money remains invariant.
 */
export function withdrawFromSavings(userId = DEMO_USER_ID, { amount, description }) {
  const amountPaise = parseRupeesToPaise(amount);
  if (!amountPaise || amountPaise <= 0) {
    throw new Error('Invalid amount. Please provide a positive amount in Rupees.');
  }

  const cleanDescription = (description && typeof description === 'string' && description.trim())
    ? description.trim()
    : 'Withdrawal from Savings';

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user "${userId}".`);
    }

    if (wallet.savings_balance < amountPaise) {
      const savingsStr = formatPaiseToINR(wallet.savings_balance);
      const requestedStr = formatPaiseToINR(amountPaise);
      throw new Error(`Insufficient savings balance. You have ${savingsStr} in savings, but tried to withdraw ${requestedStr}.`);
    }

    const newCurrentBalance = wallet.current_balance + amountPaise;
    const newSavingsBalance = wallet.savings_balance - amountPaise;
    const now = new Date().toISOString();

    db.prepare('UPDATE wallets SET current_balance = ?, savings_balance = ?, updated_at = ? WHERE id = ?')
      .run(newCurrentBalance, newSavingsBalance, now, wallet.id);

    const insertTx = db.prepare(`
      INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
      VALUES (?, 'WITHDRAW_FROM_SAVINGS', ?, 'Savings Withdrawal', ?, ?, ?, ?)
    `);

    const txResult = insertTx.run(
      wallet.id,
      amountPaise,
      cleanDescription,
      newCurrentBalance,
      newSavingsBalance,
      now
    );

    db.exec('COMMIT');

    return {
      success: true,
      transaction_id: txResult.lastInsertRowid,
      message: `Withdrew ${formatPaiseToINR(amountPaise)} from savings back into available cash.`,
      wallet: getWallet(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
