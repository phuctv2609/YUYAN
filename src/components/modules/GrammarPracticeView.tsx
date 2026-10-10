import React, { useState, useEffect, useMemo } from 'react';
import {
  Quote,
  Volume2,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Bot,
  Send,
  Loader2,
  HelpCircle,
  GitCompare,
  Eye,
  EyeOff,
  Compass,
  FileCheck2,
} from 'lucide-react';
import {
  grammarRepository,
  GrammarPoint,
  GrammarExercise,
} from '../../data/repositories/grammarRepository';
import { audioManager } from '../../services/audio/index';
import { aiApiService } from '../../services/ai/aiApiService';
import { learningProgressService } from '../../services/progress/learningProgressService';
import { useToast } from '../ui/Toast';

export const GRAMMAR_CATEGORY_VI: Record<string, string> = {
  '语素': 'Hình vị (Morphemes)',
  '词类': 'Từ loại (Word Classes)',
  '短语': 'Cụm từ (Đoản ngữ)',
  '句子成分': 'Thành phần câu',
  '句子的类型': 'Các loại câu',
  '动作的态': 'Trạng thái hành động',
  '特殊表达法': 'Cách biểu đạt đặc biệt',
  '固定格式': 'Kết cấu cố định',
  '语段（句群）': 'Ngữ đoạn & Nhóm câu',
  '副词': 'Phó từ',
  '介词': 'Giới từ',
  '连词': 'Liên từ',
  '助词': 'Trợ từ',
  '动词': 'Động từ',
  '形容词': 'Tính từ',
  '代词': 'Đại từ',
  '量词': 'Lượng từ',
  '数词': 'Số từ',
  '叹词': 'Thán từ',
  '拟声词': 'Từ tượng thanh',
  '前缀': 'Tiền tố',
  '后缀': 'Hậu tố',
  '主语': 'Chủ ngữ',
  '谓语': 'Vị ngữ',
  '宾语': 'Tân ngữ',
  '定语': 'Định ngữ',
  '状语': 'Trạng ngữ',
  '补语': 'Bổ ngữ',
};

export function formatGrammarCategory(category: string): string {
  if (!category) return '';
  return GRAMMAR_CATEGORY_VI[category] || category;
}

