import { getDatabase } from '../db/database.js';
import { DEMO_USER_ID } from '../db/schema.js';
import { LESSONS } from '../data/lessonsData.js';

const TOTAL_LESSONS_COUNT = LESSONS.length; // 15
const MAX_KNOWLEDGE_SCORE = 25.0;
const MAX_LESSON_READING_SCORE = 10.0;
const MAX_QUIZ_MASTERY_SCORE = 15.0;

/**
 * Calculates the deterministic Financial Knowledge Score out of 25.
 *
 * Scoring Formula:
 * 1. Lesson Reading Completion (10.0 pts):
 *    (completed_lessons / 15) * 10.0
 * 2. Quiz Performance & Mastery (15.0 pts):
 *    Sum of (best_score_i / total_questions_i) for each lesson i (max 1.0 pt per quiz).
 *    Retakes only count if the score improves; repeated attempts never inflate the score.
 * 3. Total Financial Knowledge Score = min(25.0, round(Lesson Score + Quiz Score, 1)).
 */
export function calculateKnowledgeScore(userId = DEMO_USER_ID) {
  const db = getDatabase();

  // Completed lessons count
  const completedRows = db.prepare(`
    SELECT lesson_id FROM user_lesson_completions WHERE user_id = ?
  `).all(userId);
  const completedCount = completedRows.length;

  // Best quiz score per lesson
  const quizRows = db.prepare(`
    SELECT lesson_id, MAX(score) as best_score, MAX(total_questions) as total_questions, MAX(passed) as passed
    FROM user_quiz_attempts
    WHERE user_id = ?
    GROUP BY lesson_id
  `).all(userId);

  // Map of lesson_id -> best_score
  const quizMap = new Map();
  quizRows.forEach(q => {
    quizMap.set(q.lesson_id, {
      best_score: q.best_score,
      total_questions: q.total_questions,
      passed: Boolean(q.passed)
    });
  });

  // 1. Reading Score (10 pts)
  const readingScore = Math.min(
    MAX_LESSON_READING_SCORE,
    (completedCount / TOTAL_LESSONS_COUNT) * MAX_LESSON_READING_SCORE
  );

  // 2. Quiz Mastery Score (15 pts) - 1.0 pt max per lesson quiz
  let quizMasteryScore = 0;
  let quizzesPassedCount = 0;

  LESSONS.forEach(lesson => {
    const userQuiz = quizMap.get(lesson.id);
    if (userQuiz && userQuiz.total_questions > 0) {
      const accuracy = Math.min(1.0, userQuiz.best_score / userQuiz.total_questions);
      quizMasteryScore += accuracy;
      if (userQuiz.passed) {
        quizzesPassedCount++;
      }
    }
  });

  quizMasteryScore = Math.min(MAX_QUIZ_MASTERY_SCORE, quizMasteryScore);

  const rawTotal = readingScore + quizMasteryScore;
  const finalScore = Math.min(MAX_KNOWLEDGE_SCORE, Math.round(rawTotal * 10) / 10);
  const overallPercentage = Math.round((finalScore / MAX_KNOWLEDGE_SCORE) * 100);

  return {
    financial_knowledge_score: finalScore,
    max_score: MAX_KNOWLEDGE_SCORE,
    lesson_reading_score: Math.round(readingScore * 10) / 10,
    max_reading_score: MAX_LESSON_READING_SCORE,
    quiz_mastery_score: Math.round(quizMasteryScore * 10) / 10,
    max_quiz_score: MAX_QUIZ_MASTERY_SCORE,
    completed_lessons_count: completedCount,
    total_lessons_count: TOTAL_LESSONS_COUNT,
    quizzes_passed_count: quizzesPassedCount,
    overall_percentage: overallPercentage
  };
}

/**
 * Returns list of all 15 lessons with completion and quiz status.
 */
