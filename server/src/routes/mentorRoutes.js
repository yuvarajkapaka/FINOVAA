import { Router } from 'express';
import {
  getOllamaStatus,
  handleMentorChat,
  buildVerifiedFinancialContext
} from '../services/mentorService.js';
import { DEMO_USER_ID } from '../db/schema.js';

const router = Router();

export const SUGGESTED_MENTOR_QUESTIONS = [
  'What is compound interest?',
  'What is diversification?',
  'Explain my portfolio allocation.',
  'Why did my simulated portfolio value change?',
  'Explain the outcome of my latest financial scenario.',
  'How can I improve my financial knowledge score?'
];

/**
 * GET /api/mentor/status
 * Returns Ollama health status, detected models, active model name, and suggested questions.
 */
router.get('/mentor/status', async (req, res, next) => {
  try {
    const status = await getOllamaStatus();
    res.json({
      success: true,
      status: {
        ...status,
        suggestedQuestions: SUGGESTED_MENTOR_QUESTIONS,
        disclaimer: 'FINOVA AI Financial Mentor is an educational guide. All financial balances and portfolio values are fictional simulations.'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/mentor/context
 * Returns the read-only verified financial context used by the mentor.
 */
router.get('/mentor/context', (req, res, next) => {
  try {
    const userId = req.query.user_id || DEMO_USER_ID;
    const context = buildVerifiedFinancialContext(userId);
    res.json({
      success: true,
      context
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/mentor/chat
 * Accepts a user question, injects authoritative verified financial context,
 * queries local Ollama model if online, or falls back seamlessly to educational rules.
 */
router.post('/mentor/chat', async (req, res, next) => {
  try {
    const { message, user_id } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: "message" field is required and must be a string.'
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: "message" cannot be empty.'
      });
    }

    if (trimmed.length > 1000) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: "message" length (${trimmed.length}) exceeds maximum limit of 1,000 characters.`
      });
    }

    const userId = user_id || DEMO_USER_ID;
    const result = await handleMentorChat(userId, trimmed);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
