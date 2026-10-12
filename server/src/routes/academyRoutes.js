import express from 'express';
import {
  getLessonsList,
  getLessonDetail,
  completeLesson,
  submitQuiz,
  getAcademyProgress,
  checkSingleQuestion
} from '../services/academyService.js';

const router = express.Router();

/**
 * GET /api/academy/lessons
 * Returns the 15 lessons with user completion and quiz status.
 */
router.get('/academy/lessons', (req, res, next) => {
  try {
    const data = getLessonsList();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/academy/progress
 * Returns learning statistics and Financial Knowledge score out of 25.
 */
router.get('/academy/progress', (req, res, next) => {
  try {
    const progress = getAcademyProgress();
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/academy/lessons/:id
 * Returns detailed lesson content and sanitized quiz questions.
 */
router.get('/academy/lessons/:id', (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const lesson = getLessonDetail(undefined, lessonId);
    res.json(lesson);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/academy/lessons/:id/complete
 * Records lesson completion.
 */
router.post(['/academy/lessons/:id/complete', '/api/academy/lessons/:id/complete'], (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const result = completeLesson(undefined, lessonId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/academy/lessons/:id/quiz
 * Accepts user's quiz answers, verifies on server, and returns score + feedback.
 */
router.post(['/academy/lessons/:id/quiz', '/api/academy/lessons/:id/quiz'], (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Missing required field: answers object' });
    }

    const result = submitQuiz(undefined, lessonId, { answers });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/academy/lessons/:id/quiz/check
 * Evaluates a single quiz question on the server and returns immediate feedback.
 */
router.post(['/academy/lessons/:id/quiz/check', '/api/academy/lessons/:id/quiz/check'], (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const { question_id, selected_index } = req.body;

    if (!question_id || selected_index === undefined) {
      return res.status(400).json({ error: 'Missing question_id or selected_index' });
    }

    const result = checkSingleQuestion(lessonId, question_id, selected_index);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
