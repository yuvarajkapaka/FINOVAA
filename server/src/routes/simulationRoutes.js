import { Router } from 'express';
import { getScenarios, getFinancialSnapshot, evaluateScenario } from '../services/simulationService.js';
import { recordSimulationActivity } from '../services/scoreService.js';
import { DEMO_USER_ID } from '../db/schema.js';

const router = Router();

/**
 * GET /api/simulation/scenarios
 * Returns the catalog of deterministic financial-life scenarios.
 */
router.get('/simulation/scenarios', (req, res, next) => {
  try {
    const scenarios = getScenarios();
    res.json({
      success: true,
      count: scenarios.length,
      scenarios
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/simulation/snapshot
 * Returns the authoritative immutable virtual financial snapshot for simulation context.
 */
router.get('/simulation/snapshot', (req, res, next) => {
  try {
    const snapshot = getFinancialSnapshot(DEMO_USER_ID);
    res.json({
      success: true,
      snapshot
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/simulation/evaluate
 * Evaluates hypothetical decisions against the initial snapshot without modifying real accounts.
 *
 * Body: { scenario_id: string, choice_id?: string }
 */
router.post('/simulation/evaluate', (req, res, next) => {
  try {
    const { scenario_id, choice_id } = req.body;

    if (!scenario_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "scenario_id".'
      });
    }

    const result = evaluateScenario(DEMO_USER_ID, scenario_id, choice_id || null);

    // Record verified decision engagement for Phase 7 scoring (idempotent)
    const effectiveChoiceId = choice_id || result.side_by_side_evaluations[0]?.choice_id;
    if (effectiveChoiceId) {
      recordSimulationActivity(DEMO_USER_ID, scenario_id, effectiveChoiceId, true);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;
