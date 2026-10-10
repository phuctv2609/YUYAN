import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Volume2,
  ChevronRight,
  MoveHorizontal,
} from 'lucide-react';
import { lessonRepository } from '../../data/hsk/lessonRepository';
import { audioManager } from '../../services/audio';
import { mistakeRepository } from '../../data/repositories/mistakeRepository';
import { progressRepository } from '../../data/repositories/progressRepository';
import { useToast } from '../ui/Toast';

interface OrderingExercise {
  id: number;
  originalHanzi: string;
  originalPinyin: string;
  vietnamese: string;
  tokens: string[];
  lessonTitle: string;
}

export const SentenceOrderingView: React.FC = () => {
  const { showToast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [chosenTokens, setChosenTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Generate authentic sentence ordering exercises from lessons
  const exercises: OrderingExercise[] = useMemo(() => {
    const lessons = lessonRepository.getLessonsByLevel(selectedLevel);
    const list: OrderingExercise[] = [];

    let exId = 1;
    for (const l of lessons) {
      for (const s of l.lessonText) {
        const cleanH = s.hanzi.replace(/^[^：:]+[：:]\s*/, '').trim();
        const cleanV = s.vietnamese.replace(/^[^：:]+[：:]\s*/, '').trim();
        const cleanP = s.pinyin.replace(/^[^：:]+[：:]\s*/, '').trim();

        if (cleanH.length >= 6 && cleanH.length <= 25 && cleanV.length >= 4) {
          const pureHanzi = cleanH.replace(/[，。！？：:、“”"''\s]/g, '');
          if (pureHanzi.length < 5) continue;

          // Break into 3-5 logical segments
          const segments: string[] = [];
          const chunkSize = Math.max(2, Math.floor(pureHanzi.length / 4));
          for (let i = 0; i < pureHanzi.length; i += chunkSize) {
            segments.push(pureHanzi.slice(i, i + chunkSize));
          }

          if (segments.length >= 3) {
            list.push({
              id: exId++,
              originalHanzi: pureHanzi,
              originalPinyin: cleanP,
              vietnamese: cleanV,
              tokens: segments,
              lessonTitle: `HSK ${l.level} Bài ${l.lessonNumber}`,
            });
            if (list.length >= 10) break;
          }
        }
      }
      if (list.length >= 10) break;
    }
    return list;
  }, [selectedLevel]);

  const currentExercise = exercises[currentIdx];

  // Initialize available tokens (shuffled) when exercise changes
  React.useEffect(() => {
    if (currentExercise) {
      const shuffled = [...currentExercise.tokens].sort(() => 0.5 - Math.random());
      setAvailableTokens(shuffled);
      setChosenTokens([]);
      setIsSubmitted(false);
      setIsCorrect(false);
    }
  }, [currentExercise, currentIdx]);

  const handlePickToken = (token: string, index: number) => {
    if (isSubmitted) return;
    setChosenTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveToken = (token: string, index: number) => {
    if (isSubmitted) return;
    setChosenTokens((prev) => prev.filter((_, i) => i !== index));
    setAvailableTokens((prev) => [...prev, token]);
  };

  const handleSubmit = () => {
    if (!currentExercise || isSubmitted) return;

    const assembled = chosenTokens.join('');
    const target = currentExercise.originalHanzi;
    const correct = assembled === target;

    setIsSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      showToast('Hoàn toàn chính xác! Ngữ pháp rất chuẩn.', 'success');
      progressRepository.addStudyMinutes(1, 'general');
    } else {
      showToast('Thứ tự chưa đúng. Hãy xem câu mẫu và thử lại!', 'warning');
      mistakeRepository.addMistake({
        category: 'grammar',
        prompt: `Sắp xếp câu: "${currentExercise.vietnamese}"`,
        contextText: `Bạn ghép: "${assembled}"`,
        userAnswer: assembled,
        correctAnswer: target,
        explanation: `Thứ tự đúng chuẩn: "${target}" (${currentExercise.originalPinyin}).`,
        lessonKey: currentExercise.lessonTitle,
      });
    }
  };

  const handlePlayAudio = () => {
    if (currentExercise) {
      audioManager.playText(currentExercise.originalHanzi, {
        id: `order_${currentExercise.id}`,
        entityType: 'sentence',
        entityId: String(currentExercise.id),
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
            <MoveHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                Sắp xếp câu tiếng Trung (连词成句)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                Ngữ pháp thực chiến
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Ghép các thành phần ngữ pháp thành câu chuẩn xác theo cấu trúc ngữ pháp HSK
            </p>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 text-xs">
          {[1, 2, 3, 4, 5, 6].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                setCurrentIdx(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                selectedLevel === lvl
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle'
              }`}
            >
              HSK {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Workspace */}
      {currentExercise && (
        <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">
              Bài tập {currentIdx + 1} / {exercises.length} ({currentExercise.lessonTitle})
            </span>
            <button
              onClick={handlePlayAudio}
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
              title="Nghe câu hoàn chỉnh"
            >
              <Volume2 className="w-4 h-4" />
              <span>Nghe câu mẫu</span>
            </button>
          </div>

          {/* Meaning Prompt */}
          <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Dịch nghĩa câu cần ghép:
            </span>
            <p className="text-sm sm:text-base font-bold text-text-primary">
              "{currentExercise.vietnamese}"
            </p>
          </div>

          {/* Chosen Tokens Drop Zone */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-muted">
              Thứ tự các từ đã ghép (Bấm vào từ để trả lại):
            </span>
            <div className="min-h-[72px] p-4 rounded-2xl bg-surface border-2 border-dashed border-primary/30 flex flex-wrap items-center gap-2">
              {chosenTokens.length === 0 ? (
                <span className="text-xs text-text-muted italic">
                  Chưa chọn từ nào. Hãy bấm các khối bên dưới để ghép vào đây.
                </span>
              ) : (
                chosenTokens.map((tok, idx) => (
                  <button
                    key={`chosen-${idx}`}
                    onClick={() => handleRemoveToken(tok, idx)}
                    disabled={isSubmitted}
                    className="px-4 py-2 bg-primary-soft hover:bg-red-50 text-primary hover:text-red-600 border border-primary/30 hover:border-red-300 rounded-xl font-hanzi font-bold text-base sm:text-lg transition-all animate-in zoom-in-95 duration-100"
                  >
                    {tok}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Available Word Blocks */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-muted">
              Các từ khả dụng (Bấm để chọn):
            </span>
            <div className="flex flex-wrap gap-2.5">
              {availableTokens.map((tok, idx) => (
                <button
                  key={`avail-${idx}`}
                  onClick={() => handlePickToken(tok, idx)}
                  disabled={isSubmitted}
                  className="px-4 py-2 bg-surface hover:bg-surface-secondary border border-border-subtle text-text-primary rounded-xl font-hanzi font-bold text-base sm:text-lg shadow-2xs hover:scale-105 active:scale-95 transition-all"
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>

          {/* Result Alert if submitted */}
          {isSubmitted && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1 ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{isCorrect ? 'Ghép câu chính xác!' : 'Thứ tự chưa đúng!'}</span>
              </div>
              <p className="font-hanzi text-sm pt-1">
                Đáp án chuẩn: <strong className="font-bold">{currentExercise.originalHanzi}</strong>
              </p>
              <p className="text-text-muted">Phiên âm: {currentExercise.originalPinyin}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-divider-line">
            <button
              onClick={() => {
                const shuffled = [...currentExercise.tokens].sort(() => 0.5 - Math.random());
                setAvailableTokens(shuffled);
                setChosenTokens([]);
                setIsSubmitted(false);
              }}
              className="px-3 py-2 text-xs font-semibold text-text-muted hover:text-text-primary rounded-xl flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xếp lại</span>
            </button>

            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={chosenTokens.length === 0}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                  chosenTokens.length > 0
                    ? 'bg-secondary hover:bg-coral-hover text-white active:scale-95'
                    : 'bg-surface-secondary text-text-muted cursor-not-allowed'
                }`}
              >
                Kiểm tra câu
              </button>
            ) : currentIdx < exercises.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((p) => p + 1)}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(0)}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Hoàn thành tất cả các câu
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