export function getLessonsList(userId = DEMO_USER_ID) {
  const db = getDatabase();

  const completedMap = new Set(
    db.prepare('SELECT lesson_id FROM user_lesson_completions WHERE user_id = ?')
      .all(userId)
      .map(r => r.lesson_id)
  );

  const quizRows = db.prepare(`
    SELECT lesson_id, MAX(score) as best_score, MAX(total_questions) as total_questions, MAX(passed) as passed, COUNT(*) as attempts
    FROM user_quiz_attempts
    WHERE user_id = ?
    GROUP BY lesson_id
  `).all(userId);

  const quizMap = new Map();
  quizRows.forEach(q => {
    quizMap.set(q.lesson_id, {
      best_score: q.best_score,
      total_questions: q.total_questions,
      passed: Boolean(q.passed),
      attempts: q.attempts
    });
  });

  const lessons = LESSONS.map(lesson => {
    const isCompleted = completedMap.has(lesson.id);
    const quizStats = quizMap.get(lesson.id) || null;

    return {
      id: lesson.id,
      slug: lesson.slug,
      category: lesson.category,
      title: lesson.title,
      read_time: lesson.readTime,
      introduction: lesson.introduction,
      is_completed: isCompleted,
      quiz_stats: quizStats ? {
        best_score: quizStats.best_score,
        total_questions: quizStats.total_questions,
        passed: quizStats.passed,
        percentage: Math.round((quizStats.best_score / quizStats.total_questions) * 100),
        attempts: quizStats.attempts
      } : null
    };
  });

  const progress = calculateKnowledgeScore(userId);

  return {
    lessons,
    progress
  };
}

/**
 * Returns complete lesson details and quiz questions.
 * Strips correctAnswerIndex from questions to keep evaluation strictly server-side.
 */
export function getLessonDetail(userId = DEMO_USER_ID, lessonId) {
  const numericId = parseInt(lessonId, 10);
  const lesson = LESSONS.find(l => l.id === numericId);

  if (!lesson) {
    throw new Error(`Lesson #${lessonId} not found.`);
  }

  const db = getDatabase();

  const completion = db.prepare(`
    SELECT completed_at FROM user_lesson_completions WHERE user_id = ? AND lesson_id = ?
  `).get(userId, numericId);

  const latestQuiz = db.prepare(`
    SELECT score, total_questions, passed, best_score, completed_at 
    FROM user_quiz_attempts 
    WHERE user_id = ? AND lesson_id = ? 
    ORDER BY id DESC LIMIT 1
  `).get(userId, numericId);

  const bestQuiz = db.prepare(`
    SELECT MAX(score) as best_score, MAX(total_questions) as total_questions, MAX(passed) as passed, COUNT(*) as attempts
    FROM user_quiz_attempts 
    WHERE user_id = ? AND lesson_id = ?
  `).get(userId, numericId);

  // Sanitize quiz questions by omitting correctAnswerIndex
  const sanitizedQuiz = lesson.quiz.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));

  return {
    id: lesson.id,
    slug: lesson.slug,
    category: lesson.category,
    title: lesson.title,
    read_time: lesson.readTime,
    introduction: lesson.introduction,
    learning_objectives: lesson.learningObjectives,
    explanation: lesson.explanation,
    practical_example: lesson.practicalExample,
    key_takeaways: lesson.keyTakeaways,
    quiz_questions: sanitizedQuiz,
    is_completed: Boolean(completion),
    completed_at: completion?.completed_at || null,
    quiz_progress: bestQuiz?.attempts > 0 ? {
      best_score: bestQuiz.best_score,
      total_questions: bestQuiz.total_questions,
      passed: Boolean(bestQuiz.passed),
      percentage: Math.round((bestQuiz.best_score / bestQuiz.total_questions) * 100),
      attempts_count: bestQuiz.attempts,
      latest_attempt: latestQuiz || null
    } : null
  };
}

/**
 * Marks a lesson as read/completed.
 */
