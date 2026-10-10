import React, { useState, useEffect } from 'react';
import { Quote, Volume2, Sparkles, BookOpen } from 'lucide-react';
import { grammarRepository, GrammarPoint } from '../../data/repositories/grammarRepository';
import { audioManager } from '../../services/audio/index';
import { useToast } from '../ui/Toast';

export const GrammarPracticeView: React.FC = () => {
  const { showToast } = useToast();
  const [grammarList, setGrammarList] = useState<GrammarPoint[]>(() => grammarRepository.getAll());
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarPoint>(() => grammarRepository.getAll()[0]);
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

  useEffect(() => {
    // Attempt remote sync in background
    grammarRepository.fetchServer().then((list) => {
      if (list && list.length > 0) {
        setGrammarList(list);
        setSelectedGrammar((prev) => list.find((g) => g.id === prev.id) || list[0]);
      }
    });
  }, []);

  const filtered = selectedLevel === 'all'
    ? grammarList
    : grammarList.filter(g => g.level === selectedLevel);

  const handlePlayAudio = async (text: string) => {
    try {
      await audioManager.playText(text, {
        id: `grammar_${encodeURIComponent(text.slice(0, 10))}`,
        entityType: 'example',
      });
    } catch {
      showToast('Không thể phát âm thanh', 'warning');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold shadow-2xs">
            <Quote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Sổ tay Ngữ pháp HSK Chuẩn hóa (HSK 1–6)</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Hệ thống mẫu câu, công thức cấu trúc, ngữ dụng học thuật và ví dụ song ngữ chuẩn xác
            </p>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-motion ${
              selectedLevel === 'all'
                ? 'bg-secondary text-white shadow-2xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Tất cả ({grammarList.length})
          </button>
          {[1, 2, 3, 4, 5, 6].map((lvl) => {
            const count = grammarList.filter(g => g.level === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all btn-motion ${
                  selectedLevel === lvl
                    ? 'bg-secondary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                HSK {lvl} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Detail Card */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          {selectedGrammar ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-secondary-fixed text-secondary">
                  HSK {selectedGrammar.level}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                  {selectedGrammar.title}
                </h2>
              </div>

              {/* Formula Pattern Box */}
              <div className="p-4 rounded-xl bg-coral-soft/40 border border-secondary-fixed/60 space-y-1.5">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Cấu trúc công thức:</span>
                </span>
                <p className="font-mono text-sm sm:text-base font-bold text-text-primary">
                  {selectedGrammar.pattern}
                </p>
                {selectedGrammar.structureSummary && (
                  <p className="text-xs text-text-secondary font-sans font-medium">
                    Ký hiệu chuẩn: <code className="bg-surface px-1.5 py-0.5 rounded font-mono text-[11px]">{selectedGrammar.structureSummary}</code>
                  </p>
                )}
              </div>

              {/* Explanation */}
              <div className="space-y-1.5 text-xs sm:text-sm text-text-secondary leading-relaxed">
                <span className="font-bold text-text-primary">Ý nghĩa &amp; Cách dùng:</span>
                <p>{selectedGrammar.explanation}</p>
                {selectedGrammar.notes && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-text-secondary">
                    <strong className="text-amber-600 dark:text-amber-400">💡 Chú ý trọng tâm: </strong>
                    {selectedGrammar.notes}
                  </div>
                )}
              </div>

              {/* Bilingual Sentence Examples */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-text-primary">Ví dụ trong ngữ cảnh thực tế:</span>
                <div className="space-y-2.5">
                  {selectedGrammar.examples.map((ex, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-hanzi text-base sm:text-lg font-bold text-text-primary">{ex.hanzi}</p>
                        <p className="font-sans text-xs sm:text-sm font-semibold text-deep-blue">{ex.pinyin}</p>
                        <p className="text-xs text-text-secondary">{ex.vietnamese}</p>
                      </div>
                      <button
                        onClick={() => handlePlayAudio(ex.hanzi)}
                        className="p-2 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-white transition-colors flex-shrink-0"
                        title="Phát âm câu ví dụ"
                        aria-label="Phát âm câu ví dụ"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-text-muted">
              <p>Chọn một điểm ngữ pháp từ danh mục bên phải để xem chi tiết.</p>
            </div>
          )}
        </div>

        {/* Right: Grammar List Navigator */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3 card-motion">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">Danh mục ngữ pháp</h3>
            <span className="text-[11px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded">
              {filtered.length} điểm
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((item) => {
              const isSelected = selectedGrammar?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedGrammar(item)}
                  className={`w-full p-3 rounded-xl border text-left transition-all btn-motion ${
                    isSelected
                      ? 'bg-coral-soft/50 border-secondary text-secondary font-bold shadow-2xs'
                      : 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted block">HSK {item.level}</span>
                    <Sparkles className="w-3 h-3 text-secondary opacity-60" />
                  </div>
                  <p className="text-xs font-bold mt-0.5 line-clamp-1">{item.title}</p>
                  <p className="text-[11px] text-text-muted font-mono line-clamp-1 mt-0.5">{item.pattern}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
