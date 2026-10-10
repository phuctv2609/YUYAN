import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Layers, Quote, Brain, Dumbbell, CheckSquare, ArrowLeft, FileText } from 'lucide-react';
import { Lesson } from '../../data/hsk/types.ts';

interface LessonHeaderProps {
  lesson: Lesson;
  totalLessonsInLevel: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onBackToCourse: () => void;
  activeModuleTab: string;
  onSelectModuleTab: (tab: string) => void;
  onSelectLevel: (level: number) => void;
  onSelectLessonNumber: (lessonNum: number) => void;
  vocabCount?: number;
  hasReading?: boolean;
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({
  lesson,
  totalLessonsInLevel,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onBackToCourse,
  activeModuleTab,
  onSelectModuleTab,
  onSelectLevel,
  onSelectLessonNumber,
  vocabCount,
  hasReading,
}) => {
  const tabs = [
    { id: 'bài khóa', label: 'Bài khóa', count: `${lesson.lessonText.length} câu`, icon: BookOpen },
    { id: 'từ mới', label: 'Từ mới', count: vocabCount ? `${vocabCount} từ` : undefined, icon: Layers },
    { id: 'đoạn văn', label: 'Đoạn văn', count: hasReading ? 'Đọc hiểu' : undefined, icon: FileText },
    { id: 'ngữ pháp', label: 'Ngữ pháp', count: undefined, icon: Quote },
    { id: 'lý thuyết', label: 'Lý thuyết', count: undefined, icon: Brain },
    { id: 'luyện tập', label: 'Luyện tập', count: undefined, icon: Dumbbell },
    { id: 'kiểm tra', label: 'Kiểm tra', count: undefined, icon: CheckSquare },
  ];

  const progressPercent = Math.round((lesson.lessonNumber / totalLessonsInLevel) * 100);

  return (
    <section className="bg-surface border-b border-border-subtle px-4 sm:px-8 pt-4 pb-0 flex-shrink-0 shadow-2xs">
      <div className="max-w-[1440px] mx-auto">
        {/* Top Control Bar: Breadcrumb, Selectors & Prev/Next */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Breadcrumb & Level Selector */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={onBackToCourse}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary hover:bg-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Giáo trình HSK {lesson.level}</span>
            </button>

            <span className="text-text-muted text-xs">/</span>

            {/* Level Selector Dropdown */}
            <select
              value={lesson.level}
              onChange={(e) => onSelectLevel(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:bg-surface-secondary cursor-pointer focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((lvl) => (
                <option key={lvl} value={lvl} className="bg-surface text-text-primary">
                  HSK {lvl}
                </option>
              ))}
            </select>

            {/* Lesson Quick Dropdown */}
            <select
              value={lesson.lessonNumber}
              onChange={(e) => onSelectLessonNumber(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-secondary text-text-primary border border-border-subtle cursor-pointer focus:outline-none"
            >
              {Array.from({ length: totalLessonsInLevel }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Bài {n}
                </option>
              ))}
            </select>
          </div>

          {/* Lesson Switcher & Progress */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted hidden sm:inline">Tiến độ bài học:</span>
              <div className="w-24 sm:w-32 h-2 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary">{progressPercent}%</span>
            </div>

            <div className="h-4 w-[1px] bg-divider-line" />

            {/* Prev/Next Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                className={`p-1.5 rounded-lg border transition-colors ${
                  hasPrevious
                    ? 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-secondary cursor-pointer'
                    : 'border-border-subtle/50 text-text-muted/40 cursor-not-allowed'
                }`}
                title={hasPrevious ? 'Bài trước' : 'Đây là bài đầu tiên'}
                aria-label="Bài trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className={`p-1.5 rounded-lg border transition-colors ${
                  hasNext
                    ? 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-secondary cursor-pointer'
                    : 'border-border-subtle/50 text-text-muted/40 cursor-not-allowed'
                }`}
                title={hasNext ? 'Bài tiếp theo' : 'Đây là bài cuối cùng'}
                aria-label="Bài tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Lesson Title & Context Tag */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
              <span className="text-primary">Bài {lesson.lessonNumber}:</span>
              <span className="font-hanzi">{lesson.title}</span>
            </h1>
            <span className="text-xs sm:text-sm text-text-secondary">
              (HSK {lesson.level} • {lesson.sourceFile})
            </span>
          </div>

          <span className="text-xs text-text-muted bg-surface-secondary px-3 py-1 rounded-full border border-border-subtle">
            Bối cảnh: Chuẩn HSK {lesson.level} • {lesson.lessonText.length} câu hoàn chỉnh
          </span>
        </div>

        {/* Horizontal Module Tabs */}
        <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto custom-scrollbar border-b border-transparent">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeModuleTab === tab.id ||
              (tab.id === 'từ mới' && activeModuleTab === 'từ vựng');
            return (
              <button
                key={tab.id}
                data-testid={`lesson-tab-${tab.id}`}
                onClick={() => onSelectModuleTab(tab.id)}
                className={`pb-3 border-b-2 text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary font-medium'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isActive ? 'bg-primary-soft text-primary' : 'bg-surface-secondary text-text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
