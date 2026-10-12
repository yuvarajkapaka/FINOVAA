import express from 'express';
import {
  getWallet,
  getTransactions,
  addIncome,
  addExpense,
  transferToSavings,
  withdrawFromSavings,
  VALID_INCOME_CATEGORIES,
  VALID_EXPENSE_CATEGORIES
} from '../services/walletService.js';

const router = express.Router();

/**
 * GET /api/wallet
 * Returns current virtual wallet state including cash, savings, and total balance.
 */
router.get('/wallet', (req, res, next) => {
  try {
    const wallet = getWallet();
    res.json(wallet);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/categories
 * Returns allowed income and expense categories for client-side forms.
 */
router.get('/wallet/categories', (req, res) => {
  res.json({
    income_categories: VALID_INCOME_CATEGORIES,
    expense_categories: VALID_EXPENSE_CATEGORIES
  });
});

/**
 * GET /api/transactions
 * Returns the transaction history (newest first) with pagination.
 */
router.get('/transactions', (req, res, next) => {
  try {
    const { limit, offset, type } = req.query;
    const history = getTransactions(undefined, { limit, offset, type });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallet/income
 * Record simulated income.
 */
router.post('/wallet/income', (req, res, next) => {
  try {
    const { amount, category, description } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Missing required field: category' });
    }

    const result = addIncome(undefined, { amount, category, description });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/expense
 * Record simulated expense with overdraft prevention.
 */
router.post('/wallet/expense', (req, res, next) => {
  try {
    const { amount, category, description } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Missing required field: category' });
    }

    const result = addExpense(undefined, { amount, category, description });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/transfer-to-savings
 * Transfer from available cash to savings.
 */
router.post('/wallet/transfer-to-savings', (req, res, next) => {
  try {
    const { amount, description } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }

    const result = transferToSavings(undefined, { amount, description });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/withdraw-from-savings
 * Transfer from savings back to available cash.
 */
router.post('/wallet/withdraw-from-savings', (req, res, next) => {
  try {
    const { amount, description } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }

    const result = withdrawFromSavings(undefined, { amount, description });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
