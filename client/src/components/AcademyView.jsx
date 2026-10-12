import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  HelpCircle,
  Search
} from 'lucide-react';

export default function AcademyView({
  lessonsData,
  onSelectLesson,
  loading
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'COMPLETED'

  const lessons = lessonsData?.lessons || [];
  const progress = lessonsData?.progress || {};

  const categories = [
    { id: 'ALL', label: 'All Missions', count: lessons.length },
    { id: 'Foundations', label: 'Foundations & Budgeting', count: lessons.filter(l => l.category === 'Foundations').length },
    { id: 'Interest & Inflation', label: 'Interest & Inflation', count: lessons.filter(l => l.category === 'Interest & Inflation').length },
    { id: 'Investment Vehicles', label: 'Investment Vehicles', count: lessons.filter(l => l.category === 'Investment Vehicles').length },
    { id: 'Strategy & Mindset', label: 'Strategy & Mindset', count: lessons.filter(l => l.category === 'Strategy & Mindset').length }
  ];

  const filteredLessons = lessons.filter(l => {
    if (selectedCategory !== 'ALL' && l.category !== selectedCategory) return false;
    if (statusFilter === 'UNREAD' && l.is_completed) return false;
    if (statusFilter === 'COMPLETED' && !l.is_completed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (l.title || '').toLowerCase().includes(q);
      const matchIntro = (l.introduction || '').toLowerCase().includes(q);
      return matchTitle || matchIntro;
    }
    return true;
  });

  const knowledgeScore = progress.financial_knowledge_score || 0;
  const maxScore = progress.max_score || 25;
  const scorePercentage = Math.round((knowledgeScore / maxScore) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. FINANCIAL KNOWLEDGE SCORE HERO BANNER */}
      <div className="rounded-2xl bg-canvas-white border border-edge p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs font-semibold">
              <Award className="w-4 h-4" />
              <span>Financial Knowledge Rubric • 25 Points Maximum</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Knowledge Center • Learning Missions
            </h1>
            <p className="text-ink-muted text-xs sm:text-sm leading-relaxed">
              Master essential personal finance principles from first principles. Complete 15 structured learning missions, inspect realistic case studies, and pass server-graded comprehension quizzes to advance your Financial Knowledge score.
            </p>

            {/* Micro badges */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs">
              <div className="flex items-center space-x-1.5 text-ink-muted bg-canvas-subtle px-3 py-1 rounded-lg border border-edge">
                <BookOpen className="w-3.5 h-3.5 text-forest" />
                <span>Reading: <strong className="text-ink">{progress.lesson_reading_score || 0} / 10 pts</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-ink-muted bg-canvas-subtle px-3 py-1 rounded-lg border border-edge">
                <HelpCircle className="w-3.5 h-3.5 text-copper" />
                <span>Quizzes: <strong className="text-ink">{progress.quiz_mastery_score || 0} / 15 pts</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-ink-muted bg-canvas-subtle px-3 py-1 rounded-lg border border-edge">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                <span>Missions Finished: <strong className="text-ink">{progress.completed_lessons_count || 0} / 15</strong></span>
              </div>
            </div>
          </div>

          {/* Metric Score Gauge */}
          <div className="bg-canvas-subtle border border-edge p-6 rounded-2xl flex flex-col items-center justify-center min-w-[220px] shadow-sm text-center self-stretch lg:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
              Curriculum Knowledge
            </span>
            <div className="text-4xl sm:text-5xl font-bold text-forest font-mono tracking-tight my-1">
              {knowledgeScore}
              <span className="text-lg text-ink-subtle font-sans font-normal"> / {maxScore}</span>
            </div>
            
            {/* Progress Bar Gauge */}
            <div className="w-full bg-edge/70 rounded-full h-2.5 overflow-hidden my-2 border border-edge">
              <div 
                className="bg-forest h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.max(4, scorePercentage)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-ink-muted">
              {scorePercentage}% Curriculum Mastery
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center space-x-1.5 border ${
                selectedCategory === cat.id
                  ? 'bg-forest text-canvas-white border-forest shadow-sm'
                  : 'bg-canvas-white text-ink-muted border-edge hover:text-ink'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.id ? 'bg-forest-light text-canvas-white' : 'bg-canvas-subtle text-ink-muted'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input & completion filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:flex-initial">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search missions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-canvas-white border border-edge rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-forest transition w-full md:w-52"
            />
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-canvas-white border border-edge text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                statusFilter === 'ALL' ? 'bg-forest text-canvas-white shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                statusFilter === 'UNREAD' ? 'bg-copper text-canvas-white shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                statusFilter === 'COMPLETED' ? 'bg-forest text-canvas-white shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* 3. LESSON CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLessons.map(lesson => {
          const isCompleted = lesson.is_completed;
          const quiz = lesson.quiz_stats;

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-250 cursor-pointer group shadow-sm hover:shadow-lg hover:-translate-y-1.5 bg-canvas-white ${
                isCompleted 
                  ? 'border-forest/40 hover:border-forest/80' 
                  : 'border-edge hover:border-forest/50'
              }`}
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-canvas-subtle text-ink-muted border border-edge">
                      #{lesson.id.toString().padStart(2, '0')}
                    </span>
                    <span className="text-ink-muted text-[11px] font-medium">{lesson.category}</span>
                  </div>

                  {isCompleted ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-canvas-subtle text-ink-muted border border-edge text-[10px] font-medium">
                      Unread
                    </span>
                  )}
                </div>

                {/* Lesson Title & Summary */}
                <h3 className="font-serif text-base font-bold text-ink group-hover:text-forest transition line-clamp-2">
                  {lesson.title}
                </h3>
                <p className="text-xs text-ink-muted mt-1.5 line-clamp-3 leading-relaxed">
                  {lesson.introduction}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-edge space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lesson.read_time}</span>
                  </div>

                  {quiz?.has_attempted ? (
                    <span className="font-mono text-[11px] font-semibold text-forest">
                      Quiz: {quiz.best_score}/{quiz.total_questions} ({quiz.percentage}%)
                    </span>
                  ) : (
                    <span className="text-[11px] text-copper font-medium">
                      Quiz Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-forest pt-1">
                  <span>{isCompleted ? 'Review Mission' : 'Start Mission'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
