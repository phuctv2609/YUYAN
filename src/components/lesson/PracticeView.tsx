import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell,
  Check,
  RotateCcw,
  Volume2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Lesson, Sentence } from '../../data/hsk/types.ts';
import { audioManager } from '../../services/audio/index.ts';
import { useToast } from '../ui/Toast.tsx';

interface PracticeViewProps {
  lesson: Lesson;
}

interface TokenItem {
  id: string;
  text: string;
}

// Tokenize a Chinese sentence into pedagogical chunks
function tokenizeChineseSentence(text: string): string[] {
  const clean = text.trim();
  if (clean.length <= 4) {
    // Single / dual char tokens
    return clean.split('').filter(Boolean);
  }

  // Tokenize into 2-3 char chunks while respecting punctuation
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    // If next character is punctuation, attach to previous chunk
    if (/[，。！？；：,.!?;:]/.test(clean[i])) {
      if (chunks.length > 0) {
        chunks[chunks.length - 1] += clean[i];
      } else {
        chunks.push(clean[i]);
      }
      i++;
      continue;
    }

    // Determine chunk length (2 to 3 chars)
    let len = 2;
    if (i + 3 <= clean.length && !/[，。！？；：,.!?;:]/.test(clean[i + 2])) {
      // If remaining length is odd, prefer 3
      if ((clean.length - i) % 2 !== 0 && (clean.length - i) >= 3) {
        len = 3;
      }
    }
    const token = clean.slice(i, i + len);
    chunks.push(token);
    i += len;
  }

  return chunks;
}

// Pseudo-random shuffle ensuring it differs from original
function shuffleTokens(tokens: string[]): string[] {
  if (tokens.length <= 1) return [...tokens];
  let shuffled = [...tokens];
  let attempts = 0;
  while (attempts < 10) {
    shuffled = [...tokens].sort(() => Math.random() - 0.5);
    if (shuffled.join('') !== tokens.join('')) {
      return shuffled;
    }
    attempts++;
  }
  return shuffled.reverse();
}

