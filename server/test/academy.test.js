import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getWallet } from '../src/services/walletService.js';
import {
  getLessonsList,
  getLessonDetail,
  completeLesson,
  submitQuiz,
  getAcademyProgress,
  calculateKnowledgeScore
} from '../src/services/academyService.js';
import { DEMO_USER_ID } from '../src/db/schema.js';
import { LESSONS } from '../src/data/lessonsData.js';

describe('FINOVA Phase 4: Learn to Invest Academy Test Suite', () => {

  test('Academy: Returns all 15 lessons with structure and categories', () => {
    const data = getLessonsList(DEMO_USER_ID);
    assert.equal(data.lessons.length, 15);
    assert.equal(data.progress.total_lessons_count, 15);
    assert.equal(data.progress.max_score, 25.0);

    const first = data.lessons[0];
    assert.equal(first.id, 1);
    assert.ok(first.title.length > 0);
    assert.ok(first.category.length > 0);
  });

  test('Academy: Lesson detail sanitizes quiz and does not leak correct answers', () => {
    const detail = getLessonDetail(DEMO_USER_ID, 1);
    assert.equal(detail.id, 1);
    assert.ok(detail.learning_objectives.length > 0);
    assert.ok(detail.practical_example.scenario.length > 0);
    assert.ok(detail.quiz_questions.length >= 3);

    // Verify correctAnswerIndex is NOT exposed in the questions payload
    detail.quiz_questions.forEach(q => {
      assert.equal(q.correctAnswerIndex, undefined, 'correctAnswerIndex must be stripped for integrity');
      assert.ok(q.options.length >= 4);
    });
  });

  test('Academy: Manual lesson completion records status and increases reading score', () => {
    const beforeProgress = getAcademyProgress(DEMO_USER_ID);

    const res = completeLesson(DEMO_USER_ID, 1);
    assert.equal(res.success, true);

    const detail = getLessonDetail(DEMO_USER_ID, 1);
    assert.equal(detail.is_completed, true);
    assert.ok(detail.completed_at !== null);

    const afterProgress = getAcademyProgress(DEMO_USER_ID);
    assert.ok(afterProgress.completed_lessons_count >= 1);
    assert.ok(afterProgress.lesson_reading_score > 0);
  });

  test('Academy: Quiz submission evaluates correctly on server with detailed feedback', () => {
    // Lesson 1 correct answers: q1_1 -> 1, q1_2 -> 1, q1_3 -> 1
    const perfectSubmission = {
      answers: {
        q1_1: 1,
        q1_2: 1,
        q1_3: 1
      }
    };

    const result = submitQuiz(DEMO_USER_ID, 1, perfectSubmission);
    assert.equal(result.success, true);
    assert.equal(result.score, 3);
    assert.equal(result.total_questions, 3);
    assert.equal(result.percentage, 100);
    assert.equal(result.passed, true);
    assert.equal(result.feedback.length, 3);

    result.feedback.forEach(fb => {
      assert.equal(fb.is_correct, true);
      assert.ok(fb.explanation.length > 0);
    });
  });

  test('Academy: Partial / incorrect answers are scored accurately', () => {
    // Lesson 2 correct answers: q2_1 -> 2, q2_2 -> 1, q2_3 -> 2
    // Send 1 wrong answer (q2_1 -> 0)
    const partialSubmission = {
      answers: {
        q2_1: 0, // Wrong
        q2_2: 1, // Correct
        q2_3: 2  // Correct
      }
    };

    const result = submitQuiz(DEMO_USER_ID, 2, partialSubmission);
    assert.equal(result.success, true);
    assert.equal(result.score, 2);
    assert.equal(result.total_questions, 3);
    assert.equal(result.passed, true); // 2/3 is 67% >= 60%
    assert.equal(result.feedback[0].is_correct, false);
    assert.equal(result.feedback[1].is_correct, true);
  });

  test('Academy: Missing answers are rejected with validation error', () => {
    assert.throws(() => {
      submitQuiz(DEMO_USER_ID, 1, { answers: { q1_1: 1 } }); // missing q1_2 and q1_3
    }, /was not answered/);

    assert.throws(() => {
      submitQuiz(DEMO_USER_ID, 1, { answers: null });
    }, /Invalid submission/);
  });

  test('Academy: Retakes only count if score improves and never inflate score past max', () => {
    // Submit score of 3 for lesson 3
    const lesson3 = LESSONS.find(l => l.id === 3);
    const perfectAnswers = {};
    lesson3.quiz.forEach(q => { perfectAnswers[q.id] = q.correctAnswerIndex; });

    const firstTry = submitQuiz(DEMO_USER_ID, 3, { answers: perfectAnswers });
    assert.equal(firstTry.score, 3);
    assert.equal(firstTry.best_score, 3);

    const progressAfterFirst = getAcademyProgress(DEMO_USER_ID);

    // Retake with deliberate wrong answers
    const wrongAnswers = {};
    lesson3.quiz.forEach(q => { wrongAnswers[q.id] = (q.correctAnswerIndex + 1) % 4; });
    const retake = submitQuiz(DEMO_USER_ID, 3, { answers: wrongAnswers });

    assert.equal(retake.score, 0);
    // Best score should remain 3!
    assert.equal(retake.best_score, 3);

    // Progress score must not have decreased or inflated
    const progressAfterRetake = getAcademyProgress(DEMO_USER_ID);
    assert.equal(progressAfterRetake.quiz_mastery_score, progressAfterFirst.quiz_mastery_score);
  });

  test('Academy: Financial integrity is preserved (zero wallet or savings impact)', () => {
    const beforeWallet = getWallet(DEMO_USER_ID);
    const beforeCash = beforeWallet.balances.current_balance_paise;
    const beforeSavings = beforeWallet.balances.savings_balance_paise;

    // Completing lessons and taking quizzes
    completeLesson(DEMO_USER_ID, 4);

    const afterWallet = getWallet(DEMO_USER_ID);
    assert.equal(afterWallet.balances.current_balance_paise, beforeCash, 'Cash must not change');
    assert.equal(afterWallet.balances.savings_balance_paise, beforeSavings, 'Savings must not change');
  });

});