export const GrammarPracticeView: React.FC = () => {
  const { showToast } = useToast();
  
  // HSK Version State: 'hsk3' (default, modern standard) or 'hsk2'
  const [hskVersion, setHskVersion] = useState<'hsk3' | 'hsk2'>('hsk3');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'formulas' | 'mistakes' | 'quiz' | 'ai'>('formulas');
  
  // Display Visibility Toggles
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);

  // Grammar points list for chosen version
  const [grammarList, setGrammarList] = useState<GrammarPoint[]>(() =>
    grammarRepository.getByVersionAndLevel('hsk3', 'all')
  );
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarPoint | null>(() => {
    const list = grammarRepository.getByVersionAndLevel('hsk3', 'all');
    return list[0] || null;
  });

  // Interactive Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  // Contextual AI Grammar Assistant state
  const [aiMode, setAiMode] = useState<'explain_simple' | 'explain_deep' | 'generate_examples' | 'compare' | 'quiz' | 'custom_query'>('explain_simple');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [customAiQuery, setCustomAiQuery] = useState<string>('');
  const [compareInput, setCompareInput] = useState<string>('');

  // Synchronize grammar list on version change
  useEffect(() => {
    const list = grammarRepository.getByVersionAndLevel(hskVersion, selectedLevel);
    setGrammarList(list);
    setSelectedCategory('all');
    if (list.length > 0) {
      setSelectedGrammar(list[0]);
    } else {
      setSelectedGrammar(null);
    }
  }, [hskVersion, selectedLevel]);

  // Categories present in current list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    grammarList.forEach((g) => {
      if (g.category) cats.add(g.category);
    });
    return Array.from(cats);
  }, [grammarList]);

  // Filtered grammar points
  const filtered = useMemo(() => {
    return grammarList.filter((g) => {
      if (selectedCategory !== 'all' && g.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        g.title.toLowerCase().includes(q) ||
        g.pattern.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.subCategory && g.subCategory.toLowerCase().includes(q)) ||
        (g.meaningVi && g.meaningVi.toLowerCase().includes(q)) ||
        g.examples.some(
          (ex) =>
            ex.hanzi.includes(q) ||
            (ex.vietnamese && ex.vietnamese.toLowerCase().includes(q))
        )
      );
    });
  }, [grammarList, selectedCategory, searchQuery]);

  // Audio Playback
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

  // Interactive Quiz Handlers
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

  // AI Grammar Assistant Request Handler
  const handleTriggerGrammarAi = async (mode: typeof aiMode, customText?: string) => {
    if (!selectedGrammar) return;
    setAiLoading(true);
    setAiMode(mode);
    setAiResponse(null);

    try {
      const result = await aiApiService.askGrammarAi({
        mode,
        grammarPoint: selectedGrammar,
        comparePattern: compareInput.trim() || undefined,
        customQuery: customText || customAiQuery.trim() || undefined,
      });
      setAiResponse(result);
    } catch (err: any) {
      showToast(err?.message || 'Không thể kết nối dịch vụ AI', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner & Version Selector */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-5 card-motion light-beam-shimmer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Quote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                Sổ tay Ngữ pháp Nguồn Chuẩn HSK 3.0 & 2.0
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Dữ liệu nguồn chuẩn hóa GF0025-2021 & Hanban 2015, công thức ba thể, phân tích lỗi người Việt và Trợ lý AI chuyên sâu.
              </p>
            </div>
          </div>

          {/* HSK Version Switcher Pills */}
          <div className="flex p-1 bg-surface-secondary rounded-xl border border-border-subtle text-xs font-bold shrink-0 self-start md:self-auto">
            <button
              onClick={() => {
                setHskVersion('hsk3');
                setSelectedLevel('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                hskVersion === 'hsk3'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              HSK 3.0 (Chuẩn mới Cấp 1–9)
            </button>
            <button
              onClick={() => {
                setHskVersion('hsk2');
                setSelectedLevel('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                hskVersion === 'hsk2'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              HSK 2.0 (Truyền thống Cấp 1–6)
            </button>
          </div>
        </div>

        {/* Level Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-divider-line">
          <span className="text-2xs font-bold text-text-muted uppercase tracking-wider mr-1">
            Cấp độ:
          </span>
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-motion ${
              selectedLevel === 'all'
                ? 'bg-secondary text-white shadow-2xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Tất cả ({grammarList.length})
          </button>

          {[1, 2, 3, 4, 5, 6].map((lvl) => {
            const count = grammarList.filter(
              (g) => (g.normalizedLevel || g.level) === lvl
            ).length;
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
                Cấp {lvl} ({count})
              </button>
            );
          })}

          {hskVersion === 'hsk3' && (
            <button
              onClick={() => setSelectedLevel(7)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all btn-motion ${
                selectedLevel === 7
                  ? 'bg-secondary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              Cấp cao 7–9 ({grammarList.filter((g) => (g.normalizedLevel || g.level) === 7).length})
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Detail + List Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Detail Card (8 cols) */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          {selectedGrammar ? (
            <>
              {/* Header Info & Provenance Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider-line pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-secondary-fixed text-secondary">
                    {selectedGrammar.bandLabel || `HSK ${selectedGrammar.level}`}
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border-subtle flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3 text-status-success" />
                    {selectedGrammar.syllabusEdition || 'GF0025-2021'}
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-primary-soft text-primary">
                    {formatGrammarCategory(selectedGrammar.category)}
                  </span>
                  {selectedGrammar.subCategory && (
                    <span className="text-2xs font-medium px-2 py-0.5 rounded bg-surface-secondary text-text-muted">
                      {formatGrammarCategory(selectedGrammar.subCategory)}
                    </span>
                  )}
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex flex-wrap p-1 bg-surface-secondary rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('formulas')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'formulas'
                        ? 'bg-surface text-primary shadow-xs font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Cấu trúc & Ví dụ
                  </button>
                  <button
                    onClick={() => setActiveTab('mistakes')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'mistakes'
                        ? 'bg-surface text-primary shadow-xs font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Lỗi người Việt ({selectedGrammar.commonMistakes?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'quiz'
                        ? 'bg-surface text-primary shadow-xs font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Trắc nghiệm tự luyện ({selectedGrammar.practiceExercises?.length || 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai');
                      if (!aiResponse) {
                        handleTriggerGrammarAi('explain_simple');
                      }
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      activeTab === 'ai'
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'text-primary hover:bg-surface'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Gia sư AI
                  </button>
                </div>
              </div>

              {/* Title & Pattern Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                    {selectedGrammar.title}
                  </h2>
                  {/* Pinyin & Translation Toggle Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowPinyin(!showPinyin)}
                      title={showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}
                      className={`p-1.5 rounded-lg border text-2xs font-bold transition-colors flex items-center gap-1 ${
                        showPinyin
                          ? 'bg-primary-soft text-primary border-primary/30'
                          : 'bg-surface-secondary text-text-muted border-border-subtle'
                      }`}
                    >
                      {showPinyin ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>Pinyin</span>
                    </button>
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      title={showTranslation ? 'Ẩn tiếng Việt' : 'Hiện tiếng Việt'}
                      className={`p-1.5 rounded-lg border text-2xs font-bold transition-colors flex items-center gap-1 ${
                        showTranslation
                          ? 'bg-primary-soft text-primary border-primary/30'
                          : 'bg-surface-secondary text-text-muted border-border-subtle'
                      }`}
                    >
                      {showTranslation ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>Dịch nghĩa</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle font-mono text-sm font-bold text-secondary-hover flex items-center justify-between">
                  <span>{selectedGrammar.pattern}</span>
                  <span className="text-2xs font-sans text-text-muted font-normal">
                    {selectedGrammar.sourceUrl ? 'Nguồn chuẩn hóa' : 'Biên soạn độc lập'}
                  </span>
                </div>
              </div>

              {/* TAB 1: FORMULAS AND BILINGUAL EXAMPLES */}
              {activeTab === 'formulas' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Detailed Three-Pattern Breakdown */}
                  {(selectedGrammar.positivePattern ||
                    selectedGrammar.negativePattern ||
                    selectedGrammar.interrogativePattern) && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Quy tắc cấu trúc 3 thể (Ba dạng câu)
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {selectedGrammar.positivePattern && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                              (+) Khẳng định
                            </span>
                            <span className="font-mono text-text-primary pt-0.5">
                              {selectedGrammar.positivePattern}
                            </span>
                          </div>
                        )}
                        {selectedGrammar.negativePattern && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded font-bold bg-red-500/20 text-red-700 dark:text-red-300 shrink-0">
                              (-) Phủ định
                            </span>
                            <span className="font-mono text-text-primary pt-0.5">
                              {selectedGrammar.negativePattern}
                            </span>
                          </div>
                        )}
                        {selectedGrammar.interrogativePattern && (
                          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 shrink-0">
                              (?) Nghi vấn
                            </span>
                            <span className="font-mono text-text-primary pt-0.5">
                              {selectedGrammar.interrogativePattern}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Explanation Description */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      Giải nghĩa & Ngữ cảnh áp dụng
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/40 p-3.5 rounded-xl border border-border-subtle">
                      {selectedGrammar.explanation || selectedGrammar.meaningVi}
                    </p>
                  </div>

                  {/* Examples List with Audio */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                      <span>Ví dụ thực hành ({selectedGrammar.examples.length})</span>
                      <span className="text-2xs text-text-muted lowercase">
                        click loa để nghe phát âm Bắc Kinh
                      </span>
                    </h3>
                    <div className="space-y-2.5">
                      {selectedGrammar.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-surface-secondary/40 border border-border-subtle hover:bg-surface-secondary/70 transition-colors flex items-start justify-between gap-3 group"
                        >
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-text-primary">
                              {ex.hanzi}
                            </div>
                            {showPinyin && ex.pinyin && (
                              <div className="text-xs font-mono text-secondary">
                                {ex.pinyin}
                              </div>
                            )}
                            {showTranslation && ex.vietnamese && (
                              <div className="text-xs text-text-secondary">
                                {ex.vietnamese}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handlePlayAudio(ex.hanzi)}
                            title="Nghe phát âm chuẩn"
                            className="p-2 rounded-lg bg-surface text-secondary hover:bg-secondary hover:text-white border border-border-subtle shadow-xs transition-all shrink-0 mt-0.5"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
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
                    <div className="p-8 text-center text-xs text-text-muted space-y-2">
                      <Compass className="w-8 h-8 text-text-muted mx-auto opacity-50" />
                      <p>Chưa có ghi nhận lỗi sai đặc thù cho điểm ngữ pháp này.</p>
                      <button
                        onClick={() => {
                          setActiveTab('ai');
                          handleTriggerGrammarAi('explain_deep');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary-soft text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                      >
                        Hỏi Gia sư AI về các lỗi sai thường gặp
                      </button>
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
                              let optClass =
                                'bg-surface-secondary/50 border-border-subtle text-text-primary hover:bg-surface-secondary';

                              if (isDone) {
                                if (optIdx === ex.correctAnswer) {
                                  optClass =
                                    'bg-status-success/15 border-status-success text-status-success font-bold';
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
                    <div className="p-8 text-center text-xs text-text-muted space-y-3">
                      <HelpCircle className="w-8 h-8 text-text-muted mx-auto opacity-50" />
                      <p>Chưa có câu hỏi trắc nghiệm tạo sẵn cho mục này.</p>
                      <button
                        onClick={() => {
                          setActiveTab('ai');
                          handleTriggerGrammarAi('quiz');
                        }}
                        className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold shadow-xs hover:bg-secondary-hover transition-colors"
                      >
                        Yêu cầu Gia sư AI tạo bài tập trắc nghiệm mới
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CONTEXTUAL AI GRAMMAR ASSISTANT */}
              {activeTab === 'ai' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Action Buttons Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleTriggerGrammarAi('explain_simple')}
                      disabled={aiLoading}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        aiMode === 'explain_simple'
                          ? 'bg-primary-soft border-primary text-primary shadow-xs'
                          : 'bg-surface-secondary/50 border-border-subtle text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Giải thích dễ hiểu</span>
                    </button>

                    <button
                      onClick={() => handleTriggerGrammarAi('explain_deep')}
                      disabled={aiLoading}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        aiMode === 'explain_deep'
                          ? 'bg-primary-soft border-primary text-primary shadow-xs'
                          : 'bg-surface-secondary/50 border-border-subtle text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>Phân tích chuyên sâu</span>
                    </button>

                    <button
                      onClick={() => handleTriggerGrammarAi('generate_examples')}
                      disabled={aiLoading}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        aiMode === 'generate_examples'
                          ? 'bg-primary-soft border-primary text-primary shadow-xs'
                          : 'bg-surface-secondary/50 border-border-subtle text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      <Quote className="w-4 h-4 text-emerald-500" />
                      <span>Tạo thêm 3 ví dụ</span>
                    </button>

                    <button
                      onClick={() => handleTriggerGrammarAi('quiz')}
                      disabled={aiLoading}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        aiMode === 'quiz'
                          ? 'bg-primary-soft border-primary text-primary shadow-xs'
                          : 'bg-surface-secondary/50 border-border-subtle text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 text-purple-500" />
                      <span>Tạo bài trắc nghiệm</span>
                    </button>
                  </div>

                  {/* Comparison Input Row */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-secondary/40 border border-border-subtle">
                    <GitCompare className="w-4 h-4 text-secondary shrink-0" />
                    <input
                      type="text"
                      value={compareInput}
                      onChange={(e) => setCompareInput(e.target.value)}
                      placeholder="Nhập cấu trúc muốn so sánh (vd: 不 vs 没, 就 vs 才...)"
                      className="bg-transparent text-xs text-text-primary flex-1 focus:outline-hidden"
                    />
                    <button
                      onClick={() => handleTriggerGrammarAi('compare')}
                      disabled={aiLoading || !compareInput.trim()}
                      className="px-3 py-1 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-secondary-hover disabled:opacity-40 transition-colors"
                    >
                      So sánh
                    </button>
                  </div>

                  {/* AI Output Area */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface-secondary/50 border border-border-subtle min-h-[160px] space-y-3">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-text-primary">
                          Phản hồi của Gia sư AI YUYAN
                        </span>
                      </div>
                      <span className="text-2xs text-text-muted">
                        Mô hình Gemini Pedagogical Engine
                      </span>
                    </div>

                    {aiLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-text-muted text-xs">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>Đang phân tích cấu trúc ngữ pháp...</span>
                      </div>
                    ) : aiResponse ? (
                      <div className="text-xs text-text-primary leading-relaxed space-y-3">
                        {aiMode === 'generate_examples' && aiResponse?.examples ? (
                          <div className="space-y-2">
                            {aiResponse.examples.map((ex: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1"
                              >
                                <div className="text-sm font-bold text-text-primary">
                                  {ex.hanzi}
                                </div>
                                <div className="text-xs font-mono text-secondary">
                                  {ex.pinyin}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  {ex.vietnamese}
                                </div>
                                {ex.context && (
                                  <div className="text-2xs text-text-muted italic">
                                    Ngữ cảnh: {ex.context}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : aiMode === 'quiz' && aiResponse?.quizzes ? (
                          <div className="space-y-3">
                            {aiResponse.quizzes.map((qz: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2"
                              >
                                <div className="font-bold text-text-primary">
                                  Câu {idx + 1}: {qz.question}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {qz.options?.map((opt: string, optIdx: number) => (
                                    <div
                                      key={optIdx}
                                      className={`p-2 rounded-lg border text-2xs ${
                                        optIdx === qz.correctAnswer
                                          ? 'bg-status-success/15 border-status-success text-status-success font-bold'
                                          : 'bg-surface-secondary border-border-subtle'
                                      }`}
                                    >
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                                <div className="text-2xs text-text-secondary bg-surface-secondary p-2 rounded-lg">
                                  <strong>Giải thích: </strong> {qz.explanation}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {typeof aiResponse === 'string'
                              ? aiResponse
                              : aiResponse?.rawText || JSON.stringify(aiResponse, null, 2)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-text-muted text-xs">
                        Bấm một trong các nút thao tác nhanh ở trên để nhận phân tích tức thì từ AI.
                      </div>
                    )}
                  </div>

                  {/* Custom Grammar Question Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customAiQuery}
                      onChange={(e) => setCustomAiQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customAiQuery.trim()) {
                          handleTriggerGrammarAi('custom_query', customAiQuery.trim());
                        }
                      }}
                      placeholder="Đặt câu hỏi riêng về điểm ngữ pháp này..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-surface-secondary text-xs text-text-primary border border-border-subtle focus:outline-hidden focus:border-primary"
                    />
                    <button
                      onClick={() => handleTriggerGrammarAi('custom_query', customAiQuery.trim())}
                      disabled={aiLoading || !customAiQuery.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Hỏi AI</span>
                    </button>
                  </div>
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
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3 card-motion flex flex-col h-[740px]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Danh mục ({filtered.length})
            </h3>
            <span className="text-2xs font-bold px-2 py-0.5 rounded bg-surface-secondary text-secondary">
              {hskVersion === 'hsk3' ? 'HSK 3.0' : 'HSK 2.0'}
            </span>
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

          {/* Category Filter Pills */}
          {availableCategories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-2xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-semibold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-secondary text-white'
                    : 'bg-surface-secondary text-text-muted hover:text-text-primary'
                }`}
              >
                Tất cả loại
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-secondary text-white'
                      : 'bg-surface-secondary text-text-muted hover:text-text-primary'
                  }`}
                >
                  {formatGrammarCategory(cat)}
                </button>
              ))}
            </div>
          )}

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
                    setAiResponse(null);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-secondary-fixed/50 border-secondary shadow-xs'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border-subtle">
                      {g.bandLabel || `HSK ${g.level}`}
                    </span>
                    <span className="text-2xs text-text-muted truncate max-w-[120px]">
                      {formatGrammarCategory(g.category)}
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