export function completeLesson(userId = DEMO_USER_ID, lessonId) {
  const numericId = parseInt(lessonId, 10);
  const lesson = LESSONS.find(l => l.id === numericId);

  if (!lesson) {
    throw new Error(`Lesson #${lessonId} not found.`);
  }

  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO user_lesson_completions (user_id, lesson_id, completed_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, lesson_id) DO NOTHING
  `).run(userId, numericId, now);

  return {
    success: true,
    message: `Lesson "${lesson.title}" marked as completed.`,
    lesson_id: numericId,
    progress: calculateKnowledgeScore(userId)
  };
}

/**
 * Evaluates quiz submission on the server, calculates score, records attempt,
 * updates best score, and returns answers with detailed explanations.
 */
export function submitQuiz(userId = DEMO_USER_ID, lessonId, { answers }) {
  const numericId = parseInt(lessonId, 10);
  const lesson = LESSONS.find(l => l.id === numericId);

  if (!lesson) {
    throw new Error(`Lesson #${lessonId} not found.`);
  }

  if (!answers || typeof answers !== 'object') {
    throw new Error('Invalid submission. Answers payload is required.');
  }

  const questions = lesson.quiz;
  let score = 0;
  const feedback = [];

  questions.forEach(q => {
    const selectedAnswer = answers[q.id];
    if (selectedAnswer === undefined || selectedAnswer === null) {
      throw new Error(`Question "${q.question}" was not answered.`);
    }

    const selectedIndex = parseInt(selectedAnswer, 10);
    const isCorrect = selectedIndex === q.correctAnswerIndex;

    if (isCorrect) {
      score += 1;
    }

    feedback.push({
      question_id: q.id,
      question: q.question,
      options: q.options,
      selected_index: selectedIndex,
      correct_index: q.correctAnswerIndex,
      is_correct: isCorrect,
      explanation: q.explanation
    });
  });

  const totalQuestions = questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  // Passing threshold: at least 60% (e.g. 2 out of 3)
  const passed = score >= Math.ceil(totalQuestions * 0.6) ? 1 : 0;

  const db = getDatabase();

  // Find previous best score
  const prevBestRow = db.prepare(`
    SELECT MAX(score) as best_score FROM user_quiz_attempts WHERE user_id = ? AND lesson_id = ?
  `).get(userId, numericId);
  const previousBest = prevBestRow?.best_score !== null ? prevBestRow.best_score : 0;
  const newBestScore = Math.max(previousBest, score);

  const now = new Date().toISOString();

  // Save attempt
  db.prepare(`
    INSERT INTO user_quiz_attempts (user_id, lesson_id, score, total_questions, passed, best_score, answers_json, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    numericId,
    score,
    totalQuestions,
    passed,
    newBestScore,
    JSON.stringify(answers),
    now
  );

  // If passed, also auto-mark lesson as completed
  if (passed === 1) {
    db.prepare(`
      INSERT INTO user_lesson_completions (user_id, lesson_id, completed_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, lesson_id) DO NOTHING
    `).run(userId, numericId, now);
  }

  const updatedProgress = calculateKnowledgeScore(userId);

  return {
    success: true,
    score,
    total_questions: totalQuestions,
    percentage,
    passed: Boolean(passed),
    best_score: newBestScore,
    is_new_high_score: score > previousBest,
    feedback,
    progress: updatedProgress
  };
}

/**
 * Returns overall academy statistics, lesson completion breakdown, and the Financial Knowledge score.
 */
export function getAcademyProgress(userId = DEMO_USER_ID) {
  return calculateKnowledgeScore(userId);
}

/**
 * Checks a single quiz question on the server without completing the full quiz attempt.
 * Evaluates correctness and returns explanation strictly from the server.
 */
export function checkSingleQuestion(lessonId, questionId, selectedIndex) {
  const numericId = parseInt(lessonId, 10);
  const lesson = LESSONS.find(l => l.id === numericId);
  if (!lesson) {
    throw new Error(`Lesson #${lessonId} not found.`);
  }
  const question = lesson.quiz.find(q => q.id === questionId);
  if (!question) {
    throw new Error(`Question "${questionId}" not found in Lesson #${lessonId}.`);
  }
  const selIdx = parseInt(selectedIndex, 10);
  const isCorrect = selIdx === question.correctAnswerIndex;
  return {
    success: true,
    question_id: question.id,
    selected_index: selIdx,
    correct_index: question.correctAnswerIndex,
    is_correct: isCorrect,
    explanation: question.explanation
  };
}
