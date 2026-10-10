import React, { useState, useEffect } from 'react';
import {
  Quote,
  Volume2,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  grammarRepository,
  GrammarPoint,
  GrammarExercise,
} from '../../data/repositories/grammarRepository';
import { audioManager } from '../../services/audio/index';
import { learningProgressService } from '../../services/progress/learningProgressService';
import { useToast } from '../ui/Toast';

export const GrammarPracticeView: React.FC = () => {
  const { showToast } = useToast();
  const [grammarList, setGrammarList] = useState<GrammarPoint[]>(() => grammarRepository.getAll());
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarPoint>(() => grammarRepository.getAll()[0]);
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'formulas' | 'mistakes' | 'quiz'>('formulas');

  // Interactive Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    grammarRepository.fetchServer().then((list) => {
      if (list && list.length > 0) {
        setGrammarList(list);
        setSelectedGrammar((prev) => list.find((g) => g.id === prev?.id) || list[0]);
      }
    });
  }, []);

  const filtered = React.useMemo(() => {
    return grammarList.filter((g) => {
      const matchLvl = selectedLevel === 'all' || g.level === selectedLevel;
      if (!matchLvl) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        g.title.toLowerCase().includes(q) ||
        g.pattern.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.examples.some((ex) => ex.hanzi.includes(q) || ex.vietnamese.toLowerCase().includes(q))
      );
    });
  }, [grammarList, selectedLevel, searchQuery]);

  const handlePlayAudio = async (text: string) => {
    try {
      await audioManager.playText(text, {
        id: `grammar_${encodeURIComponent(text.slice(0, 10))}`,
        entityType: 'example',
        rate: 0.9,
      });
    } catch {
      showToast('Không thể phát âm thanh', 'warning');
    }
  };

  const handleSelectQuizOption = (exerciseId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [exerciseId]: optionIndex }));
  };

  const handleSubmitQuiz = (exercise: GrammarExercise) => {
    const selected = quizAnswers[exercise.id];
    if (selected === undefined) {
      showToast('Vui lòng chọn một đáp án trước khi kiểm tra!', 'warning');
      return;
    }

    setQuizSubmitted((prev) => ({ ...prev, [exercise.id]: true }));
    const isCorrect = selected === exercise.correctAnswer;

    if (isCorrect) {
      showToast('Chính xác! Bạn đã nắm vững điểm ngữ pháp này.', 'success');
      void learningProgressService.recordExerciseCompleted({
        type: 'grammar',
        entityId: exercise.id,
        score: 100,
        durationMinutes: 1,
      });
    } else {
      showToast('Chưa chính xác, hãy xem phần giải thích bên dưới.', 'error');
    }
  };

  const handleResetQuiz = (exerciseId: string) => {
    setQuizAnswers((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    setQuizSubmitted((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold shadow-2xs">
            <Quote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              Sổ tay Ngữ pháp Chuẩn hóa GF0025-2021 & HSK 1–6
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Hệ thống công thức khẳng định - phủ định - nghi vấn, ví dụ đối chiếu và cảnh báo lỗi sai thường gặp của người Việt
            </p>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-divider-line">
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
            const count = grammarList.filter((g) => g.level === lvl).length;
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

      {/* Main Grid: Detail + List Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Detail Card (8 cols) */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          {selectedGrammar ? (
            <>
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-secondary-fixed text-secondary">
                    HSK {selectedGrammar.level}
                  </span>
                  {selectedGrammar.gfLevel && (
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-muted border border-border-subtle">
                      {selectedGrammar.gfLevel}
                    </span>
                  )}
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-primary-soft text-primary">
                    {selectedGrammar.category}
                  </span>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex p-1 bg-surface-secondary rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('formulas')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'formulas' ? 'bg-surface text-primary shadow-xs font-bold' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Cấu trúc & Ví dụ
                  </button>
                  <button
                    onClick={() => setActiveTab('mistakes')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'mistakes' ? 'bg-surface text-primary shadow-xs font-bold' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Lỗi người Việt ({selectedGrammar.commonMistakes?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'quiz' ? 'bg-surface text-primary shadow-xs font-bold' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Luyện tập ({selectedGrammar.practiceExercises?.length || 0})
                  </button>
                </div>
              </div>

              {/* Title & Core Explanation */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                  {selectedGrammar.title}
                </h2>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  {selectedGrammar.explanation}
                </p>
              </div>

              {/* TAB 1: FORMULAS & EXAMPLES */}
              {activeTab === 'formulas' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Master Formula Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-secondary-fixed/30 border border-secondary/20 space-y-3">
                    <div className="text-2xs font-bold uppercase tracking-wider text-secondary">
                      Công thức tổng quát
                    </div>
                    <div className="font-mono text-sm sm:text-base font-bold text-secondary-hover bg-surface px-4 py-2.5 rounded-xl border border-secondary/10">
                      {selectedGrammar.pattern}
                    </div>

                    {/* Positive / Negative / Question Patterns Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      {selectedGrammar.positivePattern && (
                        <div className="p-2.5 rounded-xl bg-surface border border-border-subtle">
                          <span className="text-2xs font-bold text-status-success block mb-0.5">
                            Khẳng định (+)
                          </span>
                          <span className="font-mono text-2xs text-text-primary">
                            {selectedGrammar.positivePattern}
                          </span>
                        </div>
                      )}
                      {selectedGrammar.negativePattern && (
                        <div className="p-2.5 rounded-xl bg-surface border border-border-subtle">
                          <span className="text-2xs font-bold text-red-500 block mb-0.5">
                            Phủ định (-)
                          </span>
                          <span className="font-mono text-2xs text-text-primary">
                            {selectedGrammar.negativePattern}
                          </span>
                        </div>
                      )}
                      {selectedGrammar.interrogativePattern && (
                        <div className="p-2.5 rounded-xl bg-surface border border-border-subtle">
                          <span className="text-2xs font-bold text-primary block mb-0.5">
                            Nghi vấn (?)
                          </span>
                          <span className="font-mono text-2xs text-text-primary">
                            {selectedGrammar.interrogativePattern}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bilingual Examples Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>Ví dụ ngữ cảnh chuẩn ({selectedGrammar.examples.length})</span>
                    </h3>

                    <div className="space-y-2.5">
                      {selectedGrammar.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle flex items-start justify-between gap-3 group hover:border-border transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-hanzi text-base sm:text-lg font-bold text-text-primary">
                              {ex.hanzi}
                            </p>
                            <p className="text-xs font-mono font-medium text-primary">
                              {ex.pinyin}
                            </p>
                            <p className="text-xs text-text-secondary">{ex.vietnamese}</p>
                          </div>
                          <button
                            onClick={() => handlePlayAudio(ex.hanzi)}
                            className="p-2 rounded-xl bg-surface hover:bg-primary-soft hover:text-primary text-text-muted transition-colors shadow-2xs shrink-0"
                            title="Nghe phát âm tiếng Trung"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pedagogical Notes */}
                  {selectedGrammar.notes && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong>Lưu ý ngữ dụng: </strong>
                        <span>{selectedGrammar.notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COMMON VIETNAMESE LEARNER PITFALLS */}
              {activeTab === 'mistakes' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {selectedGrammar.commonMistakes && selectedGrammar.commonMistakes.length > 0 ? (
                    selectedGrammar.commonMistakes.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-subtle space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{m.wrong}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{m.correct}</span>
                          </div>
                        </div>
                        <div className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/70 p-3 rounded-xl border border-border-subtle">
                          <strong className="text-text-primary">Phân tích lỗi can thiệp: </strong>
                          {m.reason}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-text-muted">
                      Chưa có ghi nhận lỗi sai đặc thù cho điểm ngữ pháp này.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INTERACTIVE QUIZ */}
              {activeTab === 'quiz' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {selectedGrammar.practiceExercises && selectedGrammar.practiceExercises.length > 0 ? (
                    selectedGrammar.practiceExercises.map((ex, idx) => {
                      const selectedOption = quizAnswers[ex.id];
                      const isDone = quizSubmitted[ex.id];
                      const isCorrect = selectedOption === ex.correctAnswer;

                      return (
                        <div
                          key={ex.id}
                          className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary-soft">
                              Câu hỏi {idx + 1}
                            </span>
                            {isDone && (
                              <span
                                className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                                  isCorrect
                                    ? 'bg-status-success/15 text-status-success'
                                    : 'bg-red-500/15 text-red-500'
                                }`}
                              >
                                {isCorrect ? 'Chính xác (+100đ)' : 'Chưa đúng'}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-text-primary leading-snug">
                            {ex.question}
                          </h4>

                          {/* Options */}
                          <div className="space-y-2">
                            {ex.options.map((opt, optIdx) => {
                              const isChecked = selectedOption === optIdx;
                              let optClass = 'bg-surface-secondary/50 border-border-subtle text-text-primary hover:bg-surface-secondary';

                              if (isDone) {
                                if (optIdx === ex.correctAnswer) {
                                  optClass = 'bg-status-success/15 border-status-success text-status-success font-bold';
                                } else if (isChecked && !isCorrect) {
                                  optClass = 'bg-red-500/15 border-red-500 text-red-500 font-bold';
                                }
                              } else if (isChecked) {
                                optClass = 'bg-primary-soft border-primary text-primary font-bold shadow-xs';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  onClick={() => !isDone && handleSelectQuizOption(ex.id, optIdx)}
                                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${optClass}`}
                                >
                                  <span>{opt}</span>
                                  {isDone && optIdx === ex.correctAnswer && (
                                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Submit / Reset Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            {!isDone ? (
                              <button
                                onClick={() => handleSubmitQuiz(ex)}
                                disabled={selectedOption === undefined}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-40"
                              >
                                Kiểm tra đáp án
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResetQuiz(ex.id)}
                                className="px-3 py-1.5 rounded-xl bg-surface-secondary text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Làm lại</span>
                              </button>
                            )}

                            {isDone && (
                              <div className="text-xs text-text-secondary bg-surface-secondary p-3 rounded-xl border border-border-subtle flex-1 ml-4">
                                <strong>Giải thích: </strong>
                                {ex.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-text-muted">
                      Chưa có câu hỏi trắc nghiệm cho điểm ngữ pháp này.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-text-muted text-xs">
              Chọn một điểm ngữ pháp bên phải để bắt đầu học.
            </div>
          )}
        </div>

        {/* Right: Grammar Points List Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3 card-motion flex flex-col h-[680px]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Danh mục ({filtered.length})
            </h3>
            <span className="text-2xs text-text-muted">HSK 1–6</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo cấu trúc, tên gọi..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-secondary rounded-xl border border-border-subtle focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Scrollable Points List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filtered.map((g) => {
              const isSelected = selectedGrammar?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => {
                    setSelectedGrammar(g);
                    setActiveTab('formulas');
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-secondary-fixed/50 border-secondary shadow-xs'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border-subtle">
                      HSK {g.level}
                    </span>
                    <span className="text-2xs text-text-muted truncate max-w-[120px]">
                      {g.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-text-primary text-xs leading-snug">{g.title}</h4>
                  <p className="text-2xs font-mono text-secondary-hover mt-1 truncate">
                    {g.pattern}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
