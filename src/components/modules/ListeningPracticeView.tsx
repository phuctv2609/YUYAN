import React, { useState, useMemo } from 'react';
import {
  Headphones,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { lessonRepository } from '../../data/hsk/lessonRepository';
import { vocabularyRepository } from '../../data/repositories/vocabularyRepository';
import { audioManager } from '../../services/audio';
import { mistakeRepository } from '../../data/repositories/mistakeRepository';
import { progressRepository } from '../../data/repositories/progressRepository';
import { learningProgressService } from '../../services/progress/learningProgressService';
import { useToast } from '../ui/Toast';

interface ListeningQuestion {
  id: number;
  audioText: string;
  pinyin: string;
  vietnamese: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  lessonTitle: string;
}

export const ListeningPracticeView: React.FC<{ onOpenLesson?: (lvl: number, num: number) => void }> = () => {
  const { showToast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);

  // Generate authentic listening questions from real lesson sentences and vocabulary
  const questions: ListeningQuestion[] = useMemo(() => {
    const list: ListeningQuestion[] = [];
    const levelVocab = vocabularyRepository.search({ hskLevel: selectedLevel });
    const lessons = lessonRepository.getLessonsByLevel(selectedLevel);

    let qId = 1;

    // 1. Generate questions from clean dialogue sentences
    for (const lesson of lessons) {
      if (list.length >= 5) break;
      for (const s of lesson.lessonText) {
        if (list.length >= 5) break;
        const cleanH = s.hanzi.replace(/^[^：:]+[：:]\s*/, '').trim();
        const cleanV = s.vietnamese.replace(/^[^：:]+[：:]\s*/, '').trim();
        const cleanP = s.pinyin.replace(/^[^：:]+[：:]\s*/, '').trim();

        if (cleanH.length >= 4 && cleanH.length <= 40 && cleanV.length >= 4) {
          const distractors: string[] = [];
          for (const ds of lesson.lessonText) {
            const dV = ds.vietnamese.replace(/^[^：:]+[：:]\s*/, '').trim();
            if (dV && dV !== cleanV && !distractors.includes(dV)) {
              distractors.push(dV);
              if (distractors.length >= 3) break;
            }
          }
          if (distractors.length < 3) continue;

          const correctIndex = qId % 4;
          const options = [...distractors];
          options.splice(correctIndex, 0, cleanV);

          list.push({
            id: qId++,
            audioText: cleanH,
            pinyin: cleanP,
            vietnamese: cleanV,
            prompt: 'Nghe đoạn hội thoại tiếng Trung và chọn nghĩa câu chính xác:',
            options,
            correctIndex,
            lessonTitle: `HSK ${lesson.level} Bài ${lesson.lessonNumber}`,
          });
        }
      }
    }

    // 2. Generate questions from vocabulary items
    for (let i = 0; i < levelVocab.length && list.length < 8; i += 2) {
      const target = levelVocab[i];
      const targetHanzi = target['汉字'] || '';
      const targetVn = target['Nghĩa tiếng Việt'] || '';
      if (!targetHanzi || !targetVn) continue;

      const distractors: string[] = [];
      for (let j = 1; j < 15 && distractors.length < 3; j++) {
        const d = levelVocab[(i + j * 4) % levelVocab.length];
        const dMeaning = d?.['Nghĩa tiếng Việt'];
        if (dMeaning && dMeaning !== targetVn && !distractors.includes(dMeaning)) {
          distractors.push(dMeaning);
        }
      }
      if (distractors.length < 3) continue;

      const correctIndex = qId % 4;
      const options = [...distractors];
      options.splice(correctIndex, 0, targetVn);

      list.push({
        id: qId++,
        audioText: targetHanzi,
        pinyin: target['Pinyin'] || '',
        vietnamese: targetVn,
        prompt: 'Nghe phát âm từ vựng tiếng Trung và chọn nghĩa tiếng Việt chính xác:',
        options,
        correctIndex,
        lessonTitle: `HSK ${selectedLevel} • Từ vựng Bài ${target.lessonNumber}`,
      });
    }

    return list;
  }, [selectedLevel]);

  const currentQ = questions[currentIndex];

  const handlePlayAudio = () => {
    if (!currentQ) return;
    audioManager.playText(currentQ.audioText, {
      id: `listen_q_${currentQ.id}`,
      entityType: 'sentence',
      entityId: String(currentQ.id),
      pinyin: currentQ.pinyin,
    });
  };

  const handleSelectOption = (idx: number) => {
    if (hasSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || hasSubmitted || !currentQ) return;

    setHasSubmitted(true);
    setAnsweredCount((prev) => prev + 1);

    const isCorrect = selectedOption === currentQ.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      showToast('Chính xác! Bạn nghe rất tốt.', 'success');
      progressRepository.addStudyMinutes(2, 'listening');
      void learningProgressService.recordExerciseCompleted({
        type: 'listening',
        entityId: String(currentQ.id),
        score: 100,
        durationMinutes: 2,
      });
    } else {
      showToast('Chưa chính xác. Đã lưu câu này vào Sổ tay câu sai.', 'warning');
      mistakeRepository.addMistake({
        category: 'listening',
        prompt: `Nghe phát âm: "${currentQ.audioText}" (${currentQ.pinyin})`,
        contextText: currentQ.audioText,
        userAnswer: currentQ.options[selectedOption] || '',
        correctAnswer: currentQ.options[currentQ.correctIndex],
        explanation: `Đoạn phát âm chuẩn là "${currentQ.audioText}" (${currentQ.pinyin}), nghĩa tiếng Việt: "${currentQ.vietnamese}".`,
        lessonKey: currentQ.lessonTitle,
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasSubmitted(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setScore(0);
    setAnsweredCount(0);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                Luyện nghe tiếng Trung (听力训练)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                Mandarin zh-CN
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Luyện phản xạ thính giác với ngữ liệu bài khóa chuẩn xác 146 bài học HSK
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
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                selectedLevel === lvl
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle'
              }`}
            >
              Luyện nghe HSK {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      {currentQ ? (
        <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">
              Câu hỏi {currentIndex + 1} / {questions.length} ({currentQ.lessonTitle})
            </span>
            <span className="text-xs font-semibold text-text-secondary">
              Đúng: <strong className="text-primary">{score}</strong> / {answeredCount}
            </span>
          </div>

          {/* Central Audio Play Button */}
          <div className="py-6 px-4 bg-surface-secondary/60 rounded-2xl border border-border-subtle text-center space-y-3">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {currentQ.prompt}
            </p>

            <button
              onClick={handlePlayAudio}
              className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center mx-auto shadow-md hover:scale-105 active:scale-95 transition-all"
              title="Bấm để nghe đoạn phát âm"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <p className="text-[11px] text-text-muted">
              Bấm vào nút loa để nghe đoạn âm thanh tiếng Trung chuẩn
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const isCorrect = optIdx === currentQ.correctIndex;

              let btnStyle = 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary';
              if (hasSubmitted) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-800 dark:text-red-300';
                }
              } else if (isSelected) {
                btnStyle = 'bg-primary-soft border-primary text-primary font-bold shadow-2xs';
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={hasSubmitted}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm transition-all ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center bg-surface-secondary border border-border-subtle text-text-muted">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {hasSubmitted && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                  {hasSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {hasSubmitted && (
            <div className="p-4 bg-primary-soft/60 rounded-2xl border border-primary/20 space-y-1 text-xs">
              <p className="font-bold text-primary">Giải thích nội dung:</p>
              <p className="font-hanzi text-sm text-text-primary">
                {currentQ.audioText} ({currentQ.pinyin})
              </p>
              <p className="text-text-secondary">Dịch nghĩa: {currentQ.vietnamese}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-divider-line">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold text-text-muted hover:text-text-primary rounded-xl flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bắt đầu lại</span>
            </button>

            {!hasSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                  selectedOption !== null
                    ? 'bg-secondary hover:bg-coral-hover text-white active:scale-95'
                    : 'bg-surface-secondary text-text-muted cursor-not-allowed'
                }`}
              >
                Kiểm tra đáp án
              </button>
            ) : currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Hoàn thành bài luyện ({score}/{questions.length})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-surface rounded-2xl border border-border-subtle">
          <p className="text-xs text-text-muted">Đang tải câu hỏi luyện nghe...</p>
        </div>
      )}
    </div>
  );
};
