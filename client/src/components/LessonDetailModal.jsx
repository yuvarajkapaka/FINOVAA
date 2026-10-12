import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  HelpCircle, 
  Award, 
  ArrowRight, 
  RotateCcw, 
  Loader2, 
  Target, 
  Lightbulb
} from 'lucide-react';

export default function LessonDetailModal({
  isOpen,
  lessonId,
  onClose,
  onSuccess
}) {
  const [activeTab, setActiveTab] = useState('READ'); // 'READ' | 'QUIZ'
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quiz state: one question at a time
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questionFeedback, setQuestionFeedback] = useState({}); // { [qId]: { is_correct, correct_index, explanation } }
  const [checkingQuestion, setCheckingQuestion] = useState(false);
  const [submittingFullQuiz, setSubmittingFullQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalQuizResult, setFinalQuizResult] = useState(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (!isOpen || !lessonId) return;

    setActiveTab('READ');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuestionFeedback({});
    setQuizCompleted(false);
    setFinalQuizResult(null);
    setLoading(true);
    setError(null);

    fetch(`/api/academy/lessons/${lessonId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load mission #${lessonId}`);
        return res.json();
      })
      .then(data => {
        setLesson(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [isOpen, lessonId]);

  if (!isOpen) return null;

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/academy/lessons/${lesson.id}/complete`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete mission.');

      setLesson(prev => ({ ...prev, is_completed: true, completed_at: new Date().toISOString() }));
      onSuccess(`Mission #${lesson.id} marked complete! Financial Knowledge score updated.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingComplete(false);
    }
  };

  const questions = lesson?.quiz_questions || [];
  const totalQuestions = questions.length;
  const currentQ = questions[currentQuestionIndex];
  const isCurrentQAnswered = currentQ ? selectedAnswers[currentQ.id] !== undefined : false;
  const currentQFeedback = currentQ ? questionFeedback[currentQ.id] : null;

  const handleSelectOption = (optionIndex) => {
    if (!currentQ || currentQFeedback) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIndex
    }));
  };

  // Submit and check single question via server
  const handleCheckCurrentQuestion = async () => {
    if (!currentQ || selectedAnswers[currentQ.id] === undefined) return;

    setCheckingQuestion(true);
    setError(null);

    try {
      const res = await fetch(`/api/academy/lessons/${lesson.id}/quiz/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQ.id,
          selected_index: selectedAnswers[currentQ.id]
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check answer.');
      }

      setQuestionFeedback(prev => ({
        ...prev,
        [currentQ.id]: {
          is_correct: data.is_correct,
          correct_index: data.correct_index,
          explanation: data.explanation
        }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingQuestion(false);
    }
  };

  // Move to next question or submit final quiz
  const handleNextQuestion = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      await handleFinalizeQuiz();
    }
  };

  const handleFinalizeQuiz = async () => {
    setSubmittingFullQuiz(true);
    setError(null);

    try {
      const res = await fetch(`/api/academy/lessons/${lesson.id}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record quiz score.');

      setFinalQuizResult(data);
      setQuizCompleted(true);
      onSuccess(`Quiz evaluated! Score: ${data.score}/${data.total_questions} (${data.percentage}%). Knowledge score updated.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingFullQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuestionFeedback({});
    setQuizCompleted(false);
    setFinalQuizResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-canvas-white border border-edge rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-canvas-subtle">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-forest/10 text-forest border border-forest/20">
              #{lesson?.id?.toString().padStart(2, '0') || '--'}
            </span>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-ink">
                {lesson?.title || 'Learning Mission Details'}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-ink-muted mt-0.5">
                <span>{lesson?.category || 'Mission'}</span>
                <span>•</span>
                <span>{lesson?.read_time || '5 min'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-canvas-white border border-edge text-xs">
              <button
                onClick={() => setActiveTab('READ')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'READ'
                    ? 'bg-forest text-canvas-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Mission Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('QUIZ')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'QUIZ'
                    ? 'bg-forest text-canvas-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Knowledge Quiz</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-ink leading-relaxed font-sans">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-ink-muted">
              <Loader2 className="w-7 h-7 animate-spin text-forest" />
              <p className="text-xs">Loading mission curriculum...</p>
            </div>
          ) : error && !lesson ? (
            <div className="p-4 rounded-xl bg-neg/10 border border-neg/30 text-neg text-xs">
              {error}
            </div>
          ) : activeTab === 'READ' ? (
            /* ================= READ TAB ================= */
            <div className="space-y-6">
              {/* Introduction Box */}
              <div className="p-4 rounded-xl bg-canvas-subtle border border-edge italic text-ink-muted text-xs sm:text-sm">
                "{lesson.introduction}"
              </div>

              {/* Learning Objectives */}
              <div className="space-y-2">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Learning Objectives
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lesson.learning_objectives.map((obj, i) => (
                    <div key={i} className="p-3 rounded-lg bg-canvas-subtle border border-edge text-xs text-ink">
                      <span className="text-forest font-bold block mb-1">0{i + 1}.</span>
                      {obj}
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Explanation */}
              <div className="space-y-3 text-ink text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {lesson.explanation}
              </div>

              {/* Realistic Indian Rupee Practical Example */}
              {lesson.practical_example && (
                <div className="rounded-xl bg-canvas-subtle border border-forest/30 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-forest font-bold text-xs uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4 text-forest" />
                    <span>Practical Case Study</span>
                  </div>
                  <p className="text-xs text-ink font-semibold">
                    {lesson.practical_example.scenario}
                  </p>
                  <ul className="space-y-1.5 text-xs text-ink-muted list-disc list-inside">
                    {lesson.practical_example.breakdown.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                  <div className="p-2.5 rounded-lg bg-forest/10 border border-forest/20 text-xs text-forest">
                    <strong>Core Takeaway:</strong> {lesson.practical_example.lesson}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              <div className="space-y-2">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-copper">
                  Key Principles
                </h3>
                <ul className="space-y-2">
                  {lesson.key_takeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start space-x-2 text-xs text-ink-muted">
                      <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-edge flex items-center justify-between">
                {!lesson.is_completed ? (
                  <button
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-xs font-semibold transition"
                  >
                    {markingComplete && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Mark as Read</span>
                  </button>
                ) : (
                  <span className="text-xs text-forest flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Mission Completed
                  </span>
                )}

                <button
                  onClick={() => setActiveTab('QUIZ')}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
                >
                  <span>Take Knowledge Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : quizCompleted && finalQuizResult ? (
            /* ================= QUIZ COMPLETION SUMMARY ================= */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                finalQuizResult.passed
                  ? 'bg-forest/10 border-forest/40 text-forest'
                  : 'bg-gold/15 border-gold/40 text-ink'
              }`}>
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-canvas-white border border-edge">
                  {finalQuizResult.passed ? (
                    <Award className="w-6 h-6 text-forest" />
                  ) : (
                    <RotateCcw className="w-6 h-6 text-copper" />
                  )}
                </div>

                <h3 className="font-serif text-lg font-bold text-ink">
                  {finalQuizResult.passed ? 'Quiz Passed • Mastery Achieved' : 'Quiz Completed'}
                </h3>

                <div className="text-3xl font-mono font-bold text-ink">
                  {finalQuizResult.score} / {finalQuizResult.total_questions}
                  <span className="text-base text-ink-muted font-sans font-normal ml-2">
                    ({finalQuizResult.percentage}%)
                  </span>
                </div>

                <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                  {finalQuizResult.passed
                    ? 'Congratulations! You answered the quiz correctly on the server. Your Financial Knowledge score has been officially updated.'
                    : 'You finished the quiz attempt. You can review the pedagogical explanations below or retake the quiz to improve your score.'}
                </p>
              </div>

              {/* Review of all questions & explanations */}
              <div className="space-y-3">
                <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Review Explanations ({finalQuizResult.feedback?.length || 0})
                </h4>
                <div className="space-y-3">
                  {finalQuizResult.feedback?.map((fb, idx) => (
                    <div key={fb.question_id || idx} className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink text-xs sm:text-sm">
                          {idx + 1}. {fb.question}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          fb.is_correct
                            ? 'bg-pos/10 text-pos border-pos/30'
                            : 'bg-neg/10 text-neg border-neg/30'
                        }`}>
                          {fb.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-canvas-white border border-edge text-[11px] text-ink-muted">
                        <strong className="text-forest">Explanation: </strong>
                        {fb.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-edge flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('READ')}
                  className="px-4 py-2 rounded-xl text-ink-muted hover:text-ink text-xs font-medium"
                >
                  ← Back to Mission Notes
                </button>
                <button
                  onClick={handleRetakeQuiz}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-semibold transition active:scale-95 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= ONE-QUESTION-AT-A-TIME INTERACTIVE QUIZ ================= */
            <div className="space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-neg/10 border border-neg/30 text-neg text-xs">
                  {error}
                </div>
              )}

              {/* Question progress indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                  <span className="uppercase tracking-wider text-[10px] text-forest">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="font-mono text-ink">
                    {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-canvas-subtle rounded-full h-2 overflow-hidden border border-edge">
                  <div
                    className="bg-forest h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Question Card */}
              {currentQ && (
                <div className="p-5 rounded-2xl bg-canvas-white border border-edge space-y-4 shadow-sm">
                  <h3 className="font-serif font-bold text-ink text-sm sm:text-base leading-snug">
                    {currentQuestionIndex + 1}. {currentQ.question}
                  </h3>

                  {/* Multiple Choice Options */}
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIndex) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIndex;
                      let optionStyle = 'bg-canvas-subtle border-edge text-ink hover:border-edge-dark';

                      if (currentQFeedback) {
                        if (optIndex === currentQFeedback.correct_index) {
                          optionStyle = 'bg-pos/10 border-pos text-pos font-semibold shadow-xs';
                        } else if (isSelected && !currentQFeedback.is_correct) {
                          optionStyle = 'bg-neg/10 border-neg text-neg font-semibold';
                        }
                      } else if (isSelected) {
                        optionStyle = 'bg-forest/10 border-forest text-forest font-medium';
                      }

                      return (
                        <button
                          key={optIndex}
                          type="button"
                          onClick={() => handleSelectOption(optIndex)}
                          disabled={Boolean(currentQFeedback) || checkingQuestion}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between ${optionStyle}`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-5 h-5 rounded-full border border-edge flex items-center justify-center text-[10px] font-mono text-ink-muted flex-shrink-0">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {currentQFeedback && optIndex === currentQFeedback.correct_index && (
                            <CheckCircle2 className="w-4 h-4 text-pos flex-shrink-0" />
                          )}
                          {currentQFeedback && isSelected && !currentQFeedback.is_correct && (
                            <XCircle className="w-4 h-4 text-neg flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* IMMEDIATE FEEDBACK & EXPLANATION ONCE SUBMITTED */}
                  {currentQFeedback && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 animate-in fade-in duration-200 ${
                      currentQFeedback.is_correct
                        ? 'bg-pos/10 border-pos/30 text-pos'
                        : 'bg-gold/15 border-gold/40 text-ink'
                    }`}>
                      <div className="flex items-center space-x-2 font-bold text-xs">
                        {currentQFeedback.is_correct ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-pos" />
                            <span>Correct answer verified.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-neg" />
                            <span>Incorrect. Here is the principle:</span>
                          </>
                        )}
                      </div>
                      <p className="text-ink-muted text-[11px] leading-relaxed">
                        <strong className="text-ink">Explanation: </strong>
                        {currentQFeedback.explanation}
                      </p>
                    </div>
                  )}

                  {/* Interactive Action: Submit answer OR Next Question */}
                  <div className="pt-3 border-t border-edge flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('READ')}
                      className="px-3 py-1.5 rounded-xl text-ink-muted hover:text-ink text-xs font-medium"
                    >
                      ← Mission Notes
                    </button>

                    {!currentQFeedback ? (
                      <button
                        type="button"
                        onClick={handleCheckCurrentQuestion}
                        disabled={!isCurrentQAnswered || checkingQuestion}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {checkingQuestion && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Submit Answer</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        disabled={submittingFullQuiz}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
                      >
                        {submittingFullQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>
                          {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Complete Quiz'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