export const PracticeView: React.FC<PracticeViewProps> = ({ lesson }) => {
  const { showToast } = useToast();
  const sentences: Sentence[] = useMemo(() => lesson.lessonText || [], [lesson]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [mode, setMode] = useState<'reorder' | 'flashcard'>('reorder');

  // Reorder state
  const currentSentence = sentences[currentIndex];
  const [availableTokens, setAvailableTokens] = useState<TokenItem[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<TokenItem[]>([]);
  const [evaluation, setEvaluation] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [masteredSentences, setMasteredSentences] = useState<Set<number>>(new Set());

  // Flashcard state
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Initialize tokens when current sentence changes
  useEffect(() => {
    if (!currentSentence) return;
    const rawTokens = tokenizeChineseSentence(currentSentence.hanzi);
    const shuffled = shuffleTokens(rawTokens);
    setAvailableTokens(shuffled.map((t, idx) => ({ id: `token-${idx}-${t}`, text: t })));
    setSelectedTokens([]);
    setEvaluation(null);
    setShowAnswer(false);
    setIsFlipped(false);
  }, [currentIndex, currentSentence]);

  if (!currentSentence) {
    return (
      <div className="w-full p-8 text-center bg-surface rounded-2xl border border-border-subtle shadow-2xs">
        <p className="text-sm font-bold text-text-primary">Chưa có câu luyện tập cho bài học này</p>
      </div>
    );
  }

  const handlePlayAudio = async (text: string) => {
    try {
      await audioManager.playText(text, {
        id: `practice_hsk${lesson.level}_bai${lesson.lessonNumber}_s${currentSentence.index}`,
        entityType: 'sentence',
        entityId: `${lesson.level}_${lesson.lessonNumber}_${currentSentence.index}`,
      });
    } catch {
      showToast('Không thể phát âm thanh', 'warning');
    }
  };

  const handleSelectToken = (token: TokenItem) => {
    if (evaluation === 'correct') return;
    setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));
    setSelectedTokens((prev) => [...prev, token]);
    setEvaluation(null);
  };

  const handleDeselectToken = (token: TokenItem) => {
    if (evaluation === 'correct') return;
    setSelectedTokens((prev) => prev.filter((t) => t.id !== token.id));
    setAvailableTokens((prev) => [...prev, token]);
    setEvaluation(null);
  };

  const handleReset = () => {
    const rawTokens = tokenizeChineseSentence(currentSentence.hanzi);
    const shuffled = shuffleTokens(rawTokens);
    setAvailableTokens(shuffled.map((t, idx) => ({ id: `token-${idx}-${t}`, text: t })));
    setSelectedTokens([]);
    setEvaluation(null);
    setShowAnswer(false);
  };

  const handleCheckAnswer = () => {
    const assembled = selectedTokens.map((t) => t.text).join('').replace(/\s+/g, '');
    const target = currentSentence.hanzi.replace(/\s+/g, '');

    if (assembled === target) {
      setEvaluation('correct');
      setMasteredSentences((prev) => new Set(prev).add(currentSentence.index));
      showToast('Chính xác! Bạn đã xếp câu hoàn chỉnh!', 'success');
      handlePlayAudio(currentSentence.hanzi);
    } else {
      setEvaluation('incorrect');
      showToast('Thứ tự chưa chính xác, hãy thử lại hoặc xem gợi ý!', 'warning');
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
    const targetTokens = tokenizeChineseSentence(currentSentence.hanzi);
    setSelectedTokens(targetTokens.map((t, idx) => ({ id: `ans-${idx}-${t}`, text: t })));
    setAvailableTokens([]);
    setEvaluation('correct');
    handlePlayAudio(currentSentence.hanzi);
  };

  const handleNextSentence = () => {
    if (currentIndex + 1 < sentences.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      showToast('Bạn đã hoàn thành tất cả câu luyện tập của bài học!', 'success');
      setCurrentIndex(0);
    }
  };

  const handlePrevSentence = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Top Header & Mode Tabs */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                Luyện tập câu • HSK {lesson.level} Bài {lesson.lessonNumber}
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Xếp câu chuẩn ngữ pháp hoặc lật thẻ phản xạ từ bài khóa &ldquo;{lesson.title}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-soft text-primary">
              Câu {currentIndex + 1} / {sentences.length}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Đã thuộc: {masteredSentences.size}
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 pt-1 border-t border-border-subtle/80">
          <button
            onClick={() => setMode('reorder')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'reorder'
                ? 'bg-primary text-white shadow-2xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Xếp câu tương tác</span>
          </button>
          <button
            onClick={() => setMode('flashcard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'flashcard'
                ? 'bg-primary text-white shadow-2xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thẻ lật phản xạ</span>
          </button>
        </div>
      </div>

      {mode === 'reorder' ? (
        /* REORDER MODE */
        <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-xs space-y-6">
          {/* Sentence Prompt: Meaning */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Nghĩa tiếng Việt cần ghép:
              </span>
              <button
                onClick={() => handlePlayAudio(currentSentence.hanzi)}
                className="p-1.5 rounded-lg bg-surface hover:bg-primary-soft text-text-secondary hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium"
                title="Nghe mẫu phát âm câu"
                aria-label="Nghe mẫu phát âm câu"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Nghe câu</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-bold text-text-primary">
              {currentSentence.vietnamese}
            </p>
          </div>

          {/* Construction Slot Area */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary block">
              Khung câu đang ghép:
            </span>
            <div
              className={`min-h-[72px] p-4 rounded-2xl border-2 flex flex-wrap items-center gap-2 transition-all ${
                evaluation === 'correct'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : evaluation === 'incorrect'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-dashed border-border-subtle bg-surface-secondary/30'
              }`}
            >
              {selectedTokens.length === 0 ? (
                <span className="text-xs text-text-muted italic">
                  Chạm vào các từ bên dưới theo đúng thứ tự để xếp câu...
                </span>
              ) : (
                selectedTokens.map((token, idx) => (
                  <button
                    key={`${token.id}-${idx}`}
                    onClick={() => handleDeselectToken(token)}
                    className="px-3.5 py-2 rounded-xl bg-surface border border-primary/30 text-primary hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all font-hanzi text-base font-bold shadow-2xs animate-fadeIn"
                    title="Nhấn để gỡ từ này"
                  >
                    {token.text}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Evaluation / Revealed Pinyin Box */}
          {evaluation === 'correct' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>{showAnswer ? 'Đáp án mẫu chuẩn:' : 'Hoàn thành xuất sắc!'}</span>
              </div>
              <p className="font-hanzi text-lg font-bold text-text-primary">{currentSentence.hanzi}</p>
              <p className="text-xs font-semibold text-deep-blue">{currentSentence.pinyin}</p>
            </div>
          )}

          {evaluation === 'incorrect' && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>Thứ tự từ chưa chính xác. Bạn hãy thử lại hoặc xem đáp án.</span>
              </div>
              <button
                onClick={handleRevealAnswer}
                className="px-3 py-1 rounded-xl bg-surface border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem đáp án</span>
              </button>
            </div>
          )}

          {/* Word Bank Area */}
          <div className="space-y-2 pt-2 border-t border-border-subtle/80">
            <span className="text-xs font-bold text-text-secondary block">
              Kho từ chưa chọn:
            </span>
            <div className="flex flex-wrap gap-2.5 min-h-[48px]">
              {availableTokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleSelectToken(token)}
                  className="px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-primary-soft text-text-primary hover:text-primary border border-border-subtle text-base font-bold font-hanzi transition-all shadow-2xs hover:scale-105 active:scale-95"
                >
                  {token.text}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border-subtle text-xs font-semibold text-text-secondary flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại</span>
              </button>
              {evaluation !== 'correct' && (
                <button
                  onClick={handleRevealAnswer}
                  className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border-subtle text-xs font-semibold text-text-secondary flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem đáp án</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {evaluation === 'correct' ? (
                <button
                  onClick={handleNextSentence}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedTokens.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Kiểm tra câu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* FLASHCARD MODE */
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full min-h-[280px] bg-surface rounded-3xl border border-border-subtle p-6 sm:p-10 shadow-md flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-all select-none relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-surface-secondary text-text-muted">
              Câu #{currentSentence.index}
            </span>
            <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'Đang hiện đáp án' : 'Nhấn để lật thẻ'}</span>
            </span>
          </div>

          <div className="my-auto py-6 text-center space-y-4">
            <p className="font-hanzi text-2xl sm:text-3xl font-bold text-text-primary leading-relaxed">
              {currentSentence.hanzi}
            </p>

            {isFlipped && (
              <div className="pt-4 border-t border-border-subtle space-y-2 animate-fadeIn">
                <p className="text-base font-semibold text-deep-blue">
                  {currentSentence.pinyin}
                </p>
                <p className="text-sm text-text-secondary font-medium">
                  {currentSentence.vietnamese}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/60">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio(currentSentence.hanzi);
              }}
              className="p-2 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-white transition-colors"
              title="Phát âm thanh câu"
              aria-label="Phát âm thanh câu"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevSentence();
                }}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl bg-surface border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-40"
                title="Câu trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextSentence();
                }}
                className="p-2 rounded-xl bg-surface border border-border-subtle text-text-secondary hover:text-text-primary"
                title="Câu sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
