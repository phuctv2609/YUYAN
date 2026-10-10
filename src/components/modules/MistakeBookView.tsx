import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { mistakeRepository, LearnerMistake } from '../../data/repositories/mistakeRepository';
import { useToast } from '../ui/Toast';

export const MistakeBookView: React.FC = () => {
  const { showToast } = useToast();
  const [mistakes, setMistakes] = useState<LearnerMistake[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    return mistakeRepository.subscribe(setMistakes);
  }, []);

  const categories = [
    { id: 'all', label: 'Tất cả câu sai' },
    { id: 'listening', label: 'Luyện nghe' },
    { id: 'vocabulary', label: 'Từ vựng' },
    { id: 'grammar', label: 'Ngữ pháp' },
    { id: 'exam', label: 'Kiểm tra & Thi' },
  ];

  const filteredMistakes = mistakes.filter((m) => {
    if (m.resolved) return false;
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    return true;
  });

  const handleResolve = (id: string) => {
    mistakeRepository.resolveMistake(id);
    showToast('Đã đánh dấu đã hiểu và ôn tập xong!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                  Sổ tay câu sai (错题本)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  {filteredMistakes.length} câu cần ôn
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Tự động thu thập các câu trả lời sai trong bài test, luyện nghe và ngữ pháp để khắc phục điểm yếu
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                selectedCategory === c.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mistake List */}
      <div className="space-y-4">
        {filteredMistakes.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-3xl border border-border-subtle space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-text-primary">Tuyệt vời! Hiện không có câu sai nào</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Khi bạn làm bài kiểm tra hoặc luyện nghe và chọn chưa đúng, câu hỏi sẽ tự động được lưu vào đây để ôn tập.
            </p>
          </div>
        ) : (
          filteredMistakes.map((m, idx) => (
            <div
              key={m.id}
              className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-2xs space-y-4 card-motion"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-secondary text-text-muted uppercase">
                        {m.category}
                      </span>
                      {m.lessonKey && (
                        <span className="text-xs text-text-muted font-medium">
                          {m.lessonKey}
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-base font-bold text-text-primary mt-1">
                      {m.prompt}
                    </p>
                    {m.contextText && (
                      <p className="font-hanzi text-xs sm:text-sm text-text-secondary mt-1 bg-surface-secondary/70 p-2 rounded-lg border border-border-subtle inline-block">
                        {m.contextText}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleResolve(m.id)}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0"
                  title="Đã nắm vững câu này"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Đã hiểu</span>
                </button>
              </div>

              {/* Contrast Answers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300">
                  <span className="font-bold block mb-0.5">Bạn đã chọn:</span>
                  <span>{m.userAnswer || '(Chưa chọn)'}</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold block mb-0.5">Đáp án đúng:</span>
                  <span>{m.correctAnswer}</span>
                </div>
              </div>

              {/* Explanation */}
              {m.explanation && (
                <div className="p-3.5 bg-primary-soft/50 rounded-xl border border-primary/20 text-xs text-text-secondary">
                  <strong className="text-primary font-bold">Giải thích: </strong>
                  {m.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
