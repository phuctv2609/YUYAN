import React, { useState } from 'react';
import { Languages, Lightbulb, ChevronRight, Mic, HelpCircle, ArrowRight, Volume2, Star } from 'lucide-react';
import { Lesson } from '../../data/hsk/types.ts';
import { lessonRepository } from '../../data/hsk/lessonRepository.ts';
import { useToast } from '../ui/Toast.tsx';

interface RightPedagogicalPanelProps {
  lesson: Lesson;
  onNavigateTab?: (tabName: string) => void;
}

export const RightPedagogicalPanel: React.FC<RightPedagogicalPanelProps> = ({ lesson, onNavigateTab }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar'>('vocab');

  // Find grammar section dynamically from lesson sections
  const grammarSection = lesson.sections?.find(
    (s) => s.title.includes('NGỮ PHÁP') || s.title.includes('语言点')
  );

  // Fetch authentic vocabulary from repository
  const vocabData = lessonRepository.getLessonVocabulary(lesson.level, lesson.lessonNumber);
  const vocabItems = vocabData?.vocabulary || [];

  // Extract key sample words from authentic vocabulary dataset
  const sampleWords = vocabItems.slice(0, 4).map((item, idx) => ({
    id: idx,
    hanzi: item['汉字'] || '',
    pinyin: item['Pinyin'] || '',
    meaning: item['Nghĩa tiếng Việt'] || '',
    pos: item['Từ loại'] || '',
    collocation: item['Cách kết hợp tự nhiên'] || item['Cụm từ cố định / collocation'] || '',
  }));

  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-shrink-0">
      {/* Switcher Tab between Vocab & Grammar */}
      <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle">
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'vocab' ? 'bg-surface text-primary shadow-2xs' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>Từ vựng trọng tâm</span>
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'grammar' ? 'bg-surface text-secondary shadow-2xs' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Ngữ pháp trọng tâm</span>
        </button>
      </div>

      {activeTab === 'vocab' ? (
        /* CARD 1: Key Vocabulary Focus */
        <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-divider-line pb-3">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-text-primary">Từ vựng trọng tâm</h2>
            </div>
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('Từ vựng');
                showToast(`Chuyển đến danh sách từ vựng HSK ${lesson.level} Bài ${lesson.lessonNumber}`, 'info');
              }}
              className="text-xs text-primary hover:underline flex items-center font-semibold"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* First expanded word card */}
          {sampleWords.length > 0 && (
            <div className="p-3.5 rounded-xl bg-primary-ultra-soft border border-primary-soft space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-hanzi text-2xl font-bold text-text-primary">{sampleWords[0].hanzi}</span>
                    <span className="text-sm font-medium text-primary">{sampleWords[0].pinyin}</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-soft text-deep-blue mt-1">
                    HSK {lesson.level} • Trọng tâm
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => showToast('Chưa có file phát âm từ vựng này', 'warning')}
                    className="p-1.5 rounded-lg bg-surface text-primary hover:bg-primary-soft border border-border-subtle shadow-2xs"
                    title="Phát âm từ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => showToast('Đã lưu từ vựng vào danh sách ghi nhớ', 'success')}
                    className="p-1.5 rounded-lg bg-surface text-amber-500 hover:bg-amber-50 border border-border-subtle shadow-2xs"
                    title="Lưu từ vựng"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-secondary">
                <strong className="text-text-primary">Nghĩa trong ngữ cảnh:</strong> {sampleWords[0].meaning}
              </p>
              {sampleWords[0].collocation && (
                <div className="text-xs bg-surface p-2 rounded-lg border border-border-subtle text-text-muted">
                  <span className="font-semibold text-text-muted block text-[10px] uppercase">Kết hợp tự nhiên:</span>
                  <span className="font-hanzi text-text-primary font-medium">{sampleWords[0].collocation}</span>
                </div>
              )}
            </div>
          )}

          {/* Subsequent compact words */}
          <div className="space-y-2">
            {sampleWords.slice(1).map((w) => (
              <div
                key={w.id}
                className="p-2.5 rounded-xl bg-surface-secondary/70 hover:bg-surface-secondary border border-border-subtle flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-hanzi text-lg font-bold text-text-primary">{w.hanzi}</span>
                    <span className="text-xs font-medium text-deep-blue">{w.pinyin}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 truncate max-w-[220px]">{w.meaning}</p>
                </div>
                <button
                  onClick={() => showToast(`Nghe từ "${w.hanzi}" (chưa có audio)`, 'warning')}
                  className="p-1.5 rounded-lg hover:bg-surface text-primary transition-colors"
                  title="Nghe âm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {vocabItems.length > 4 && (
            <div className="pt-2 border-t border-divider-line text-center">
              <button
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('Từ mới');
                  showToast(`Chuyển đến toàn bộ ${vocabItems.length} từ vựng của bài`, 'info');
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Xem thêm {vocabItems.length - 4} từ vựng khác →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* CARD 2: Key Grammar Focus */
        <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-divider-line pb-3">
            <Lightbulb className="w-5 h-5 text-secondary" />
            <h2 className="text-sm sm:text-base font-bold text-text-primary">Ngữ pháp trọng tâm</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed text-secondary">
                HSK {lesson.level}
              </span>
              <span className="text-xs sm:text-sm font-bold text-text-primary">
                {grammarSection?.title || `Trọng tâm ngữ pháp Bài ${lesson.lessonNumber}`}
              </span>
            </div>

            {grammarSection?.items && grammarSection.items.length > 0 ? (
              <div className="space-y-2 text-xs text-text-secondary">
                {grammarSection.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-coral-soft/40 rounded-xl border border-secondary-fixed/50">
                    <p className="font-medium text-text-primary">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-coral-soft/40 rounded-xl border border-secondary-fixed/50 text-center text-xs font-semibold text-secondary">
                Ngữ pháp và điểm mẫu câu được tích hợp trực tiếp trong bài khóa
              </div>
            )}
          </div>
        </div>
      )}

      {/* CARD 3: Fast Action Practice CTAs */}
      <div className="bg-gradient-to-br from-primary-ultra-soft to-surface rounded-2xl border border-primary/20 p-4 sm:p-5 shadow-2xs space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-text-primary">Luyện tập ngay sau bài</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => showToast('Tính năng luyện đọc đang được cập nhật', 'info')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border-subtle hover:border-secondary hover:bg-coral-soft/20 text-center group transition-all"
          >
            <Mic className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-bold text-text-primary">Luyện đọc</span>
            <span className="text-[10px] text-text-muted">Đọc diễn cảm</span>
          </button>
          <button
            onClick={() => showToast('Đang tạo bài tập trắc nghiệm từ câu bài khóa...', 'info')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border-subtle hover:border-primary hover:bg-primary-soft/30 text-center group transition-all"
          >
            <HelpCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-bold text-text-primary">Bài tập</span>
            <span className="text-[10px] text-text-muted">Trắc nghiệm</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (onNavigateTab) onNavigateTab('Từ vựng');
            showToast('Chuyển sang module Từ vựng', 'info');
          }}
          className="w-full py-2.5 px-4 bg-secondary hover:bg-coral-hover text-white text-xs font-bold rounded-full shadow-2xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
        >
          <span>Khám phá toàn bộ bài học</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
