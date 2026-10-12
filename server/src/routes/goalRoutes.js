import express from 'express';
import {
  getGoals,
  getEmergencyFund,
  createGoal,
  updateGoal,
  contributeToGoal,
  withdrawFromGoal,
  deleteGoal,
  VALID_GOAL_CATEGORIES
} from '../services/goalService.js';

const router = express.Router();

/**
 * GET /api/goals
 * Returns all savings goals and summary stats.
 */
router.get('/goals', (req, res, next) => {
  try {
    const data = getGoals();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/categories
 * Returns allowed goal categories.
 */
router.get('/goals/categories', (req, res) => {
  res.json({ categories: VALID_GOAL_CATEGORIES });
});

/**
 * GET /api/goals/emergency-fund
 * Returns the dedicated emergency fund goal and educational principles.
 */
router.get('/goals/emergency-fund', (req, res, next) => {
  try {
    const data = getEmergencyFund();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/goals
 * Creates a new savings goal.
 */
router.post('/goals', (req, res, next) => {
  try {
    const { name, target_amount, target_date, category, is_emergency_fund } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    if (target_amount === undefined || target_amount === null) {
      return res.status(400).json({ error: 'Missing required field: target_amount' });
    }

    const result = createGoal(undefined, { name, target_amount, target_date, category, is_emergency_fund });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/goals/:id
 * Updates an existing savings goal.
 */
router.put('/goals/:id', (req, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    if (isNaN(goalId)) {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }

    const { name, target_amount, target_date, category, status } = req.body;
    const result = updateGoal(undefined, goalId, { name, target_amount, target_date, category, status });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/goals/:id/contribute
 * Contributes funds into a savings goal (from Cash or Savings).
 */
router.post('/goals/:id/contribute', (req, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    if (isNaN(goalId)) {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }

    const { amount, source } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }

    const result = contributeToGoal(undefined, goalId, { amount, source });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/goals/:id/withdraw
 * Withdraws funds from a savings goal (back to Cash or Savings).
 */
router.post('/goals/:id/withdraw', (req, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    if (isNaN(goalId)) {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }

    const { amount, destination } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }

    const result = withdrawFromGoal(undefined, goalId, { amount, destination });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/goals/:id
 * Deletes a goal and safely returns any saved funds to liquid cash.
 */
router.delete('/goals/:id', (req, res, next) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    if (isNaN(goalId)) {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }

    const result = deleteGoal(undefined, goalId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
